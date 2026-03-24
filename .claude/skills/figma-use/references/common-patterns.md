# Common Patterns

> Part of the [use_figma skill](../SKILL.md). Working code examples for frequently used operations.

## Basic Script Structure

```js
const createdNodeIds = []
const mutatedNodeIds = []

// Your code here
return {
  success: true,
  createdNodeIds,
  mutatedNodeIds,
  count: createdNodeIds.length
}
```

## Create Variable Collection with Multiple Modes

```js
const collection = figma.variables.createVariableCollection("Theme/Colors")
collection.renameMode(collection.modes[0].modeId, "Light")
const darkModeId = collection.addMode("Dark")
const lightModeId = collection.modes[0].modeId

const bgVar = figma.variables.createVariable("bg", collection, "COLOR")
bgVar.setValueForMode(lightModeId, { r: 1, g: 1, b: 1, a: 1 })
bgVar.setValueForMode(darkModeId, { r: 0.1, g: 0.1, b: 0.1, a: 1 })

return {
  collectionId: collection.id,
  lightModeId,
  darkModeId,
  bgVarId: bgVar.id
}
```

## Bind Color Variable to a Fill

```js
const variable = await figma.variables.getVariableByIdAsync("VariableID:1:2")
const rect = figma.createRectangle()
const basePaint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }
const boundPaint = figma.variables.setBoundVariableForPaint(basePaint, "color", variable)
rect.fills = [boundPaint]
return { nodeId: rect.id }
```

## Create a Styled Shape

```js
const page = figma.currentPage
let maxX = 0
for (const child of page.children) {
  maxX = Math.max(maxX, child.x + child.width)
}

const rect = figma.createRectangle()
rect.name = "Blue Box"
rect.resize(200, 100)
rect.fills = [{ type: 'SOLID', color: { r: 0.047, g: 0.549, b: 0.914 } }]
rect.cornerRadius = 8
rect.x = maxX + 100
rect.y = 0
figma.currentPage.appendChild(rect)
return { nodeId: rect.id }
```

## Create a Text Node

```js
let maxX = 0
for (const child of figma.currentPage.children) {
  maxX = Math.max(maxX, child.x + child.width)
}

await figma.loadFontAsync({ family: "Inter", style: "Regular" })
const text = figma.createText()
text.characters = "Hello World"
text.fontSize = 16
text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]
text.textAutoResize = 'WIDTH_AND_HEIGHT'
text.x = maxX + 100
text.y = 0
return { nodeId: text.id }
```

## Create Frame with Auto-Layout

```js
let maxX = 0
for (const child of figma.currentPage.children) {
  maxX = Math.max(maxX, child.x + child.width)
}

const frame = figma.createFrame()
frame.name = "Card"
frame.layoutMode = 'VERTICAL'
frame.primaryAxisAlignItems = 'MIN'
frame.counterAxisAlignItems = 'MIN'
frame.paddingLeft = 16
frame.paddingRight = 16
frame.paddingTop = 12
frame.paddingBottom = 12
frame.itemSpacing = 8
frame.layoutSizingHorizontal = 'HUG'
frame.layoutSizingVertical = 'HUG'
frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]
frame.cornerRadius = 8
frame.x = maxX + 100
frame.y = 0
return { nodeId: frame.id }
```

## Component Set with Variable Modes

```js
await figma.loadFontAsync({ family: "Inter", style: "Medium" })

const colors = figma.variables.createVariableCollection("Component/Colors")
colors.renameMode(colors.modes[0].modeId, "primary")
const primaryMode = colors.modes[0].modeId
const secondaryMode = colors.addMode("secondary")

const bgVar = figma.variables.createVariable("bg", colors, "COLOR")
bgVar.setValueForMode(primaryMode, { r: 0, g: 0.4, b: 0.9, a: 1 })
bgVar.setValueForMode(secondaryMode, { r: 0, g: 0, b: 0, a: 0 })

const modeMap = { primary: primaryMode, secondary: secondaryMode }
const components = []

for (const [variantName, modeId] of Object.entries(modeMap)) {
  const comp = figma.createComponent()
  comp.name = "variant=" + variantName
  comp.layoutMode = "HORIZONTAL"
  comp.primaryAxisAlignItems = "CENTER"
  comp.counterAxisAlignItems = "CENTER"
  comp.paddingLeft = 12; comp.paddingRight = 12
  comp.layoutSizingHorizontal = "HUG"
  comp.layoutSizingVertical = "HUG"

  const bgPaint = figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", bgVar
  )
  comp.fills = [bgPaint]
  comp.setExplicitVariableModeForCollection(colors, modeId)
  components.push(comp)
}

const componentSet = figma.combineAsVariants(components, figma.currentPage)
componentSet.name = "Button"
return { componentSetId: componentSet.id }
```

## Read Existing Nodes and Return Data

```js
const page = figma.currentPage
const nodes = page.findAll(n => n.type === 'FRAME')
const data = nodes.map(n => ({
  id: n.id, name: n.name,
  width: n.width, height: n.height,
  childCount: n.children?.length || 0
}))
return { frames: data }
```

## Import a Component by Key (Team Libraries)

```js
const comp = await figma.importComponentByKeyAsync("COMPONENT_KEY")
const instance = comp.createInstance()
instance.x = 40; instance.y = 40
return { instanceId: instance.id }
```

## Large ComponentSet (Multi-Step Pattern)

For 50+ variants, split into multiple `use_figma` calls:
1. Call 1: Create variable collections, return IDs
2. Call 2: Create components using stored IDs, combine and layout

Always paste IDs from previous calls as literals in subsequent calls.
