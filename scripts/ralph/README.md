# Ralph Parallel Execution

## Quick Start

### Option 1: Automated Parallel (uses tmux)

```bash
# Install tmux if needed
brew install tmux

# Run parallel execution
./scripts/ralph/parallel.sh

# Attach to monitor workers
tmux attach -t ralph-parallel-<timestamp>

# After workers complete, run Phase 4
./scripts/ralph/phase4.sh
```

### Option 2: Manual Parallel (5 terminal windows)

**Terminal 1: Phase 0-2 Setup (run first, wait for completion)**
```bash
cd /Users/rivermassey/Desktop/dev/dna
claude --dangerously-skip-permissions -p "/flow-next:work fn-2-zcd.1 --branch=current --review=rp"
claude --dangerously-skip-permissions -p "/flow-next:work fn-2-zcd.31 --branch=current --review=rp"
claude --dangerously-skip-permissions -p "/flow-next:work fn-2-zcd.2 --branch=current --review=rp"
claude --dangerously-skip-permissions -p "/flow-next:work fn-2-zcd.3 --branch=current --review=rp"
claude --dangerously-skip-permissions -p "/flow-next:work fn-2-zcd.4 --branch=current --review=rp"
claude --dangerously-skip-permissions -p "/flow-next:work fn-2-zcd.5 --branch=current --review=rp"
```

**After Phase 0-2 completes, open 5 terminals for parallel work:**

**Terminal 2: Tier 1 Components**
```bash
cd /Users/rivermassey/Desktop/dev/dna
for task in fn-2-zcd.{6..11}; do
  claude --dangerously-skip-permissions -p "/flow-next:work $task --branch=current --review=rp"
done
```

**Terminal 3: Tier 2 Components**
```bash
cd /Users/rivermassey/Desktop/dev/dna
for task in fn-2-zcd.{12..15}; do
  claude --dangerously-skip-permissions -p "/flow-next:work $task --branch=current --review=rp"
done
```

**Terminal 4: Tier 3 Components**
```bash
cd /Users/rivermassey/Desktop/dev/dna
for task in fn-2-zcd.{16..18}; do
  claude --dangerously-skip-permissions -p "/flow-next:work $task --branch=current --review=rp"
done
```

**Terminal 5: Tier 4 Components**
```bash
cd /Users/rivermassey/Desktop/dev/dna
for task in fn-2-zcd.{19..23}; do
  claude --dangerously-skip-permissions -p "/flow-next:work $task --branch=current --review=rp"
done
```

**Terminal 6: Tier 5 Components**
```bash
cd /Users/rivermassey/Desktop/dev/dna
for task in fn-2-zcd.{24..27}; do
  claude --dangerously-skip-permissions -p "/flow-next:work $task --branch=current --review=rp"
done
```

**After all parallel workers complete, run Phase 4:**
```bash
./scripts/ralph/phase4.sh
```

### Option 3: Single Worker (original Ralph)

```bash
# Sequential execution (slower but simpler)
./scripts/ralph/ralph.sh
```

## Task Dependency Graph

```
Phase 0: Setup
├─ Task 1: pnpm workspace + turbo.json
└─ Task 31: Move useModalBehavior → depends on 1

Phase 1: Theme CSS
└─ Task 2: animations.css + base.css → depends on 1

Phase 2: App Config (sequential)
├─ Task 3: package.json → depends on 2
├─ Task 4: tsconfig.json → depends on 3
└─ Task 5: globals.css → depends on 2, 4

Phase 3: Components (PARALLEL after Task 5)
├─ Worker 1: Tasks 6-11 (Tier 1: Badge, Divider, Progress, Tooltip, Switch, Slider)
├─ Worker 2: Tasks 12-15 (Tier 2: Tabs, Select, Checkbox/Radio, Alert)
├─ Worker 3: Tasks 16-18 (Tier 3: Toast, Accordion, Breadcrumbs)
├─ Worker 4: Tasks 19-23 (Tier 4: ContextMenu, HelpPanel, etc.)
└─ Worker 5: Tasks 24-27 (Tier 5: Dialog, Popover, Sheet, DropdownMenu)
    └─ Also depends on Task 31 (useModalBehavior)

Phase 4: Integration (sequential)
├─ Task 28: Update imports → depends on all Phase 3 + Task 31
├─ Task 29: Remove duplicates → depends on 28
└─ Task 30: Final verification → depends on 29
```

## Monitoring Progress

```bash
# Check task status
./scripts/ralph/flowctl show fn-2-zcd --json | jq '.tasks[] | {id, status}'

# Count completed
./scripts/ralph/flowctl show fn-2-zcd --json | jq '[.tasks[] | select(.status=="done")] | length'
```
