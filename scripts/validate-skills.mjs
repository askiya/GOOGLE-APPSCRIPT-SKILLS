import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const skillsRoot = path.join(root, 'skills');
const errors = [];
const warnings = [];
const names = new Set();
const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function read(file) {
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
}

function parseFrontmatter(content, file) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    fail(`${file}: missing YAML frontmatter`);
    return {};
  }

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!field) continue;
    let value = field[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[field[1]] = value;
  }
  return data;
}

function validateEval(file, skillName) {
  if (!fs.existsSync(file)) {
    fail(`${skillName}: missing evals/evals.json`);
    return;
  }
  try {
    const payload = JSON.parse(read(file));
    if (payload.skill_name !== skillName) {
      fail(`${skillName}: eval skill_name must match directory name`);
    }
    if (!Array.isArray(payload.evals) || payload.evals.length < 2) {
      fail(`${skillName}: include at least two eval prompts`);
    }
    for (const item of payload.evals || []) {
      if (!Number.isInteger(item.id) || !item.prompt || !item.expected_output || !Array.isArray(item.files)) {
        fail(`${skillName}: malformed eval item ${JSON.stringify(item)}`);
      }
    }
  } catch (error) {
    fail(`${skillName}: invalid eval JSON (${error.message})`);
  }
}

function validateAgentYaml(file, skillName) {
  if (!fs.existsSync(file)) {
    fail(`${skillName}: missing agents/openai.yaml`);
    return;
  }
  const content = read(file);
  for (const field of ['display_name:', 'short_description:', 'default_prompt:']) {
    if (!content.includes(field)) fail(`${skillName}: openai.yaml missing ${field}`);
  }
}

function validateLocalLinks(file) {
  const content = read(file)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '');
  const links = [...content.matchAll(/\[[^\]]*\]\((?!https?:|mailto:|#)([^)]+)\)/g)];
  for (const [, rawTarget] of links) {
    const target = decodeURIComponent(rawTarget.split('#')[0].trim());
    if (!target) continue;
    const resolved = path.resolve(path.dirname(file), target);
    if (!fs.existsSync(resolved)) {
      fail(`${path.relative(root, file)}: broken local link ${rawTarget}`);
    }
  }
}

if (!fs.existsSync(skillsRoot)) {
  fail('skills/ directory is missing');
} else {
  const skillDirs = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (skillDirs.length < 1) fail('No skills found');

  for (const entry of skillDirs) {
    const skillName = entry.name;
    const skillRoot = path.join(skillsRoot, skillName);
    const skillFile = path.join(skillRoot, 'SKILL.md');

    if (!kebab.test(skillName)) fail(`${skillName}: directory name must be kebab-case`);
    if (!fs.existsSync(skillFile)) {
      fail(`${skillName}: missing SKILL.md`);
      continue;
    }

    const content = read(skillFile);
    const meta = parseFrontmatter(content, path.relative(root, skillFile));
    if (meta.name !== skillName) fail(`${skillName}: frontmatter name must match directory`);
    if (!meta.description || meta.description.length < 50) fail(`${skillName}: description is too short`);
    if (meta.description?.length > 700) warn(`${skillName}: description exceeds 700 characters`);
    if (names.has(meta.name)) fail(`${skillName}: duplicate skill name`);
    names.add(meta.name);

    const lines = content.split(/\r?\n/).length;
    if (lines > 500) fail(`${skillName}: SKILL.md has ${lines} lines; keep it under 500`);
    if (!/^#\s+.+/m.test(content)) fail(`${skillName}: SKILL.md needs a level-one heading`);
    if (!/^##\s+.*(?:workflow|process)/im.test(content)) {
      warn(`${skillName}: no clearly named workflow section`);
    }
    if (/\b(TODO|FIXME|YOUR_(?:TOKEN|SECRET|PASSWORD))\b/.test(content)) {
      fail(`${skillName}: unresolved placeholder or risky secret marker in SKILL.md`);
    }

    validateEval(path.join(skillRoot, 'evals', 'evals.json'), skillName);
    validateAgentYaml(path.join(skillRoot, 'agents', 'openai.yaml'), skillName);
    validateLocalLinks(skillFile);
  }
}

const pluginFile = path.join(root, '.codex-plugin', 'plugin.json');
if (!fs.existsSync(pluginFile)) {
  fail('Missing .codex-plugin/plugin.json');
} else {
  try {
    const plugin = JSON.parse(read(pluginFile));
    if (plugin.name !== 'google-appscript-skills') fail('Unexpected plugin name');
    if (!/^\d+\.\d+\.\d+$/.test(plugin.version || '')) fail('Plugin version must be strict semver');
    if (plugin.skills !== './skills/') fail('Plugin skills path must be ./skills/');
  } catch (error) {
    fail(`Invalid plugin JSON (${error.message})`);
  }
}

for (const doc of ['README.md', 'README.en.md', 'CONTRIBUTING.md', 'SECURITY.md']) {
  const file = path.join(root, doc);
  if (!fs.existsSync(file)) fail(`Missing ${doc}`);
  else validateLocalLinks(file);
}

for (const message of warnings) console.warn(`WARN  ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);

if (errors.length) {
  console.error(`\nValidation failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
  process.exit(1);
}

console.log(`Validated ${names.size} skills, plugin metadata, evals, and repository links.`);
if (warnings.length) console.log(`Completed with ${warnings.length} warning(s).`);
