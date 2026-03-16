# Task Template: Component Token Refactor

Use this template for tasks that replace brand tokens with semantic tokens in component files.

---

## Task Structure

```markdown
# Task: Refactor {Token Category} Tokens

**Sprint:** 4
**Dependencies:** 01-token-foundation
**Complexity:** {simple/medium}

## Description

Replace brand tokens with DNA semantic tokens in component className props. This task covers components using {token category} tokens.

## Token Mapping

| Find | Replace With |
|------|--------------|
| `bg-{brand}` | `bg-surface-{level}` |
| `text-{brand}` | `text-content-{level}` |
| `border-{brand}` | `border-edge-{level}` |

Specific mappings for this project:

| Current | Replacement | Notes |
|---------|-------------|-------|
| {from_assessment} | {to_semantic} | {context} |

## Files to Modify

- `{component_path_1}` - {tokens to replace}
- `{component_path_2}` - {tokens to replace}

## Implementation Steps

### 1. Search for brand token usage

```bash
grep -rn "{brand_token}" {component_path}
```

### 2. Replace tokens

**Surface tokens (backgrounds):**
```tsx
// Before
className="bg-black"

// After
className="bg-inv"
```

**Content tokens (text):**
```tsx
// Before
className="text-white"

// After
className="text-flip"
```

**Edge tokens (borders):**
```tsx
// Before
className="border-black"

// After
className="border-line"
```

### 3. Handle opacity modifiers

Use Tailwind opacity modifiers, not baked-in tokens:

```tsx
// Before (if using opacity token)
className="text-black-60"

// After
className="text-main/60"
```

### 4. Handle hover/focus states

```tsx
// Before
className="hover:bg-gray-100"

// After
className="hover:bg-page/90"
```

## Validation Criteria

- [ ] No brand tokens remain in modified files:
  ```bash
  grep -rn "bg-{brand}\|text-{brand}\|border-{brand}" {files}
  # Should return nothing
  ```
- [ ] TypeScript compiles without errors
- [ ] Components render correctly in browser
- [ ] Hover/focus states work as expected

## Commit Message

```
refactor({scope}): replace brand tokens with semantic tokens

Components updated:
- {Component1}: bg-{brand} → bg-surface-{level}
- {Component2}: text-{brand} → text-content-{level}
```
```

---

## Common Mappings Reference

### Surface Tokens (Backgrounds)

| Common Brand Usage | Semantic Replacement |
|--------------------|---------------------|
| `bg-white`, `bg-{light-color}` | `bg-page` |
| `bg-black`, `bg-{dark-color}` | `bg-inv` |
| `bg-gray-*`, `bg-{muted-color}` | `bg-tinted` or `bg-depth` |
| `bg-{card-color}` | `bg-card` |

### Content Tokens (Text/Icons)

| Common Brand Usage | Semantic Replacement |
|--------------------|---------------------|
| `text-black`, `text-{dark-color}` | `text-main` |
| `text-white`, `text-{light-color}` | `text-flip` |
| `text-gray-*`, `text-{muted}` | `text-main/70` or `text-mute` |

### Edge Tokens (Borders)

| Common Brand Usage | Semantic Replacement |
|--------------------|---------------------|
| `border-black`, `border-{dark}` | `border-line` |
| `border-gray-*`, `border-{muted}` | `border-line/20` or `border-rule` |
| `ring-{focus-color}` | `ring-focus` |
| `focus-visible:ring-green`, `ring-blue` | `focus-visible:ring-focus` |

### Shadow CSS Variables

Shadows often use CSS variables for colors. Replace brand tokens in shadow definitions:

```tsx
// Before
className="shadow-[2px_2px_0_0_var(--color-black)]"

// After
className="shadow-[2px_2px_0_0_var(--color-line)]"
```

| Shadow Pattern | Replacement |
|---------------|-------------|
| `var(--color-black)` in shadow | `var(--color-line)` |
| `var(--color-white)` in shadow | `var(--color-edge-inverted)` |

### Action Tokens

| Common Brand Usage | Semantic Replacement |
|--------------------|---------------------|
| `bg-{primary-action-color}` | `bg-accent` |
| `bg-{red-color}` (for delete) | `bg-danger` |

### Status Tokens

| Common Brand Usage | Semantic Replacement |
|--------------------|---------------------|
| `bg-green`, `text-green` | `bg-success`, `text-success` |
| `bg-red`, `text-red` | `bg-danger`, `text-danger` |
| `bg-yellow`, `text-yellow` | `bg-warning`, `text-warning` |
| `bg-blue`, `text-blue` | `bg-link`, `text-link` |

---

## Handling Edge Cases

### Conditional Classes

```tsx
// Before
className={cn(
  "base-classes",
  variant === 'dark' && "bg-black text-white",
  variant === 'light' && "bg-white text-black"
)}

// After
className={cn(
  "base-classes",
  variant === 'dark' && "bg-inv text-flip",
  variant === 'light' && "bg-page text-main"
)}
```

### CVA Variants

```tsx
// Before
const cardVariants = cva("border", {
  variants: {
    variant: {
      default: "bg-white border-black",
      dark: "bg-black border-white text-white"
    }
  }
});

// After
const cardVariants = cva("border", {
  variants: {
    variant: {
      default: "bg-page border-line",
      dark: "bg-inv border-flip text-flip"
    }
  }
});
```

### Dynamic Classes

```tsx
// Before
style={{ backgroundColor: isActive ? 'black' : 'white' }}

// After (prefer Tailwind)
className={isActive ? 'bg-inv' : 'bg-page'}
```

---

## Handling Multiple Occurrences

When replacing tokens that appear multiple times in a file, use `replace_all=true` to replace all occurrences at once. This commonly happens with:
- Focus ring classes (multiple buttons/inputs in one component)
- Border classes in conditional variants
- Background classes in CVA definitions

## Verification Commands

```bash
# Check for remaining brand tokens
grep -rn "bg-black\|bg-white\|text-black\|text-white" components/

# Check for hardcoded colors
grep -rn "bg-\[#\|text-\[#\|border-\[#" components/

# Check for brand tokens in shadow definitions
grep -rn "var(--color-black)\|var(--color-white)" components/

# Check for brand tokens in focus rings
grep -rn "ring-green\|ring-blue\|ring-black" components/

# Verify semantic tokens are used
grep -rn "bg-surface-\|text-content-\|border-edge-" components/

# Run build to verify no broken classes
npm run build
```
