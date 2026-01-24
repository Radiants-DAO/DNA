# DNA Phase 0: Automated Assessment

**Version:** 1.0.0

This prompt performs an automated scan of a theme package to assess its current state and identify gaps against the DNA spec.

---

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `project_path` | Yes | Path to the theme package to assess |

---

## Assessment Steps

Execute each step below and compile results into the output format.

### Step 1: Token Inventory

Scan CSS files for token definitions and classify them.

**Search patterns:**

```bash
# Find all CSS custom property definitions
grep -rh "^\s*--" {project_path}/**/*.css | sort | uniq

# Find @theme blocks
grep -A 100 "@theme" {project_path}/**/*.css
```

**Classification rules:**

| Pattern | Classification |
|---------|----------------|
| `--color-{descriptive}` (e.g., `--color-green`, `--color-blue`) | Brand token |
| `--color-{purpose}-{level}` (e.g., `--color-bg-primary`) | Non-standard semantic |
| `--color-surface-*` | DNA semantic ✓ |
| `--color-content-*` | DNA semantic ✓ |
| `--color-edge-*` | DNA semantic ✓ |
| `--color-action-*` | DNA semantic ✓ |
| `--color-status-*` | DNA semantic ✓ |

**Non-standard semantic token patterns to detect:**
- `--color-bg-*` → should be `--color-surface-*`
- `--color-text-*` → should be `--color-content-*`
- `--color-border-*` → should be `--color-edge-*`

### Step 2: Component Inventory

Scan for components and check for DNA-compliant files.

**Search patterns:**

```bash
# Find all component directories (look for .tsx files)
find {project_path} -name "*.tsx" -type f | grep -v node_modules

# Check for existing schema files
find {project_path} -name "*.schema.json" -type f

# Check for existing dna files
find {project_path} -name "*.dna.json" -type f
```

**For each component, record:**
- Component name
- File path
- Has .schema.json? (yes/no)
- Has .dna.json? (yes/no)
- Complexity tier (simple/compound/complex)

**Complexity classification:**
- **Simple:** Single export, no subcomponents (Button, Badge, Input)
- **Compound:** Multiple related exports (Dialog, Sheet, Accordion)
- **Complex:** Many states, variants, or subcomponents (DataTable, Form)
- **Decorator:** Components that receive color/style as props (MenuButton, may not need token refactor)

**Note:** Component count for schemas vs token refactor may differ. Some decorator components pass colors through props rather than using direct className tokens.

### Step 3: Token Usage Scan

Find where brand tokens are used in component classNames.

**Search patterns:**

```bash
# Find brand token usage in className props
grep -rn "className=" {project_path}/**/*.tsx | grep -E "bg-[a-z]+-|text-[a-z]+-|border-[a-z]+-"

# Find hardcoded colors
grep -rn "bg-\[#\|text-\[#\|border-\[#" {project_path}/**/*.tsx

# Find brand tokens in shadow definitions (often overlooked)
grep -rn "var(--color-" {project_path}/**/*.tsx | grep -E "shadow|border"

# Find brand tokens in focus rings
grep -rn "ring-" {project_path}/**/*.tsx | grep -v "ring-edge-\|ring-offset"

# Find DNA-compliant semantic token usage (good)
grep -rn "bg-surface-\|text-content-\|border-edge-" {project_path}/**/*.tsx
```

**Record for mapping strategy:**
- Which brand tokens are used where
- Which components need refactoring
- CSS variables used in shadow/border definitions
- Focus ring color tokens

### Step 4: Motion Pattern Detection

Find existing animation/transition values.

**Search patterns:**

```bash
# Find transition declarations
grep -rn "transition" {project_path}/**/*.css {project_path}/**/*.tsx

# Find animation keyframes
grep -rn "@keyframes" {project_path}/**/*.css

# Find duration values
grep -rn "duration-\|\.duration\|animation:" {project_path}/**/*.css {project_path}/**/*.tsx
```

**Check for:**
- Existing duration tokens
- Existing easing tokens
- Hardcoded values that should be tokenized

### Step 5: Gap Analysis

Compare findings against DNA spec requirements.

**Required tokens checklist:**

| Token | Status | Current Value (if any) |
|-------|--------|------------------------|
| `--color-surface-primary` | ? | |
| `--color-surface-secondary` | ? | |
| `--color-content-primary` | ? | |
| `--color-content-inverted` | ? | |
| `--color-edge-primary` | ? | |

**Recommended tokens checklist:**

| Token | Status | Current Value (if any) |
|-------|--------|------------------------|
| `--color-surface-tertiary` | ? | |
| `--color-surface-elevated` | ? | |
| `--color-action-primary` | ? | |
| `--color-action-destructive` | ? | |
| `--color-status-success` | ? | |
| `--color-status-error` | ? | |
| `--duration-fast` | ? | |
| `--duration-base` | ? | |
| `--easing-default` | ? | |

---

## Output Format

Generate an `assessment.md` file with this structure:

```markdown
# DNA Assessment: {project_name}

**Generated:** {date}
**Project:** {project_path}

## Summary

| Metric | Count |
|--------|-------|
| Total components | X |
| Components with schema | X |
| Components without schema | X |
| Brand tokens defined | X |
| Semantic tokens defined | X |
| DNA-compliant tokens | X |
| Non-standard semantic tokens | X |

## Token Inventory

### Brand Tokens (Tier 1)

| Token | Value | Used In |
|-------|-------|---------|
| `--color-green` | #27FF93 | Badge, Button |
| ... | | |

### Current Semantic Tokens

| Token | Value | DNA-Compliant? |
|-------|-------|----------------|
| `--color-bg-primary` | var(--color-white) | No (use surface-*) |
| ... | | |

### DNA-Compliant Tokens (already present)

| Token | Value |
|-------|-------|
| (none found) | |

## Component Inventory

| Component | Path | Schema? | DNA? | Complexity | Needs Refactor? |
|-----------|------|---------|------|------------|-----------------|
| Button | app/components/ui/Button.tsx | No | No | Simple | Yes |
| ... | | | | | |

## Token Usage Analysis

### Brand Tokens in Components

| Token | Component | className Usage |
|-------|-----------|-----------------|
| `bg-green` | Badge | `className="bg-green"` |
| ... | | |

### Hardcoded Colors

| Component | Line | Value |
|-----------|------|-------|
| (none or list) | | |

## Recommended Token Mapping

Based on the analysis, here's the recommended mapping from current tokens to DNA semantic tokens:

| Current | DNA Semantic | Notes |
|---------|--------------|-------|
| `--color-bg-primary` | `--color-surface-primary` | Rename |
| `--color-text-primary` | `--color-content-primary` | Rename |
| `--color-border-primary` | `--color-edge-primary` | Rename |
| `bg-green` | `bg-status-success` or `bg-action-primary` | Depends on usage |
| ... | | |

## Gap Analysis

### Missing Required Tokens

- [ ] `--color-surface-primary`
- [ ] `--color-surface-secondary`
- [ ] `--color-content-primary`
- [ ] `--color-content-inverted`
- [ ] `--color-edge-primary`

### Missing Recommended Tokens

- [ ] `--color-action-primary`
- [ ] `--color-status-success`
- [ ] `--duration-fast`
- [ ] `--easing-default`
- [ ] (etc.)

### Components Needing Schemas

1. Button (simple)
2. Card (simple)
3. Dialog (compound)
4. (etc.)

### Components Needing Token Refactor

1. Badge - uses `bg-green` → `bg-status-success`
2. Button - uses `bg-black` → `bg-surface-secondary`
3. (etc.)

## Motion Analysis

### Current Motion Values

| Location | Property | Value | Tokenize? |
|----------|----------|-------|-----------|
| globals.css | animation | 0.2s ease-out | Yes |
| ... | | | |

### Recommended Motion Tokens

```css
--duration-fast: 100ms;
--duration-base: 150ms;
--duration-moderate: 200ms;
--duration-slow: 300ms;
--easing-default: cubic-bezier(0, 0, 0.2, 1);
```

## Conversion Complexity Estimate

| Phase | Items | Complexity |
|-------|-------|------------|
| Token Foundation | X tokens to add/rename | Low |
| Component Schemas | X components | Medium |
| Token Refactor | X components | Medium |
| Dark Mode | X tokens to override | Low |

**Recommended approach:** {full/tokens-only/phased}
```

---

## Example Execution

For a project at `packages/layer33`:

1. Run token inventory grep commands
2. Run component find commands
3. Analyze and classify results
4. Generate mapping recommendations
5. Write assessment.md to `packages/layer33/.dna-conversion/assessment.md`
