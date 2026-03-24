# Gotchas & Common Mistakes

> Part of the [use_figma skill](../SKILL.md). Every known pitfall with WRONG/CORRECT code examples.

## New nodes default to (0,0) and overlap existing content

```js
// WRONG — top-level node lands at (0,0)
const frame = figma.createFrame()
figma.currentPage.appendChild(frame)

// CORRECT — find existing content bounds and offset
const page = figma.currentPage
let maxX = 0
for (const child of page.children) {
  maxX = Math.max(maxX, child.x + child.width)
}
const frame = figma.createFrame()
figma.currentPage.appendChild(frame)
frame.x = maxX + 100
```

## `addComponentProperty` returns a string key, not an object

```js
// WRONG — treating return as object
const result = comp.addComponentProperty('Label', 'TEXT', 'Button')
const propKey = Object.keys(result)[0]  // BUG: returns '0'

// CORRECT — return value IS the key string
const propKey = comp.addComponentProperty('Label', 'TEXT', 'Button')
labelNode.componentPropertyReferences = { characters: propKey }
```

## MUST return ALL created/mutated node IDs

```js
// CORRECT
return {
  createdNodeIds: [frame.id, rect.id, text.id],
  rootNodeId: frame.id
}
```

## Colors are 0–1 range

```js
// WRONG
node.fills = [{ type: 'SOLID', color: { r: 255, g: 0, b: 0 } }]

// CORRECT
node.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]
```

## Fills/strokes are immutable arrays

```js
// WRONG — modifying in place does nothing
node.fills[0].color = { r: 1, g: 0, b: 0 }

// CORRECT — clone, modify, reassign
const fills = JSON.parse(JSON.stringify(node.fills))
fills[0].color = { r: 1, g: 0, b: 0 }
node.fills = fills
```

## setBoundVariableForPaint returns a NEW paint

```js
// WRONG — ignoring return value
figma.variables.setBoundVariableForPaint(paint, "color", colorVar)
node.fills = [paint]  // paint is unchanged!

// CORRECT
const boundPaint = figma.variables.setBoundVariableForPaint(paint, "color", colorVar)
node.fills = [boundPaint]
```

## Variable collection starts with 1 mode

```js
const collection = figma.variables.createVariableCollection("Colors")
// collection.modes = [{ modeId: "...", name: "Mode 1" }]
collection.renameMode(collection.modes[0].modeId, "Light")
const darkModeId = collection.addMode("Dark")
```

## Page switching: sync setter throws

```js
// WRONG — throws error
figma.currentPage = targetPage

// CORRECT
await figma.setCurrentPageAsync(targetPage)
```

## Never use figma.notify()

```js
// WRONG — throws "not implemented"
figma.notify("Done!")

// CORRECT
return "Done!"
```

## `getPluginData()` / `setPluginData()` are not supported

Use `getSharedPluginData()` / `setSharedPluginData()` instead.

## COLOR variable values use {r, g, b, a} (with alpha)

```js
// Paint colors: {r, g, b} (no alpha)
node.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]

// COLOR variable values: {r, g, b, a} (with alpha)
colorVar.setValueForMode(modeId, { r: 1, g: 0, b: 0, a: 1 })
```

## `layoutSizingVertical/Horizontal = 'FILL'` requires auto-layout parent FIRST

```js
// WRONG
child.layoutSizingVertical = 'FILL'  // ERROR
parent.appendChild(child)

// CORRECT — append first, then set FILL
parent.appendChild(child)
child.layoutSizingVertical = 'FILL'
```

## `resize()` resets sizing modes to FIXED

```js
// WRONG — resize() after setting sizing mode overwrites it
frame.primaryAxisSizingMode = 'AUTO'
frame.resize(300, 10)  // BUG: resets BOTH axes to 'FIXED'

// CORRECT — call resize() FIRST, then set sizing modes
frame.resize(300, 40)
frame.primaryAxisSizingMode = 'AUTO'
```

## Variables default to `ALL_SCOPES` — always set scopes explicitly

```js
// WRONG — variable appears everywhere
const bgColor = figma.variables.createVariable("bg", coll, "COLOR")

// CORRECT
bgColor.scopes = ["FRAME_FILL", "SHAPE_FILL"]
```

## `TextStyle.setBoundVariable` not available in headless use_figma

```js
// WRONG — throws "not a function"
ts.setBoundVariable("fontSize", fontSizeVar)

// CORRECT — set raw values; bind variables interactively later
ts.fontSize = 24
```

## `lineHeight` and `letterSpacing` must be objects

```js
// WRONG
style.lineHeight = 1.5

// CORRECT
style.lineHeight = { unit: "AUTO" }
style.lineHeight = { value: 24, unit: "PIXELS" }
style.letterSpacing = { value: 0, unit: "PIXELS" }
```

## combineAsVariants does NOT auto-layout in headless mode

```js
// Must manually layout children after combining
const cs = figma.combineAsVariants(components, figma.currentPage)
cs.children.forEach((child, i) => {
  child.x = (i % numCols) * colWidth
  child.y = Math.floor(i / numCols) * rowHeight
})
let maxX = 0, maxY = 0
for (const child of cs.children) {
  maxX = Math.max(maxX, child.x + child.width)
  maxY = Math.max(maxY, child.y + child.height)
}
cs.resizeWithoutConstraints(maxX + 40, maxY + 40)
```

## Mode names must be descriptive — never leave 'Mode 1'

```js
// WRONG
const coll = figma.variables.createVariableCollection('Colors')
// leaves default 'Mode 1'

// CORRECT
coll.renameMode(coll.modes[0].modeId, 'Light')
```

## CSS variable names must not contain spaces

```js
// WRONG
`var(--${figmaName.replace(/\//g, '-').toLowerCase()})`

// CORRECT
`var(--${figmaName.replace(/[\s\/]+/g, '-').toLowerCase()})`
```

## `detachInstance()` invalidates ancestor node IDs

Re-discover by traversal from a stable frame after detaching.

## Sections don't auto-resize to fit content

Always explicitly resize after adding content.
