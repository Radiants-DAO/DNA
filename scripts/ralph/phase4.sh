#!/usr/bin/env bash
set -euo pipefail

# Phase 4: Integration (after parallel component migration completes)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
FLOWCTL="$SCRIPT_DIR/flowctl"

C_RESET='\033[0m'
C_BOLD='\033[1m'
C_GREEN='\033[32m'
C_YELLOW='\033[33m'
C_CYAN='\033[36m'
C_RED='\033[31m'

log() { echo -e "${C_CYAN}[phase4]${C_RESET} $*"; }
success() { echo -e "${C_GREEN}✓${C_RESET} $*"; }
waiting() { echo -e "${C_YELLOW}⏳${C_RESET} $*"; }
error() { echo -e "${C_RED}✗${C_RESET} $*"; }

CLAUDE_BIN="${CLAUDE_BIN:-claude}"
YOLO_FLAG="--dangerously-skip-permissions"

echo ""
echo -e "${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
echo -e "${C_BOLD}  🤖 Phase 4: Integration${C_RESET}"
echo -e "${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
echo ""

# Check Phase 3 completion first
log "Checking Phase 3 completion..."
INCOMPLETE=""
for i in $(seq 6 27); do
  task="fn-2-zcd.$i"
  status=$("$FLOWCTL" show "$task" --json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))" || echo "")
  if [[ "$status" != "done" ]]; then
    INCOMPLETE="$INCOMPLETE $task"
  fi
done
# Also check Task 31 (useModalBehavior)
status=$("$FLOWCTL" show "fn-2-zcd.31" --json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))" || echo "")
if [[ "$status" != "done" ]]; then
  INCOMPLETE="$INCOMPLETE fn-2-zcd.31"
fi

if [[ -n "$INCOMPLETE" ]]; then
  error "Phase 3 not complete. Missing:$INCOMPLETE"
  echo ""
  echo "Run parallel workers first: ./scripts/ralph/parallel.sh"
  exit 1
fi

success "Phase 3 complete!"
echo ""

# Phase 4 tasks
PHASE4_TASKS="fn-2-zcd.28 fn-2-zcd.29 fn-2-zcd.30"

log "Running Phase 4 tasks..."
for task in $PHASE4_TASKS; do
  status=$("$FLOWCTL" show "$task" --json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))" || echo "")
  if [[ "$status" == "done" ]]; then
    success "$task already done"
    continue
  fi
  
  waiting "Working on $task..."
  "$CLAUDE_BIN" $YOLO_FLAG -p "/flow-next:work $task --branch=current --review=rp" || {
    error "Task $task failed"
    exit 1
  }
  success "$task completed"
done

echo ""
echo -e "${C_BOLD}${C_GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
echo -e "${C_BOLD}${C_GREEN}  ✅ Migration Complete!${C_RESET}"
echo -e "${C_BOLD}${C_GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
echo ""
echo "Verify:"
echo "  cd apps/rad-os && pnpm dev"
echo ""
