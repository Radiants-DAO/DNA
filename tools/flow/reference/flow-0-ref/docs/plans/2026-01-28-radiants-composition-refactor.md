# Radiants Composition Patterns Refactor

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor @rdna/radiants from C+ to A in Vercel composition pattern adherence — migrate React 19 APIs, eliminate boolean prop proliferation, add Provider/Frame separation, and enable dependency injection.

**Architecture:** Five phases ordered by effort-to-impact ratio: (1) React 19 API migration (low effort, high impact), (2) boolean prop elimination via explicit variant components, (3) Provider/Frame separation starting with Accordion as reference implementation, (4) generic context interfaces for dependency injection, (5) compound component conversions for remaining monolithic components.

**Tech Stack:** React 19, TypeScript 5.8, Tailwind v4

---

## Phase 1: React 19 API Migration (4 tasks)

### Task 1: Remove forwardRef from Checkbox + Radio

**Files:**
- Modify: `packages/radiants/components/core/Checkbox/Checkbox.tsx`

**Step 1: Read the current file**

Open `packages/radiants/components/core/Checkbox/Checkbox.tsx` and locate the `forwardRef` wrappers at lines ~55 and ~108.

**Step 2: Refactor Checkbox to use ref as regular prop**

Replace:
```tsx
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, className = '', disabled, ...props }, ref) {
    return (
      // ... component body
      <input ref={ref} ... />
    );
  }
);
```

With:
```tsx
export function Checkbox({
  ref,
  label,
  className = '',
  disabled,
  ...props
}: CheckboxProps & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    // ... component body unchanged
    <input ref={ref} ... />
  );
}
```

**Step 3: Refactor Radio the same way**

Replace the `forwardRef` wrapper on Radio with the same pattern — `ref` as a regular prop.

**Step 4: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Checkbox/Checkbox.tsx
git commit -m "refactor(radiants): remove forwardRef from Checkbox and Radio (React 19)"
```

---

### Task 2: Remove forwardRef from Input + TextArea

**Files:**
- Modify: `packages/radiants/components/core/Input/Input.tsx`

**Step 1: Read the current file**

Open `packages/radiants/components/core/Input/Input.tsx` and locate the `forwardRef` wrappers on Input (~line 81) and TextArea (~line 135).

**Step 2: Refactor Input**

Replace:
```tsx
export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ size = 'md', error, icon, fullWidth, className = '', ...props }, ref) {
    return (
      <input ref={ref} ... />
    );
  }
);
```

With:
```tsx
export function Input({
  ref,
  size = 'md',
  error,
  icon,
  fullWidth,
  className = '',
  ...props
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <input ref={ref} ... />
  );
}
```

**Step 3: Refactor TextArea the same way**

Replace `forwardRef<HTMLTextAreaElement, TextAreaProps>` wrapper with `ref` as a regular prop.

**Step 4: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Input/Input.tsx
git commit -m "refactor(radiants): remove forwardRef from Input and TextArea (React 19)"
```

---

### Task 3: Replace useContext with use() in all context-based components

**Files:**
- Modify: `packages/radiants/components/core/Accordion/Accordion.tsx`
- Modify: `packages/radiants/components/core/ContextMenu/ContextMenu.tsx`
- Modify: `packages/radiants/components/core/Dialog/Dialog.tsx`
- Modify: `packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx`
- Modify: `packages/radiants/components/core/Popover/Popover.tsx`
- Modify: `packages/radiants/components/core/Sheet/Sheet.tsx`
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`
- Modify: `packages/radiants/components/core/Toast/Toast.tsx`

**Step 1: For each file, find the `useContext` import and context hook**

Every file has a pattern like:
```tsx
import { createContext, useContext, ... } from 'react';

function useSomeContext() {
  const context = useContext(SomeContext);
  if (!context) throw new Error('...');
  return context;
}
```

**Step 2: Replace useContext with use in each file**

Change imports:
```tsx
// Before:
import { createContext, useContext, useState, ... } from 'react';

// After:
import { createContext, use, useState, ... } from 'react';
```

Change the hook:
```tsx
// Before:
const context = useContext(SomeContext);

// After:
const context = use(SomeContext);
```

Do this for all 8 files. The `use()` API is a drop-in replacement for `useContext()` in React 19.

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/radiants/components/core/Accordion/Accordion.tsx \
       packages/radiants/components/core/ContextMenu/ContextMenu.tsx \
       packages/radiants/components/core/Dialog/Dialog.tsx \
       packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx \
       packages/radiants/components/core/Popover/Popover.tsx \
       packages/radiants/components/core/Sheet/Sheet.tsx \
       packages/radiants/components/core/Tabs/Tabs.tsx \
       packages/radiants/components/core/Toast/Toast.tsx
git commit -m "refactor(radiants): replace useContext with use() across 8 components (React 19)"
```

---

### Task 4: Update createContext calls to use React 19 syntax

**Files:**
- Same 8 files as Task 3

**Step 1: Update Context.Provider to Context (React 19 shorthand)**

In React 19, `<Context.Provider value={...}>` can be replaced with `<Context value={...}>`.

For each file, find:
```tsx
<SomeContext.Provider value={contextValue}>
  {children}
</SomeContext.Provider>
```

Replace with:
```tsx
<SomeContext value={contextValue}>
  {children}
</SomeContext>
```

Do this for all 8 files.

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add packages/radiants/components/core/Accordion/Accordion.tsx \
       packages/radiants/components/core/ContextMenu/ContextMenu.tsx \
       packages/radiants/components/core/Dialog/Dialog.tsx \
       packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx \
       packages/radiants/components/core/Popover/Popover.tsx \
       packages/radiants/components/core/Sheet/Sheet.tsx \
       packages/radiants/components/core/Tabs/Tabs.tsx \
       packages/radiants/components/core/Toast/Toast.tsx
git commit -m "refactor(radiants): use React 19 Context shorthand (drop .Provider)"
```

---

## Phase 2: Boolean Prop Elimination (5 tasks)

### Task 5: Extract IconButton from Button

**Files:**
- Modify: `packages/radiants/components/core/Button/Button.tsx`
- Modify: `packages/radiants/components/core/Button/Button.schema.json`
- Modify: `packages/radiants/components/core/index.ts`

**Step 1: Read Button.tsx**

Open `packages/radiants/components/core/Button/Button.tsx`. Locate the `iconOnly` boolean prop and all conditional logic it controls.

**Step 2: Create IconButton as a named export in the same file**

After the existing `Button` function, add:

```tsx
interface IconButtonProps extends Omit<ButtonProps, 'iconOnly' | 'children'> {
  /** The icon to display */
  icon: React.ReactNode;
  /** Accessible label (required for icon-only buttons) */
  'aria-label': string;
}

/**
 * IconButton — A square button that shows only an icon.
 * Explicit variant of Button for icon-only use cases.
 */
export function IconButton({
  icon,
  size = 'md',
  variant = 'ghost',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: IconButtonProps) {
  const sizeClasses: Record<string, string> = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`${sizeClasses[size]} p-0 flex items-center justify-center ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      {icon}
    </Button>
  );
}
```

**Step 3: Deprecate iconOnly prop on Button**

Add a JSDoc `@deprecated` tag to the `iconOnly` prop in ButtonProps:

```tsx
/** @deprecated Use IconButton component instead */
iconOnly?: boolean;
```

Do NOT remove the prop yet — backward compatibility.

**Step 4: Add IconButton to barrel export**

In `packages/radiants/components/core/index.ts`, add:
```tsx
export { IconButton } from './Button/Button';
```

**Step 5: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/radiants/components/core/Button/Button.tsx \
       packages/radiants/components/core/index.ts
git commit -m "refactor(radiants): extract IconButton, deprecate iconOnly prop"
```

---

### Task 6: Extract LoadingButton from Button

**Files:**
- Modify: `packages/radiants/components/core/Button/Button.tsx`

**Step 1: Read Button.tsx and locate loading logic**

Find the `loading` boolean prop and all conditional rendering it controls (spinner overlay, disabled state, aria-busy).

**Step 2: Create LoadingButton as a named export**

```tsx
interface LoadingButtonProps extends Omit<ButtonProps, 'loading' | 'disabled'> {
  /** Whether the async action is in progress */
  isLoading: boolean;
  /** Text shown during loading (defaults to children) */
  loadingText?: React.ReactNode;
  /** Custom loading indicator */
  loadingIndicator?: React.ReactNode;
}

/**
 * LoadingButton — A button with built-in loading state.
 * Explicit variant of Button for async actions.
 */
export function LoadingButton({
  isLoading,
  loadingText,
  loadingIndicator,
  children,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={isLoading}
      aria-busy={isLoading}
      className={`relative ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          {loadingIndicator || (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
        </span>
      )}
      <span className={isLoading ? 'invisible' : ''}>
        {isLoading && loadingText ? loadingText : children}
      </span>
    </Button>
  );
}
```

**Step 3: Deprecate loading prop on Button**

```tsx
/** @deprecated Use LoadingButton component instead */
loading?: boolean;
```

**Step 4: Add LoadingButton to barrel export**

```tsx
export { LoadingButton } from './Button/Button';
```

**Step 5: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/radiants/components/core/Button/Button.tsx \
       packages/radiants/components/core/index.ts
git commit -m "refactor(radiants): extract LoadingButton, deprecate loading prop"
```

---

### Task 7: Remove boolean flags from Input

**Files:**
- Modify: `packages/radiants/components/core/Input/Input.tsx`

**Step 1: Read Input.tsx and identify boolean props**

Props to address: `error?: boolean`, `fullWidth?: boolean`.

**Step 2: Replace error boolean with data attribute pattern**

Replace:
```tsx
error?: boolean;
// ... in render:
className={`... ${error ? 'border-status-error' : 'border-edge-primary'}`}
```

With:
```tsx
/** @deprecated Pass className="border-status-error" instead */
error?: boolean;
// Keep backward compat but document the preferred pattern
```

**Step 3: Replace fullWidth boolean with className**

Replace:
```tsx
fullWidth?: boolean;
// ... in render:
className={`... ${fullWidth ? 'w-full' : ''}`}
```

With:
```tsx
/** @deprecated Pass className="w-full" instead */
fullWidth?: boolean;
// Keep backward compat
```

**Step 4: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Input/Input.tsx
git commit -m "refactor(radiants): deprecate boolean flags on Input, prefer className"
```

---

### Task 8: Remove noPadding from Card

**Files:**
- Modify: `packages/radiants/components/core/Card/Card.tsx`

**Step 1: Read Card.tsx**

Locate the `noPadding` boolean prop and how it affects rendering.

**Step 2: Deprecate noPadding**

```tsx
/** @deprecated Use className to control padding instead */
noPadding?: boolean;
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/radiants/components/core/Card/Card.tsx
git commit -m "refactor(radiants): deprecate noPadding boolean on Card"
```

---

### Task 9: Remove showLabel from Progress

**Files:**
- Modify: `packages/radiants/components/core/Progress/Progress.tsx`

**Step 1: Read Progress.tsx**

Locate `showLabel?: boolean` and the conditional rendering.

**Step 2: Extract ProgressLabel as a separate component**

Add after the Progress component:

```tsx
interface ProgressLabelProps {
  /** Current value */
  value: number;
  /** Maximum value */
  max?: number;
  /** Custom format function */
  format?: (value: number, max: number) => string;
  className?: string;
}

/**
 * ProgressLabel — Displays progress percentage text.
 * Use alongside Progress for labeled progress bars.
 */
export function ProgressLabel({
  value,
  max = 100,
  format,
  className = '',
}: ProgressLabelProps) {
  const percentage = Math.round((value / max) * 100);
  const text = format ? format(value, max) : `${percentage}%`;

  return (
    <div className={`text-xs text-content-secondary font-mono mt-1 ${className}`}>
      {text}
    </div>
  );
}
```

**Step 3: Deprecate showLabel prop**

```tsx
/** @deprecated Use <ProgressLabel> component alongside <Progress> instead */
showLabel?: boolean;
```

**Step 4: Add to barrel export**

```tsx
export { ProgressLabel } from './Progress/Progress';
```

**Step 5: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/radiants/components/core/Progress/Progress.tsx \
       packages/radiants/components/core/index.ts
git commit -m "refactor(radiants): extract ProgressLabel, deprecate showLabel prop"
```

---

## Phase 3: Provider/Frame Separation (3 tasks)

### Task 10: Implement Provider/Frame pattern on Accordion (reference implementation)

**Files:**
- Modify: `packages/radiants/components/core/Accordion/Accordion.tsx`

**Step 1: Read the full Accordion.tsx file**

Understand the current structure: `Accordion` (root + state), `AccordionItem`, `AccordionTrigger`, `AccordionContent`.

**Step 2: Define the generic context interface**

Replace the existing context type:

```tsx
// Before:
interface AccordionContextValue {
  type: 'single' | 'multiple';
  expandedItems: Set<string>;
  toggleItem: (value: string) => void;
}

// After:
interface AccordionState {
  expandedItems: Set<string>;
}

interface AccordionActions {
  toggleItem: (value: string) => void;
}

interface AccordionMeta {
  type: 'single' | 'multiple';
}

interface AccordionContextValue {
  state: AccordionState;
  actions: AccordionActions;
  meta: AccordionMeta;
}
```

**Step 3: Create AccordionProvider (state management only)**

```tsx
interface AccordionProviderProps {
  children: React.ReactNode;
  /** Accordion type */
  type?: 'single' | 'multiple';
  /** Controlled expanded items */
  value?: string[];
  /** Default expanded items (uncontrolled) */
  defaultValue?: string[];
  /** Called when items change */
  onValueChange?: (value: string[]) => void;
}

function AccordionProvider({
  children,
  type = 'single',
  value,
  defaultValue = [],
  onValueChange,
}: AccordionProviderProps) {
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(
    new Set(defaultValue)
  );

  const isControlled = value !== undefined;
  const expandedItems = isControlled ? new Set(value) : internalExpanded;

  const toggleItem = useCallback(
    (itemValue: string) => {
      const newExpanded = new Set(expandedItems);

      if (newExpanded.has(itemValue)) {
        newExpanded.delete(itemValue);
      } else {
        if (type === 'single') {
          newExpanded.clear();
        }
        newExpanded.add(itemValue);
      }

      if (!isControlled) {
        setInternalExpanded(newExpanded);
      }
      onValueChange?.(Array.from(newExpanded));
    },
    [expandedItems, type, isControlled, onValueChange]
  );

  const contextValue: AccordionContextValue = {
    state: { expandedItems },
    actions: { toggleItem },
    meta: { type },
  };

  return (
    <AccordionContext value={contextValue}>
      {children}
    </AccordionContext>
  );
}
```

**Step 4: Create AccordionFrame (structure only)**

```tsx
interface AccordionFrameProps {
  children: React.ReactNode;
  className?: string;
}

function AccordionFrame({ children, className = '' }: AccordionFrameProps) {
  return <div className={`space-y-0 ${className}`}>{children}</div>;
}
```

**Step 5: Update sub-components to use new context shape**

In `AccordionTrigger` and `AccordionContent`, update context access:

```tsx
// Before:
const { expandedItems, toggleItem, type } = useAccordionContext();

// After:
const { state, actions, meta } = useAccordionContext();
const { expandedItems } = state;
const { toggleItem } = actions;
```

**Step 6: Keep backward-compatible Accordion export**

The existing `Accordion` function stays as a convenience wrapper:

```tsx
/**
 * Accordion — Convenience wrapper combining Provider + Frame.
 * For full control, use Accordion.Provider + Accordion.Frame separately.
 */
export function Accordion({
  type = 'single',
  value,
  defaultValue,
  onValueChange,
  children,
  className,
}: AccordionProps) {
  return (
    <AccordionProvider
      type={type}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    >
      <AccordionFrame className={className}>
        {children}
      </AccordionFrame>
    </AccordionProvider>
  );
}

// Attach sub-components for compound pattern
Accordion.Provider = AccordionProvider;
Accordion.Frame = AccordionFrame;
Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;
```

**Step 7: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 8: Commit**

```bash
git add packages/radiants/components/core/Accordion/Accordion.tsx
git commit -m "refactor(radiants): implement Provider/Frame pattern on Accordion (reference)"
```

---

### Task 11: Apply Provider/Frame pattern to Dialog

**Files:**
- Modify: `packages/radiants/components/core/Dialog/Dialog.tsx`

**Step 1: Read Dialog.tsx**

Understand current context shape and state management.

**Step 2: Define generic context interface**

```tsx
interface DialogState {
  open: boolean;
}

interface DialogActions {
  setOpen: (open: boolean) => void;
  close: () => void;
}

interface DialogMeta {}

interface DialogContextValue {
  state: DialogState;
  actions: DialogActions;
  meta: DialogMeta;
}
```

**Step 3: Create DialogProvider**

```tsx
interface DialogProviderProps {
  children: React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
}

function DialogProvider({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: DialogProviderProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  const close = useCallback(() => setOpen(false), [setOpen]);

  const contextValue: DialogContextValue = {
    state: { open },
    actions: { setOpen, close },
    meta: {},
  };

  return (
    <DialogContext value={contextValue}>
      {children}
    </DialogContext>
  );
}
```

**Step 4: Update sub-components**

Update `DialogTrigger`, `DialogContent`, `DialogClose` to destructure from `state`/`actions`:
```tsx
const { state, actions } = useDialogContext();
const { open } = state;
const { setOpen, close } = actions;
```

**Step 5: Keep backward-compatible Dialog export with attached sub-components**

```tsx
Dialog.Provider = DialogProvider;
Dialog.Trigger = DialogTrigger;
Dialog.Content = DialogContent;
Dialog.Header = DialogHeader;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Body = DialogBody;
Dialog.Footer = DialogFooter;
Dialog.Close = DialogClose;
```

**Step 6: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 7: Commit**

```bash
git add packages/radiants/components/core/Dialog/Dialog.tsx
git commit -m "refactor(radiants): apply Provider/Frame pattern to Dialog"
```

---

### Task 12: Apply Provider/Frame pattern to Tabs

**Files:**
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`

**Step 1: Read Tabs.tsx**

**Step 2: Define generic context interface**

```tsx
interface TabsState {
  activeTab: string;
}

interface TabsActions {
  setActiveTab: (value: string) => void;
}

interface TabsMeta {
  variant: 'pill' | 'line';
  layout: 'default' | 'bottom-tabs';
}

interface TabsContextValue {
  state: TabsState;
  actions: TabsActions;
  meta: TabsMeta;
}
```

**Step 3: Create TabsProvider**

Follow the same pattern as Accordion/Dialog — extract state into a Provider, keep structure in Frame, maintain backward-compatible wrapper.

**Step 4: Update sub-components (TabList, TabTrigger, TabContent)**

```tsx
const { state, actions, meta } = useTabsContext();
```

**Step 5: Attach sub-components**

```tsx
Tabs.Provider = TabsProvider;
Tabs.Frame = TabsFrame;
Tabs.List = TabList;
Tabs.Trigger = TabTrigger;
Tabs.Content = TabContent;
```

**Step 6: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 7: Commit**

```bash
git add packages/radiants/components/core/Tabs/Tabs.tsx
git commit -m "refactor(radiants): apply Provider/Frame pattern to Tabs"
```

---

## Phase 4: Compound Component Conversions (3 tasks)

### Task 13: Convert Alert to compound component

**Files:**
- Modify: `packages/radiants/components/core/Alert/Alert.tsx`
- Modify: `packages/radiants/components/core/Alert/Alert.schema.json`

**Step 1: Read Alert.tsx**

Identify: `closable` boolean, `icon` slot, `closeIcon` slot, `variant`, `title`, `description`.

**Step 2: Create compound sub-components**

```tsx
function AlertIcon({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex-shrink-0 ${className}`}>{children}</div>;
}

function AlertContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex-1 min-w-0 ${className}`}>{children}</div>;
}

function AlertTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h4 className={`text-sm font-heading uppercase tracking-wider mb-1 ${className}`}>
      {children}
    </h4>
  );
}

function AlertDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs ${className}`}>{children}</p>;
}

function AlertClose({
  children,
  onClick,
  className = '',
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors ${className}`}
      aria-label="Close alert"
    >
      {children || (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
    </button>
  );
}
```

**Step 3: Keep backward-compatible Alert with attached sub-components**

The existing Alert stays unchanged (backward compat). Attach:

```tsx
Alert.Icon = AlertIcon;
Alert.Content = AlertContent;
Alert.Title = AlertTitle;
Alert.Description = AlertDescription;
Alert.Close = AlertClose;
```

**Step 4: Deprecate closable, icon, closeIcon props**

```tsx
/** @deprecated Use <Alert.Close> sub-component instead */
closable?: boolean;
/** @deprecated Use <Alert.Icon> sub-component instead */
icon?: React.ReactNode;
/** @deprecated Use <Alert.Close>{customIcon}</Alert.Close> instead */
closeIcon?: React.ReactNode;
```

**Step 5: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/radiants/components/core/Alert/Alert.tsx
git commit -m "refactor(radiants): convert Alert to compound component"
```

---

### Task 14: Convert HelpPanel to compound component with Provider

**Files:**
- Modify: `packages/radiants/components/core/HelpPanel/HelpPanel.tsx`

**Step 1: Read HelpPanel.tsx**

Identify: `isOpen` boolean (externally controlled), `onClose`, `title`, `closeButton` slot.

**Step 2: Create Provider + compound pattern**

```tsx
interface HelpPanelState {
  open: boolean;
}

interface HelpPanelActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const HelpPanelContext = createContext<{
  state: HelpPanelState;
  actions: HelpPanelActions;
} | null>(null);

function useHelpPanelContext() {
  const ctx = use(HelpPanelContext);
  if (!ctx) throw new Error('HelpPanel components must be used within HelpPanel.Provider');
  return ctx;
}

function HelpPanelProvider({ children, defaultOpen = false }: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const actions: HelpPanelActions = {
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((v) => !v),
  };

  return (
    <HelpPanelContext value={{ state: { open: isOpen }, actions }}>
      {children}
    </HelpPanelContext>
  );
}

function HelpPanelTrigger({ children }: { children: React.ReactNode }) {
  const { actions } = useHelpPanelContext();
  return (
    <button onClick={actions.toggle} type="button">
      {children}
    </button>
  );
}

function HelpPanelContent({ children, title }: { children: React.ReactNode; title?: string }) {
  const { state, actions } = useHelpPanelContext();

  if (!state.open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={actions.close} />
      <div className="fixed right-0 top-0 h-full w-80 max-w-[90vw] bg-surface-primary border-l-2 border-edge-primary z-50 animate-slide-in-right">
        <div className="flex items-center justify-between p-4 border-b border-edge-primary">
          {title && <h2 className="text-sm font-heading uppercase">{title}</h2>}
          <button onClick={actions.close} className="p-1 rounded hover:bg-white/10" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-57px)]">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}
```

**Step 3: Keep backward compat + attach sub-components**

```tsx
// Legacy export stays for backward compat
export function HelpPanel({ isOpen, onClose, title, children, closeButton }: HelpPanelProps) {
  // ... existing implementation unchanged
}

HelpPanel.Provider = HelpPanelProvider;
HelpPanel.Trigger = HelpPanelTrigger;
HelpPanel.Content = HelpPanelContent;
```

**Step 4: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/radiants/components/core/HelpPanel/HelpPanel.tsx
git commit -m "refactor(radiants): convert HelpPanel to compound component with Provider"
```

---

### Task 15: Convert Select to compound component

**Files:**
- Modify: `packages/radiants/components/core/Select/Select.tsx`

**Step 1: Read Select.tsx**

Identify: `options` array prop (should be composed), `disabled`, `error`, `fullWidth` booleans.

**Step 2: Create compound pattern**

```tsx
const SelectContext = createContext<{
  state: { open: boolean; value: string };
  actions: { setOpen: (v: boolean) => void; setValue: (v: string) => void };
} | null>(null);

function SelectProvider({ children, value, onChange, defaultValue = '' }: {
  children: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const isControlled = value !== undefined;
  const actualValue = isControlled ? value : internalValue;

  const setValue = useCallback((v: string) => {
    if (!isControlled) setInternalValue(v);
    onChange?.(v);
    setOpen(false);
  }, [isControlled, onChange]);

  return (
    <SelectContext value={{
      state: { open, value: actualValue },
      actions: { setOpen, setValue },
    }}>
      {children}
    </SelectContext>
  );
}

function SelectTrigger({ children, placeholder, className = '' }: {
  children?: React.ReactNode;
  placeholder?: string;
  className?: string;
}) {
  const { state, actions } = use(SelectContext)!;
  return (
    <button
      onClick={() => actions.setOpen(!state.open)}
      className={`flex items-center justify-between w-full px-3 h-10 rounded-md border-2 border-edge-primary bg-surface-primary text-sm ${className}`}
    >
      <span>{children || state.value || placeholder || 'Select...'}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

function SelectContent({ children, className = '' }: {
  children: React.ReactNode;
  className?: string;
}) {
  const { state } = use(SelectContext)!;
  if (!state.open) return null;
  return (
    <div className={`absolute top-full left-0 right-0 mt-1 border-2 border-edge-primary bg-surface-primary rounded-md shadow-card z-50 ${className}`}>
      {children}
    </div>
  );
}

function SelectOption({ value, children, disabled, className = '' }: {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const { state, actions } = use(SelectContext)!;
  const isActive = state.value === value;

  return (
    <button
      onClick={() => !disabled && actions.setValue(value)}
      disabled={disabled}
      className={`w-full text-left px-3 py-2 text-sm hover:bg-action-primary/10 ${isActive ? 'bg-action-primary text-content-inverted' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
```

**Step 3: Keep backward compat + attach**

Legacy `Select` with `options` array stays. Attach:

```tsx
Select.Provider = SelectProvider;
Select.Trigger = SelectTrigger;
Select.Content = SelectContent;
Select.Option = SelectOption;
```

**Step 4: Deprecate options prop**

```tsx
/** @deprecated Use Select.Provider + Select.Option compound pattern instead */
options?: SelectOption[];
```

**Step 5: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/radiants/components/core/Select/Select.tsx
git commit -m "refactor(radiants): convert Select to compound component"
```

---

## Phase 5: Update Schema Files (2 tasks)

### Task 16: Update schema.json files for new exports

**Files:**
- Modify: `packages/radiants/components/core/Button/Button.schema.json`
- Modify: `packages/radiants/components/core/Progress/Progress.schema.json`
- Modify: `packages/radiants/components/core/Alert/Alert.schema.json`
- Modify: `packages/radiants/components/core/Select/Select.schema.json`

**Step 1: For each schema file, add new sub-component entries**

In `Button.schema.json`, add to the `subcomponents` array:
```json
"subcomponents": ["IconButton", "LoadingButton"]
```

In `Progress.schema.json`:
```json
"subcomponents": ["ProgressLabel"]
```

In `Alert.schema.json`:
```json
"subcomponents": ["Alert.Icon", "Alert.Content", "Alert.Title", "Alert.Description", "Alert.Close"]
```

In `Select.schema.json`:
```json
"subcomponents": ["Select.Provider", "Select.Trigger", "Select.Content", "Select.Option"]
```

**Step 2: Add examples using new compound patterns**

Add to examples array in each schema:

Button example:
```json
{
  "name": "Icon Button",
  "code": "<IconButton icon={<SearchIcon />} aria-label=\"Search\" />"
}
```

Alert example:
```json
{
  "name": "Compound Alert",
  "code": "<Alert variant=\"success\"><Alert.Icon><CheckIcon /></Alert.Icon><Alert.Content><Alert.Title>Success</Alert.Title><Alert.Description>Done!</Alert.Description></Alert.Content><Alert.Close /></Alert>"
}
```

**Step 3: Commit**

```bash
git add packages/radiants/components/core/Button/Button.schema.json \
       packages/radiants/components/core/Progress/Progress.schema.json \
       packages/radiants/components/core/Alert/Alert.schema.json \
       packages/radiants/components/core/Select/Select.schema.json
git commit -m "docs(radiants): update schemas for new compound components"
```

---

### Task 17: Update barrel exports for all new components

**Files:**
- Modify: `packages/radiants/components/core/index.ts`

**Step 1: Verify all new exports are included**

Ensure `index.ts` exports:
```tsx
// New explicit variant components
export { IconButton, LoadingButton } from './Button/Button';
export { ProgressLabel } from './Progress/Progress';

// Existing components (already exported) now have .Provider, .Frame, etc.
// attached as static properties — no additional exports needed
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/packages/radiants && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add packages/radiants/components/core/index.ts
git commit -m "chore(radiants): finalize barrel exports for composition refactor"
```

---

## Verification Checklist

After all tasks complete:

1. `npx tsc --noEmit` passes with zero errors
2. All existing component APIs still work (backward compat via deprecated props)
3. New compound patterns work:
   - `<Accordion.Provider>` + `<Accordion.Frame>` + items
   - `<Dialog.Provider>` + sub-components
   - `<Tabs.Provider>` + sub-components
   - `<Alert>` with `<Alert.Icon>`, `<Alert.Close>` etc.
   - `<Select.Provider>` + `<Select.Option>`
   - `<HelpPanel.Provider>` + `<HelpPanel.Trigger>` + `<HelpPanel.Content>`
4. `<IconButton>` and `<LoadingButton>` render correctly
5. `<ProgressLabel>` renders percentage text
6. No `forwardRef` calls remain
7. No `useContext` calls remain (all replaced with `use()`)
8. No `Context.Provider` JSX remains (all use `<Context value={}>`)

---

## Notes

- **All deprecated props are kept** for backward compatibility. They can be removed in a future major version.
- **The Provider/Frame pattern** is applied to 3 components (Accordion, Dialog, Tabs) as a reference. The remaining 5 context-based components (ContextMenu, DropdownMenu, Popover, Sheet, Toast) can follow the same pattern in a follow-up.
- **No tests** — this is a refactor of a copy-on-import component library. Testing is via TypeScript compilation and visual verification in consuming apps.
