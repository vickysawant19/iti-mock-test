#!/usr/bin/env bash
# install.sh — Install appwrite-auth-patterns to your AI agent's skills directory
set -euo pipefail

SKILL_NAME="appwrite-auth-patterns"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

detect_platform() {
  if command -v claude &>/dev/null || [ -d "$HOME/.claude" ]; then
    echo "claude"
  elif [ -d "$HOME/.copilot" ]; then
    echo "copilot"
  elif [ -d ".cursor" ]; then
    echo "cursor"
  elif [ -d ".windsurf" ]; then
    echo "windsurf"
  else
    echo "claude"  # default
  fi
}

PLATFORM="${1:-$(detect_platform)}"

case "$PLATFORM" in
  claude|copilot)
    TARGET="$HOME/.claude/skills/$SKILL_NAME"
    mkdir -p "$HOME/.claude/skills"
    ;;
  cursor)
    TARGET=".cursor/rules/$SKILL_NAME"
    mkdir -p ".cursor/rules"
    ;;
  windsurf)
    TARGET=".windsurf/skills/$SKILL_NAME"
    mkdir -p ".windsurf/skills"
    ;;
  github-copilot)
    TARGET=".github/skills/$SKILL_NAME"
    mkdir -p ".github/skills"
    ;;
  *)
    echo "Unknown platform: $PLATFORM. Defaulting to ~/.claude/skills/"
    TARGET="$HOME/.claude/skills/$SKILL_NAME"
    mkdir -p "$HOME/.claude/skills"
    ;;
esac

echo "Installing $SKILL_NAME to $TARGET..."

if [ -d "$TARGET" ]; then
  echo "Updating existing installation..."
  rm -rf "$TARGET"
fi

cp -r "$SKILL_DIR" "$TARGET"

echo ""
echo "✅ $SKILL_NAME installed successfully!"
echo ""
echo "To use it, open a new session and reference it:"
echo "  Use the $SKILL_NAME skill."
echo ""
echo "Installed at: $TARGET"
