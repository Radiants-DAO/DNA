# fn-7.23 Search Integration - Cmd+F with Cmd+1-4 scope filters

## Description
Implement a unified search interface accessible via Cmd+F that searches across different scopes within RadFlow. Scope filters allow quick switching between search targets.

**Search Scopes:**
1. **Elements** (Cmd+1): Search visible elements in preview by tag, class, text content
2. **Components** (Cmd+2): Search componentMap by component name
3. **Layers** (Cmd+3): Search Layers Panel tree by element name/class
4. **Assets** (Cmd+4): Search Assets Panel by filename

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ 🔍 [Search...                              ]    │
│    [Elements] [Components] [Layers] [Assets]    │
│                                                 │
│ Results:                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ 📦 Button - src/components/Button.tsx       │ │
│ │ 📦 Card - src/components/Card.tsx           │ │
│ │ 📄 button.svg                               │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Behavior:**
- Cmd+F opens search overlay/modal
- Typing filters results in real-time (fuzzy match)
- Cmd+1-4 switches scope without closing search
- Enter on result navigates to/selects that item
- Escape closes search
- Recent searches remembered (localStorage)

**Result Actions:**
- Element result → Selects element in preview, scrolls into view
- Component result → Selects component, shows in Designer Panel
- Layer result → Expands tree to layer, selects it
- Asset result → Copies asset path or opens preview

## Acceptance
- [ ] Cmd+F opens search overlay
- [ ] Search input with auto-focus
- [ ] Scope filter buttons (Elements/Components/Layers/Assets)
- [ ] Cmd+1-4 shortcuts switch scope
- [ ] Fuzzy search matching
- [ ] Real-time filtering as user types
- [ ] Enter selects result and performs scope-specific action
- [ ] Escape closes search
- [ ] Recent searches in localStorage
- [ ] Empty state when no results
- [ ] Result count indicator

## Files
- `src/components/search/SearchOverlay.tsx`
- `src/hooks/useSearch.ts`
- `src/utils/fuzzySearch.ts`
- Integration with keyboard shortcuts (fn-7.3)

## Done summary
Implemented - merged from fn-7 branch
## Evidence
- Commits:
- Tests:
- PRs: