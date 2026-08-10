#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HTML_EXTENSIONS = new Set(['.html', '.htm']);
const IGNORED_DIRECTORIES = new Set(['.git', '.next', 'build', 'coverage', 'dist', 'node_modules']);
const SEVERITIES = ['P1', 'P2', 'P3'];

function lineAt(source, index) {
  return source.slice(0, Math.max(0, index)).split(/\r?\n/).length;
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`(?:^|[\\s<])${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : null;
}

function hasAttribute(tag, name) {
  return new RegExp(`(?:^|[\\s<])${name}(?:\\s*=|\\s|/?>)`, 'i').test(tag);
}

function isInsideLabel(source, index) {
  const before = source.slice(0, index).toLowerCase();
  return before.lastIndexOf('<label') > before.lastIndexOf('</label>');
}

function redactSnippet(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/((?:api[_-]?key|client[_-]?secret|access[_-]?token|authorization)\s*[:=]\s*)[^\s>]+/gi, '$1[REDACTED]')
    .trim()
    .slice(0, 180);
}

function addFinding(findings, source, file, index, id, severity, message, snippet = '') {
  findings.push({
    id,
    severity,
    file,
    line: lineAt(source, index),
    message,
    ...(snippet ? { evidence: redactSnippet(snippet) } : {}),
  });
}

function stripMarkup(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/&(?:nbsp|#160);/gi, ' ').replace(/\s+/g, ' ').trim();
}

export function auditSource(source, file = '<memory>') {
  const findings = [];

  if (/<html\b/i.test(source) && !/<html\b[^>]*\blang\s*=/i.test(source)) {
    addFinding(findings, source, file, source.search(/<html\b/i), 'html-lang', 'P1', 'Declare the document language on the html element.');
  }

  if (/<head\b/i.test(source) && !/<meta\b[^>]*\bname\s*=\s*["']viewport["'][^>]*>/i.test(source)) {
    addFinding(findings, source, file, source.search(/<head\b/i), 'viewport', 'P2', 'Add a responsive viewport meta element for mobile layouts.');
  }

  if (/<body\b/i.test(source) && !/<main\b|\brole\s*=\s*["']main["']/i.test(source)) {
    addFinding(findings, source, file, source.search(/<body\b/i), 'main-landmark', 'P3', 'A full-page surface should normally expose a main landmark; verify whether this file is a complete page or a partial.');
  }

  for (const match of source.matchAll(/<img\b[^>]*>/gi)) {
    if (!hasAttribute(match[0], 'alt')) {
      addFinding(findings, source, file, match.index, 'image-alt', 'P1', 'Image is missing an alt attribute; use meaningful text or alt="" for decoration.', match[0]);
    }
  }

  for (const match of source.matchAll(/<(input|select|textarea)\b[^>]*>/gi)) {
    const tag = match[0];
    const type = (getAttribute(tag, 'type') || '').toLowerCase();
    if (match[1].toLowerCase() === 'input' && ['hidden', 'button', 'submit', 'reset', 'image'].includes(type)) continue;

    const id = getAttribute(tag, 'id');
    const namedByAria = hasAttribute(tag, 'aria-label') || hasAttribute(tag, 'aria-labelledby');
    const labelForId = id && new RegExp(`<label\\b[^>]*\\bfor\\s*=\\s*["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(source);
    if (!namedByAria && !labelForId && !isInsideLabel(source, match.index)) {
      addFinding(findings, source, file, match.index, 'control-name', 'P1', 'Form control has no detectable label or accessible name.', tag);
    }
  }

  for (const match of source.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button\s*>/gi)) {
    const openingTag = `<button${match[1]}>`;
    const visibleName = stripMarkup(match[2]);
    const accessibleName = visibleName || getAttribute(openingTag, 'aria-label') || getAttribute(openingTag, 'title');
    if (!accessibleName) {
      addFinding(findings, source, file, match.index, 'button-name', 'P1', 'Button has no detectable accessible name.', openingTag);
    }
    if (!hasAttribute(openingTag, 'type')) {
      addFinding(findings, source, file, match.index, 'button-type', 'P3', 'Set button type explicitly so form behavior is not accidental.', openingTag);
    }
  }

  for (const match of source.matchAll(/\btabindex\s*=\s*["']?([1-9]\d*)["']?/gi)) {
    addFinding(findings, source, file, match.index, 'positive-tabindex', 'P1', 'Positive tabindex creates a fragile keyboard order; use DOM order and tabindex="0" only when necessary.', match[0]);
  }

  for (const match of source.matchAll(/<(div|span)\b[^>]*\bonclick\s*=/gi)) {
    addFinding(findings, source, file, match.index, 'noninteractive-click', 'P1', 'Use a semantic button or link instead of click behavior on a div/span.', match[0]);
  }

  for (const match of source.matchAll(/<a\b[^>]*\btarget\s*=\s*["']_blank["'][^>]*>/gi)) {
    const rel = (getAttribute(match[0], 'rel') || '').toLowerCase();
    if (!rel.includes('noopener')) {
      addFinding(findings, source, file, match.index, 'target-blank-rel', 'P2', 'External target="_blank" link should include rel="noopener noreferrer".', match[0]);
    }
  }

  for (const match of source.matchAll(/outline\s*:\s*(?:none|0(?:\s|;|$))/gi)) {
    addFinding(findings, source, file, match.index, 'outline-suppressed', 'P2', 'Do not remove the focus outline unless an equally visible focus-visible replacement is verified.', match[0]);
  }

  const motionIndex = source.search(/(?:animation(?:-name)?|transition)\s*:/i);
  if (motionIndex >= 0 && !/prefers-reduced-motion\s*:\s*reduce/i.test(source)) {
    addFinding(findings, source, file, motionIndex, 'reduced-motion', 'P2', 'Motion is present without a detectable prefers-reduced-motion alternative.');
  }

  for (const match of source.matchAll(/(?:\.innerHTML\s*=|insertAdjacentHTML\s*\(|dangerouslySetInnerHTML)/gi)) {
    addFinding(findings, source, file, match.index, 'html-injection-sink', 'P1', 'HTML injection sink requires trusted content or explicit sanitization; prefer textContent and DOM construction.', match[0]);
  }

  const runnerIndex = source.search(/google\.script\.run/i);
  if (runnerIndex >= 0) {
    if (!/\.withSuccessHandler\s*\(/i.test(source)) {
      addFinding(findings, source, file, runnerIndex, 'script-run-success', 'P1', 'google.script.run usage has no detectable success handler in this file; verify the async wrapper.');
    }
    if (!/\.withFailureHandler\s*\(/i.test(source)) {
      addFinding(findings, source, file, runnerIndex, 'script-run-failure', 'P1', 'google.script.run usage has no detectable failure handler in this file; preserve input and provide recovery.');
    }
  }

  let previousHeading = 0;
  for (const match of source.matchAll(/<h([1-6])\b/gi)) {
    const level = Number(match[1]);
    if (previousHeading && level > previousHeading + 1) {
      addFinding(findings, source, file, match.index, 'heading-skip', 'P2', `Heading order jumps from h${previousHeading} to h${level}.`, match[0]);
    }
    previousHeading = level;
  }

  const secretPattern = /\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|authorization)\b\s*[:=]\s*["']([^"'\r\n]{8,})["']/gi;
  for (const match of source.matchAll(secretPattern)) {
    if (/^(?:example|sample|test|demo|replace|your|placeholder)/i.test(match[1])) continue;
    addFinding(findings, source, file, match.index, 'client-secret', 'P1', 'Possible credential literal found in client HTML; move secrets to Script Properties or an approved secret manager.');
  }

  return findings;
}

function collectHtmlFiles(inputPath, files, errors) {
  let stat;
  try {
    stat = fs.lstatSync(inputPath);
  } catch (error) {
    errors.push(`${inputPath}: ${error.message}`);
    return;
  }

  if (stat.isSymbolicLink()) return;
  if (stat.isFile()) {
    if (HTML_EXTENSIONS.has(path.extname(inputPath).toLowerCase())) files.add(path.resolve(inputPath));
    return;
  }
  if (!stat.isDirectory()) return;

  for (const entry of fs.readdirSync(inputPath, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    collectHtmlFiles(path.join(inputPath, entry.name), files, errors);
  }
}

function summarize(findings) {
  return Object.fromEntries(SEVERITIES.map(severity => [severity, findings.filter(item => item.severity === severity).length]));
}

function printTextReport(findings, filesAudited) {
  const summary = summarize(findings);
  console.log(`Audited ${filesAudited} HTML file(s): ${summary.P1} P1, ${summary.P2} P2, ${summary.P3} P3.`);
  for (const finding of findings) {
    const location = `${path.relative(process.cwd(), finding.file) || finding.file}:${finding.line}`;
    console.log(`${finding.severity} ${finding.id} ${location} - ${finding.message}`);
    if (finding.evidence) console.log(`  ${finding.evidence}`);
  }
}

export function runAudit(inputPaths) {
  const files = new Set();
  const errors = [];
  for (const inputPath of inputPaths) collectHtmlFiles(path.resolve(inputPath), files, errors);

  const findings = [];
  for (const file of [...files].sort()) {
    const source = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    findings.push(...auditSource(source, file));
  }

  findings.sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity) || a.file.localeCompare(b.file) || a.line - b.line);
  return { files: [...files], findings, errors, summary: summarize(findings) };
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const strict = args.includes('--strict');
  const inputs = args.filter(arg => !arg.startsWith('--'));

  if (!inputs.length) {
    console.error('Usage: node audit-html.mjs <file-or-directory> [...] [--json] [--strict]');
    process.exitCode = 2;
    return;
  }

  const result = runAudit(inputs);
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    for (const error of result.errors) console.error(`ERROR ${error}`);
    printTextReport(result.findings, result.files.length);
  }

  if (result.errors.length) process.exitCode = 2;
  else if (strict && result.summary.P1 > 0) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) main();
