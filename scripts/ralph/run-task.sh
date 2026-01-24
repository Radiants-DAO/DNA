#!/usr/bin/env bash
set -euo pipefail

TASK="$1"
FLOWCTL="$(dirname "$0")/flowctl"
LOG_DIR="$(dirname "$0")/logs"
mkdir -p "$LOG_DIR"

# Check if already done
status=$("$FLOWCTL" show "$TASK" --json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
if [[ "$status" == "done" ]]; then
  echo "✓ $TASK already done"
  exit 0
fi

echo "⏳ Starting $TASK..."
LOG="$LOG_DIR/${TASK}.log"

# Run claude and capture exit code
if claude --dangerously-skip-permissions -p "/flow-next:work $TASK --branch=current --review=none" > "$LOG" 2>&1; then
  # Verify it's actually done
  status=$("$FLOWCTL" show "$TASK" --json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
  if [[ "$status" == "done" ]]; then
    echo "✓ $TASK completed"
  else
    echo "⚠ $TASK finished but status=$status (check $LOG)"
  fi
else
  echo "✗ $TASK failed (check $LOG)"
fi
