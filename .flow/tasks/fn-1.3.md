# fn-1.3 POC: git2 commit workflow

## Description

Test git2 crate for programmatic Git operations. RadFlow uses "Git as Save" - Cmd+S creates a commit, not a local save.

### Operations to Test
1. Open existing repository
2. Stage specific files
3. Create commit with message
4. Get current branch
5. Get commit history (last N commits)
6. Check for uncommitted changes

### Test Repository
Use radflow-tauri itself as test repo (or create temp repo)

## Acceptance

- [ ] Create Rust POC project at `research/pocs/git2-poc/`
- [ ] Open repository by path
- [ ] Stage a single file
- [ ] Create commit with custom message
- [ ] Read current branch name
- [ ] List last 5 commits with messages
- [ ] Detect uncommitted changes
- [ ] Handle errors gracefully (not a git repo, no changes to commit, etc.)

## Done summary
Blocked:
DROPPED: Git commits handled by LLM via prompts, not native code
## Evidence
- Commits:
- Tests:
- PRs:
