#!/usr/bin/env bash
# Generic runner for a skills-cleanup research agent.
# Usage: run-agent.sh <agent-name>
#   agent-name ∈ { usage, staleness, provenance }

set -euo pipefail

NAME="${1:?agent name required}"
REPO=/Users/rivermassey/Desktop/dev/DNA-pixel-art
CLEAN=$REPO/ops/skills-cleanup

PROMPT=$CLEAN/prompts/$NAME-agent.md
OUTPUT=$CLEAN/$NAME-report.json
LOG=$CLEAN/logs/$NAME.log
DONE=$CLEAN/$NAME.done
FAIL=$CLEAN/$NAME.fail

cd "$REPO"

rm -f "$DONE" "$FAIL"

echo "[$(date -Iseconds)] starting $NAME agent" >"$LOG"
echo "prompt: $PROMPT" >>"$LOG"
echo "output: $OUTPUT" >>"$LOG"
echo "---" >>"$LOG"

if claude --dangerously-skip-permissions -p "$(cat "$PROMPT")" >>"$LOG" 2>&1; then
  if [ -f "$OUTPUT" ]; then
    touch "$DONE"
    echo "[$(date -Iseconds)] $NAME agent completed, output at $OUTPUT" >>"$LOG"
    ~/.local/bin/collab-canvas tile create note --file "$OUTPUT" >>"$LOG" 2>&1 || true
    echo "DONE: $NAME — report at $OUTPUT"
  else
    touch "$FAIL"
    echo "[$(date -Iseconds)] $NAME agent finished but output file missing: $OUTPUT" >>"$LOG"
    echo "FAIL: $NAME — no output file"
    exit 2
  fi
else
  touch "$FAIL"
  echo "[$(date -Iseconds)] $NAME agent exited non-zero" >>"$LOG"
  echo "FAIL: $NAME — claude exited non-zero, see $LOG"
  exit 1
fi
