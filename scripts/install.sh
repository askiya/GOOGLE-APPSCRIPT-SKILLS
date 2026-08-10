#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILLS_ROOT="$REPO_ROOT/skills"
DESTINATION="${CODEX_SKILLS_DIR:-$HOME/.agents/skills}"
REQUESTED_SKILL="${1:-}"

mkdir -p "$DESTINATION"

install_one() {
  local name="$1"
  local source="$SKILLS_ROOT/$name"
  local target="$DESTINATION/$name"

  if [[ ! -d "$source" ]]; then
    echo "Unknown skill: $name" >&2
    exit 1
  fi
  if [[ -e "$target" ]]; then
    echo "Target already exists: $target" >&2
    echo "Remove it deliberately before reinstalling." >&2
    exit 1
  fi
  cp -R "$source" "$target"
  echo "Installed $name -> $target"
}

if [[ -n "$REQUESTED_SKILL" ]]; then
  install_one "$REQUESTED_SKILL"
else
  while IFS= read -r source; do
    install_one "$(basename "$source")"
  done < <(find "$SKILLS_ROOT" -mindepth 1 -maxdepth 1 -type d | sort)
fi

echo "Restart Codex if the skills do not appear automatically."
