# Radiants Base UI Visual Compare

## Environment
- Baseline: http://localhost:3000
- Feature: http://localhost:3100
- Primary surface: RadOS -> Brand Assets -> Components tab

## Component Regression Matrix
| Section | Component | Baseline | Feature | Match (Y/N) | Notes |
|---|---|---|---|---|---|
| Forms | Select | Custom impl; opens on click/Enter; ArrowDown navigates options; Enter selects; Escape closes; data-variant="select" applied | | | |
| Forms | Checkbox/Radio | Custom impl; click and Space toggle checked state; onChange fires; label association present | | | |
| Forms | Switch/Slider | Custom impl; Space/Enter toggles switch; slider responds to Arrow keys with step increment; disabled state respected | | | |
| Navigation | Tabs | Custom impl; ArrowLeft/ArrowRight moves focus between triggers; selected tab shows active panel; data-variant hooks present | | | |
| Overlays | Dialog | Custom impl; opens via trigger; focus trapped inside; Escape closes; backdrop click closes | | | |
| Overlays | DropdownMenu | Custom impl; opens on trigger click; ArrowDown navigates items; Enter activates; Escape closes | | | |
| Overlays | ContextMenu | Custom impl; opens on right-click (contextmenu event); arrow navigation and Enter selection functional | | | |
| Overlays | Popover | Custom impl; opens on trigger interaction; closes on outside click; positioned relative to trigger | | | |
| Overlays | Sheet | Custom impl; slides in from side; Escape closes; backdrop click closes; side prop controls direction | | | |
| Feedback | Tooltip | Custom impl; appears on hover/focus; hides on blur/mouseleave; positioned relative to trigger | | | |
| Feedback | Toast | Custom impl; role=alert; appears via useToast; dismisses via close action; auto-dismiss supported | | | |
| Navigation | Accordion (Auctions app) | Custom impl; Enter/Space toggles panel; aria-expanded reflects state; single or multi expand mode | | | |

## Keyboard Interaction Baseline Notes

### Tabs
- ArrowLeft/ArrowRight moves focus between tab triggers
- Focus follows selection (active tab panel updates on focus change)
- Tab key moves focus out of tab list into panel content

### Select
- Trigger activates on click or Enter/Space
- ArrowDown/ArrowUp navigates options in open listbox
- Enter selects focused option and closes
- Escape closes without selection change

### Overlay Open/Close Flows
- **Dialog**: Trigger click opens; Escape closes; backdrop click closes; focus returns to trigger on close
- **Sheet**: Trigger click opens; Escape closes; backdrop click closes; side-specific slide animation
- **Popover**: Trigger click toggles; outside click closes; Escape closes
- **DropdownMenu**: Trigger click opens; Escape closes; item click closes and fires action
