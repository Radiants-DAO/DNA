# Task Template: Component Schema

Use this template for tasks that add .meta.ts files to components (.schema.json is generated from meta).

---

## Task Structure

```markdown
# Task: {Component} Schema

**Sprint:** 2 or 3
**Dependencies:** 01-token-foundation
**Complexity:** {simple/medium}

## Description

Add canonical component metadata for the {Component} component:
- `.meta.ts` - Authored source of props, variants, slots, examples, token bindings, and registry facts
- `.schema.json` - Generated artifact derived from `.meta.ts` for AI interfaces

## Files to Create

- `{component_path}/{Component}.meta.ts`

## Implementation Steps

### 1. Analyze the Component

Read the component file and extract:
- TypeScript interface/props type
- Variant values (from cva, conditional classes, or props)
- Slot props (children, icon, etc.)

### 2. Generate .schema.json

```json
{
  "name": "{Component}",
  "description": "{Brief description of component purpose}",
  "props": {
    "{propName}": {
      "type": "{string|number|boolean|enum}",
      "values": ["{for enums only}"],
      "default": "{default value}",
      "description": "{What this prop does}"
    }
  },
  "slots": {
    "children": {
      "description": "{What goes in children}"
    },
    "{slotName}": {
      "description": "{What this slot accepts}"
    }
  },
  "examples": [
    {
      "name": "{Example name}",
      "code": "{JSX usage example}"
    }
  ]
}
```

### 3. Add tokenBindings and registry metadata to `.meta.ts`

```json
{
  "component": "{Component}",
  "description": "Token bindings for {Component} variants",
  "tokenBindings": {
    "base": {
      "{property}": "{token-name without --color- prefix}"
    },
    "{variant}": {
      "background": "{surface-* or action-*}",
      "text": "{content-*}",
      "border": "{edge-*}"
    }
  },
  "states": {
    "disabled": {
      "opacity": "50%"
    },
    "hover": {
      "{property}": "{value}"
    }
  }
}
```

## For Compound Components

Add a `subcomponents` array to the schema:

```json
{
  "name": "Dialog",
  "description": "Modal dialog component",
  "subcomponents": [
    "DialogTrigger",
    "DialogContent",
    "DialogHeader",
    "DialogTitle",
    "DialogDescription",
    "DialogBody",
    "DialogFooter",
    "DialogClose"
  ],
  "props": { ... }
}
```

## Validation Criteria

- [ ] .meta.ts exists and is valid TypeScript
- [ ] .schema.json is generated from meta
- [ ] Props match TypeScript interface
- [ ] All variants are documented
- [ ] At least 2-3 examples provided
- [ ] Token bindings live in `.meta.ts` and use semantic tokens (surface-*, content-*, edge-*)

## Commit Message

```
feat({component}): add component metadata

- Add {Component}.meta.ts with props, examples, and token bindings
- Generate {Component}.schema.json from meta
```
```

---

## Reference Examples

### Simple Component Schema (Button)

```json
{
  "name": "Button",
  "description": "Primary action trigger",
  "props": {
    "variant": {
      "type": "enum",
      "values": ["primary", "secondary", "outline", "ghost"],
      "default": "primary",
      "description": "Visual variant"
    },
    "size": {
      "type": "enum",
      "values": ["sm", "md", "lg"],
      "default": "md",
      "description": "Size preset"
    },
    "disabled": {
      "type": "boolean",
      "default": false
    }
  },
  "slots": {
    "children": { "description": "Button label" },
    "icon": { "description": "Icon component" }
  },
  "examples": [
    { "name": "Primary", "code": "<Button>Click me</Button>" },
    { "name": "With icon", "code": "<Button icon={<Arrow />}>Next</Button>" }
  ]
}
```

### Simple Component Token Bindings (Button)

```json
{
  "component": "Button",
  "description": "Token bindings for Button variants",
  "tokenBindings": {
    "base": {
      "border": "line",
      "focusRing": "focus"
    },
    "primary": {
      "background": "accent",
      "text": "main"
    },
    "secondary": {
      "background": "inv",
      "text": "flip"
    }
  },
  "states": {
    "disabled": { "opacity": "50%" },
    "hover": { "transform": "translateY(-0.125rem)" }
  }
}
```

### Compound Component Schema (Dialog)

```json
{
  "name": "Dialog",
  "description": "Modal dialog with overlay",
  "subcomponents": [
    "DialogTrigger",
    "DialogContent",
    "DialogHeader",
    "DialogTitle",
    "DialogDescription",
    "DialogBody",
    "DialogFooter",
    "DialogClose"
  ],
  "props": {
    "open": {
      "type": "boolean",
      "description": "Controlled open state"
    },
    "onOpenChange": {
      "type": "function",
      "description": "Callback when open state changes"
    }
  },
  "slots": {
    "children": { "description": "Dialog subcomponents" }
  },
  "examples": [
    {
      "name": "Basic dialog",
      "code": "<Dialog>\n  <DialogTrigger>Open</DialogTrigger>\n  <DialogContent>\n    <DialogHeader>\n      <DialogTitle>Title</DialogTitle>\n    </DialogHeader>\n    <DialogBody>Content</DialogBody>\n  </DialogContent>\n</Dialog>"
    }
  ]
}
```

---

## Extraction Tips

1. **Props from TypeScript:**
   ```tsx
   interface ButtonProps {
     variant?: 'primary' | 'secondary';  // → enum with values
     disabled?: boolean;                  // → boolean
     onClick?: () => void;                // → function (usually skip)
   }
   ```

2. **Variants from cva:**
   ```tsx
   const buttonVariants = cva("base", {
     variants: {
       variant: { primary: "...", secondary: "..." },
       size: { sm: "...", md: "...", lg: "..." }
     }
   });
   // → Extract variant names and values
   ```

3. **Slots from JSX:**
   ```tsx
   function Button({ children, icon, loadingIndicator }) {
     return <button>{icon}{children}</button>;
   }
   // → slots: children, icon, loadingIndicator
   ```
