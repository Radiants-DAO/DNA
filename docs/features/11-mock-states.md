# Mock States

## Purpose

Mock States provides a system for simulating different application states during development. It allows designers and developers to preview how components behave under various conditions (loading, error, empty, etc.) without needing real data or backend connections.

**Mock States owns:**
- State presets (loading, error, empty, success)
- Custom state creation
- State activation/deactivation
- `useMockState()` hook for components

**What it doesn't own:**
- Actual data fetching (that's application code)
- Component logic (components use the hook)
- Real error handling (this is simulation only)

---

## Core Concept

### Problem Solved
During development, you need to see how components look in different states:
- What does a card look like while loading?
- How does a form display errors?
- What's the empty state for a list?

Normally you'd need to manipulate real data or add temporary code. Mock States lets you toggle these states visually.

### How It Works
```
┌─────────────────────────────────────┐
│  Mock States Tab                    │
├─────────────────────────────────────┤
│  [✓] Loading State                  │
│  [ ] Error State                    │
│  [ ] Empty State                    │
│  [ ] Custom: "new-user"             │
│                                     │
│  [+ Create Custom State]            │
└─────────────────────────────────────┘
```

Components use the `useMockState()` hook to read active states.

---

## State Presets

### Built-in States
Common states every application needs.

| State | Purpose | Typical Use |
|-------|---------|-------------|
| `loading` | Data fetching in progress | Skeletons, spinners |
| `error` | Something went wrong | Error messages, retry buttons |
| `empty` | No data available | Empty state illustrations |
| `success` | Operation completed | Success toasts, confirmations |

### Custom States
User-defined states for specific scenarios.

**Examples:**
- `new-user` — First-time user experience
- `premium` — Premium tier features visible
- `offline` — Offline mode simulation
- `maintenance` — Maintenance mode preview

---

## Tab Interface

### State List
All available states displayed.

**Display:**
```
MOCK STATES
─────────────────────────────────
Presets
  [✓] loading
  [ ] error
  [ ] empty
  [ ] success

Custom
  [ ] new-user
  [ ] premium

[+ Create Custom State]
```

### State Toggle
Click to activate/deactivate states.

**Behavior:**
- Single click toggles state
- Multiple states can be active simultaneously
- Active state shows checkmark
- Page updates immediately

### Custom State Creation
Add new states for specific scenarios.

**Flow:**
1. Click [+ Create Custom State]
2. Enter state name (kebab-case)
3. Optionally add default values (JSON)
4. State appears in Custom section

**Dialog:**
```
┌─────────────────────────────────┐
│  Create Custom State            │
├─────────────────────────────────┤
│  Name: [________________]       │
│                                 │
│  Default Values (JSON):         │
│  ┌───────────────────────────┐  │
│  │ {                         │  │
│  │   "message": "Welcome!"   │  │
│  │ }                         │  │
│  └───────────────────────────┘  │
│                                 │
│  [Cancel]            [Create]   │
└─────────────────────────────────┘
```

---

## Hook Integration

### useMockState Hook
Components read mock state via hook.

**Usage:**
```tsx
import { useMockState } from '@radflow/devtools';

function UserCard({ user }) {
  const { isActive, getValue } = useMockState();

  // Check if loading state is active
  if (isActive('loading')) {
    return <Skeleton />;
  }

  // Check if error state is active
  if (isActive('error')) {
    return <ErrorCard message={getValue('error', 'message')} />;
  }

  // Check custom state
  if (isActive('new-user')) {
    return <WelcomeCard />;
  }

  return <UserCard user={user} />;
}
```

### Hook API

**`isActive(stateName: string): boolean`**
Check if a specific state is currently active.

**`getValue(stateName: string, key: string): any`**
Get a value from a state's data object.

**`getActiveStates(): string[]`**
Get list of all currently active states.

---

## State Values

### Adding Values to States
States can have associated data.

**Example:**
```json
{
  "error": {
    "message": "Connection failed",
    "code": 500,
    "retryable": true
  },
  "empty": {
    "title": "No results",
    "suggestion": "Try a different search"
  }
}
```

### Editing State Values
Click state to expand and edit values.

**Expanded View:**
```
[✓] error
    ┌───────────────────────────┐
    │ {                         │
    │   "message": "...",       │
    │   "code": 500             │
    │ }                         │
    └───────────────────────────┘
    [Edit Values]
```

---

## Production Safety

### DevTools-Only Feature
Mock states only work when DevTools is active.

**Behavior:**
- `useMockState()` returns no-op in production
- No mock states shipped to production bundle
- Zero runtime cost in production
- Environment check via `NODE_ENV`

### Production Hook Behavior
```tsx
// In production, hook returns:
{
  isActive: () => false,
  getValue: () => undefined,
  getActiveStates: () => []
}
```

---

## Persistence

### State Persistence
Active states persist across page refreshes.

**Stored:**
- Active state list
- Custom state definitions
- State values

**Storage:**
- localStorage in development
- Cleared on DevTools uninstall

### State Sharing
Share state configuration with team.

**Export/Import:**
- Export all custom states as JSON
- Import states from file
- Useful for consistent testing across team

---

## Component Patterns

### Loading Pattern
```tsx
function DataList({ items }) {
  const { isActive } = useMockState();

  if (isActive('loading')) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  return <List items={items} />;
}
```

### Empty Pattern
```tsx
function SearchResults({ results }) {
  const { isActive, getValue } = useMockState();

  if (isActive('empty') || results.length === 0) {
    return (
      <EmptyState
        title={getValue('empty', 'title') || 'No results'}
        description={getValue('empty', 'suggestion')}
      />
    );
  }

  return <Results items={results} />;
}
```

### Error Pattern
```tsx
function ProfileCard({ userId }) {
  const { isActive, getValue } = useMockState();

  if (isActive('error')) {
    return (
      <ErrorCard
        message={getValue('error', 'message')}
        onRetry={() => refetch()}
      />
    );
  }

  return <Profile userId={userId} />;
}
```

---

## Ideal Behaviors

### State Combinations
Preview multiple states at once. See loading + error together. Test edge cases.

### State Timelines
Animate through state sequences. Loading → Success, Loading → Error. Record state transitions.

### Component State Map
Show which components respond to which states. Identify missing state handlers. Coverage report.

### State Screenshots
Capture component in each state. Generate state documentation. Visual regression testing.

---

## Research Notes

### Complexity Assessment
**Low** — Simple state management with localStorage persistence.

### Research Required

**State Management**
- Zustand slice for mock states
- localStorage persistence patterns
- Production build exclusion

**Hook Implementation**
- React context for state sharing
- No-op pattern for production
- TypeScript generics for getValue

### Search Terms
```
"react mock state development"
"storybook controls pattern"
"zustand localStorage persist"
"conditional rendering development only"
"react devtools context"
```

### Rust Backend Integration

| Module | Purpose |
|--------|---------|
| None | Mock states are frontend-only |

**Note:** This feature has no Rust backend requirements. It's purely a React/Zustand feature that runs in the webview.

### Open Questions
- Should mock states affect all component instances or be per-instance?
- State inheritance: can states extend other states?
- Integration with Storybook stories?
