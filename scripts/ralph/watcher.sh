#!/bin/bash
# Ralph Watcher - monitors progress and logs stalls

LOG="/tmp/ralph-watcher.log"
STALL_THRESHOLD=300  # 5 minutes without receipt = stall

echo "$(date): Watcher started" > "$LOG"

last_receipt_count=0
last_check_time=$(date +%s)
stall_start=""

while true; do
    sleep 60  # Check every minute

    now=$(date +%s)
    now_fmt=$(date)

    # Count receipts
    receipt_count=$(find scripts/ralph/runs/*/receipts -name "*.json" 2>/dev/null | wc -l | tr -d ' ')

    # Check Ralph processes
    ralph_count=$(pgrep -f "ralph.sh" | wc -l | tr -d ' ')
    claude_count=$(pgrep -f "claude" | grep -v "Claude.app" | wc -l | tr -d ' ')

    # Get Claude worker CPU
    claude_cpu=$(ps aux | grep "claude" | grep -v grep | grep -v "Claude.app" | grep -v tmux | awk '{sum+=$3} END {print sum}')

    # Check task status
    current_task=$(.flow/bin/flowctl tasks --epic fn-17 2>/dev/null | grep "in_progress" | head -1)
    done_count=$(.flow/bin/flowctl tasks --epic fn-17 2>/dev/null | grep -c "\[done\]")

    echo "$now_fmt | receipts=$receipt_count | ralph=$ralph_count | claude=$claude_count | cpu=$claude_cpu% | done=$done_count/13 | $current_task" >> "$LOG"

    # Detect stall
    if [ "$receipt_count" = "$last_receipt_count" ]; then
        if [ -z "$stall_start" ]; then
            stall_start=$now
        fi
        stall_duration=$((now - stall_start))
        if [ "$stall_duration" -gt "$STALL_THRESHOLD" ]; then
            echo "$now_fmt | ⚠️  STALL DETECTED: No progress for ${stall_duration}s" >> "$LOG"
            echo "$now_fmt | ⚠️  Claude CPU: $claude_cpu% | Ralph procs: $ralph_count" >> "$LOG"

            # Log what Claude is doing
            claude_pid=$(pgrep -f "claude" | grep -v "Claude.app" | head -1)
            if [ -n "$claude_pid" ]; then
                echo "$now_fmt | Claude PID $claude_pid state: $(ps -p $claude_pid -o state= 2>/dev/null)" >> "$LOG"
            fi
        fi
    else
        stall_start=""
        echo "$now_fmt | ✅ Progress: $last_receipt_count -> $receipt_count receipts" >> "$LOG"
    fi

    last_receipt_count=$receipt_count

    # Exit if Ralph died
    if [ "$ralph_count" = "0" ]; then
        echo "$now_fmt | ❌ Ralph died! Exiting watcher." >> "$LOG"
        exit 1
    fi
done
