# Component Demo Requirements

## Rendering patterns

### Plain — just pass props
Alert, Breadcrumbs, Card, CountdownTimer, Progress, Tooltip

### Controlled — caller owns state
- Switch: `checked` + `onChange`
- Slider: `value` + `onChange`
- Checkbox: `checked` + `onChange` (functionally required)

### Namespace + state hook
- Tabs: `useTabsState()` → `{ state, actions, meta }`
- Dialog: `useDialogState()` → `{ state, actions }`
- Select: `useSelectState()` → `{ state, actions }`
- HelpPanel: `useHelpPanelState()` → `{ state, actions }`
- Accordion: `useAccordionState()` → `{ state, actions, meta }`

### Namespace, uncontrolled-capable
- StepperTabs: `items` array only, defaults to first item

### Provider + imperative
- Toast: `<ToastProvider>` wraps app, `useToast().addToast()` to fire

## Known API mismatches with plan
- CountdownTimer uses `endTime` (number | Date), NOT `targetDate`
- Accordion uses `useAccordionState()` hook (namespace + controlled), NOT `type="single"` API
- Alert sub-parts are `Alert.Root`, `Alert.Content`, etc. (not flat `<Alert variant>`)
