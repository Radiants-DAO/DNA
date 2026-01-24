#!/usr/bin/env bash
set -euo pipefail

# Parallel Ralph Coordinator for fn-2-zcd
# Runs Phase 0-2 sequentially, then Phase 3 in parallel, then Phase 4 sequentially

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
FLOWCTL="$SCRIPT_DIR/flowctl"

# Colors
C_RESET='\033[0m'
C_BOLD='\033[1m'
C_GREEN='\033[32m'
C_YELLOW='\033[33m'
C_CYAN='\033[36m'
C_DIM='\033[2m'

log() { echo -e "${C_CYAN}[coordinator]${C_RESET} $*"; }
success() { echo -e "${C_GREEN}✓${C_RESET} $*"; }
waiting() { echo -e "${C_YELLOW}⏳${C_RESET} $*"; }

CLAUDE_BIN="${CLAUDE_BIN:-claude}"
YOLO_FLAG="--dangerously-skip-permissions"

# Check dependencies
command -v tmux >/dev/null 2>&1 || { echo "Error: tmux required (brew install tmux)"; exit 1; }

echo ""
echo -e "${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
echo -e "${C_BOLD}  🤖 Parallel Ralph - fn-2-zcd Migration${C_RESET}"
echo -e "${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Phase 0-2: Sequential setup (must complete before parallel work)
# ─────────────────────────────────────────────────────────────────────────────

PHASE1_TASKS="fn-2-zcd.1 fn-2-zcd.31 fn-2-zcd.2 fn-2-zcd.3 fn-2-zcd.4 fn-2-zcd.5"

log "Phase 0-2: Sequential setup tasks"
for task in $PHASE1_TASKS; do
  status=$("$FLOWCTL" show "$task" --json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))" || echo "")
  if [[ "$status" == "done" ]]; then
    success "$task already done"
    continue
  fi
  
  waiting "Working on $task..."
  "$CLAUDE_BIN" $YOLO_FLAG -p "/flow-next:work $task --branch=current --review=rp" || {
    echo "Error: Task $task failed"
    exit 1
  }
  success "$task completed"
done

log "Phase 0-2 complete!"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Phase 3: Parallel component migration
# ─────────────────────────────────────────────────────────────────────────────

log "Phase 3: Parallel component migration (5 workers)"

# Define task batches for parallel workers
WORKER1_TASKS="fn-2-zcd.6 fn-2-zcd.7 fn-2-zcd.8 fn-2-zcd.9 fn-2-zcd.10 fn-2-zcd.11"      # Tier 1
WORKER2_TASKS="fn-2-zcd.12 fn-2-zcd.13 fn-2-zcd.14 fn-2-zcd.15"                           # Tier 2
WORKER3_TASKS="fn-2-zcd.16 fn-2-zcd.17 fn-2-zcd.18"                                       # Tier 3
WORKER4_TASKS="fn-2-zcd.19 fn-2-zcd.20 fn-2-zcd.21 fn-2-zcd.22 fn-2-zcd.23"              # Tier 4
WORKER5_TASKS="fn-2-zcd.24 fn-2-zcd.25 fn-2-zcd.26 fn-2-zcd.27"                           # Tier 5

# Create tmux session for parallel workers
SESSION="ralph-parallel-$(date +%s)"
tmux new-session -d -s "$SESSION" -n "coordinator"

# Function to create worker script
create_worker() {
  local worker_id="$1"
  local tasks="$2"
  local script="/tmp/ralph-worker-${worker_id}.sh"
  
  cat > "$script" << WORKER
#!/usr/bin/env bash
set -euo pipefail
cd "$ROOT_DIR"
FLOWCTL="$FLOWCTL"
CLAUDE_BIN="$CLAUDE_BIN"

echo "Worker $worker_id starting..."
for task in $tasks; do
  status=\$("\$FLOWCTL" show "\$task" --json 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))" || echo "")
  if [[ "\$status" == "done" ]]; then
    echo "✓ \$task already done"
    continue
  fi
  echo "⏳ Working on \$task..."
  "\$CLAUDE_BIN" $YOLO_FLAG -p "/flow-next:work \$task --branch=current --review=rp" || {
    echo "⚠ Task \$task failed, continuing..."
  }
  echo "✓ \$task completed"
done
echo ""
echo "Worker $worker_id finished!"
echo "Press any key to close..."
read -n 1
WORKER
  chmod +x "$script"
  echo "$script"
}

# Create and launch workers in tmux panes
log "Launching 5 parallel workers in tmux..."

SCRIPT1=$(create_worker 1 "$WORKER1_TASKS")
SCRIPT2=$(create_worker 2 "$WORKER2_TASKS")
SCRIPT3=$(create_worker 3 "$WORKER3_TASKS")
SCRIPT4=$(create_worker 4 "$WORKER4_TASKS")
SCRIPT5=$(create_worker 5 "$WORKER5_TASKS")

# Create panes for each worker
tmux send-keys -t "$SESSION" "echo 'Coordinator - workers running in other panes'" Enter
tmux split-window -t "$SESSION" -h "$SCRIPT1"
tmux split-window -t "$SESSION" -v "$SCRIPT2"
tmux select-pane -t "$SESSION:0.0"
tmux split-window -t "$SESSION" -v "$SCRIPT3"
tmux select-pane -t "$SESSION:0.2"
tmux split-window -t "$SESSION" -v "$SCRIPT4"
tmux select-pane -t "$SESSION:0.1"
tmux split-window -t "$SESSION" -v "$SCRIPT5"

# Even out the layout
tmux select-layout -t "$SESSION" tiled

echo ""
echo -e "${C_BOLD}Parallel workers launched in tmux session: ${C_CYAN}$SESSION${C_RESET}"
echo ""
echo "To attach and monitor:"
echo -e "  ${C_DIM}tmux attach -t $SESSION${C_RESET}"
echo ""
echo "To kill all workers:"
echo -e "  ${C_DIM}tmux kill-session -t $SESSION${C_RESET}"
echo ""
echo "After workers complete, run Phase 4:"
echo -e "  ${C_DIM}./scripts/ralph/phase4.sh${C_RESET}"
echo ""
