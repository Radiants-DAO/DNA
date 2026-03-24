# Variable & Token API Patterns

> Part of the [use_figma skill](../SKILL.md). How to correctly create, bind, scope, and alias variables using the Plugin API.

## Creating Variable Collections and Modes

```javascript
const collection = figma.variables.createVariableCollection("MyCollection");

// A new collection starts with 1 mode named "Mode 1" — always rename it
collection.renameMode(collection.modes[0].modeId, "Light");

// Add additional modes (returns the new modeId)
const darkModeId = collection.addMode("Dark");
const lightModeId = collection.modes[0].modeId;
```

**Mode limits are plan-dependent:** Free = 1 mode, Professional = up to 4, Organization/Enterprise = 40+.

## Creating Variables (All Types)

`figma.variables.createVariable(name, collection, resolvedType)` — the second argument accepts a collection object or ID string (object preferred).

```javascript
// COLOR — values use {r, g, b, a} (all 0–1 range, includes alpha)
const colorVar = figma.variables.createVariable("my-color", collection, "COLOR");
colorVar.setValueForMode(modeId, { r: 0.2, g: 0.36, b: 0.96, a: 1 });

// FLOAT — for spacing, radii, sizing, numeric values
const floatVar = figma.variables.createVariable("my-spacing", collection, "FLOAT");
floatVar.setValueForMode(modeId, 16);

// STRING — for font families, font style names, any text value
const stringVar = figma.variables.createVariable("my-font", collection, "STRING");
stringVar.setValueForMode(modeId, "Inter");

// BOOLEAN
const boolVar = figma.variables.createVariable("my-flag", collection, "BOOLEAN");
boolVar.setValueForMode(modeId, true);
```

**Note:** Paint colors use `{r, g, b}` (no alpha), but COLOR variable values use `{r, g, b, a}` (with alpha). Don't mix them up.

## Binding Variables to Node Properties

### Color Bindings (Fills, Strokes)

`setBoundVariableForPaint` returns a **NEW paint** — you must capture the return value:

```javascript
const basePaint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
const boundPaint = figma.variables.setBoundVariableForPaint(basePaint, "color", colorVar);
node.fills = [boundPaint];
```

### Numeric Bindings (Spacing, Radii, Sizing)

```javascript
// Padding
node.setBoundVariable("paddingTop", spacingVar);
node.setBoundVariable("paddingBottom", spacingVar);
node.setBoundVariable("paddingLeft", spacingVar);
node.setBoundVariable("paddingRight", spacingVar);

// Gap
node.setBoundVariable("itemSpacing", gapVar);

// Corner radius — use individual corners, NOT cornerRadius
node.setBoundVariable("topLeftRadius", radiusVar);
node.setBoundVariable("topRightRadius", radiusVar);
node.setBoundVariable("bottomLeftRadius", radiusVar);
node.setBoundVariable("bottomRightRadius", radiusVar);

// Size
node.setBoundVariable("width", sizeVar);
node.setBoundVariable("height", sizeVar);
node.setBoundVariable("minWidth", sizeVar);
node.setBoundVariable("maxWidth", sizeVar);

// Other
node.setBoundVariable("opacity", opacityVar);
node.setBoundVariable("strokeWeight", strokeVar);
```

**Not bindable via setBoundVariable:** `fontSize`, `fontWeight`, `lineHeight` — set these directly on text nodes.

### Applying a Mode to a Frame

```javascript
frame.setExplicitVariableModeForCollection(collection, modeId);
```

## Variable Scopes

`variable.scopes` controls which Figma property pickers show the variable. Default is `["ALL_SCOPES"]` — almost never what you want.

```javascript
variable.scopes = ["FRAME_FILL", "SHAPE_FILL"];  // only fill pickers
variable.scopes = ["TEXT_FILL"];                   // only text color picker
variable.scopes = ["GAP"];                         // only gap/spacing pickers
variable.scopes = ["CORNER_RADIUS"];               // only radius pickers
variable.scopes = [];                              // hidden from all pickers
```

**All valid scope values:**
`ALL_SCOPES`, `TEXT_CONTENT`, `CORNER_RADIUS`, `WIDTH_HEIGHT`, `GAP`, `ALL_FILLS`, `FRAME_FILL`, `SHAPE_FILL`, `TEXT_FILL`, `STROKE_COLOR`, `STROKE_FLOAT`, `EFFECT_FLOAT`, `EFFECT_COLOR`, `OPACITY`, `FONT_FAMILY`, `FONT_STYLE`, `FONT_WEIGHT`, `FONT_SIZE`, `LINE_HEIGHT`, `LETTER_SPACING`, `PARAGRAPH_SPACING`, `PARAGRAPH_INDENT`

## Variable Aliasing (VARIABLE_ALIAS)

A variable's value can reference another variable via alias:

```javascript
semanticVar.setValueForMode(modeId, {
  type: 'VARIABLE_ALIAS',
  id: primitiveVar.id
});
```

## Code Syntax (setVariableCodeSyntax)

Links a Figma variable back to its code counterpart:

```javascript
variable.setVariableCodeSyntax('WEB', 'var(--color-bg-default)');
variable.setVariableCodeSyntax('ANDROID', 'colorBgDefault');
variable.setVariableCodeSyntax('iOS', 'Color.bgDefault');
```

**When deriving CSS names from Figma names**, replace both slashes AND spaces with hyphens:

```javascript
// CORRECT — replace all whitespace and slashes
`var(--${figmaName.replace(/[\s\/]+/g, '-').toLowerCase()})`

// BEST — use the original CSS variable name from the source
`var(${token.cssVar})`
```

## Importing Library Variables

```javascript
const colorVar = await figma.variables.importVariableByKeyAsync("VARIABLE_KEY");
```

## Discovering Existing Variables

**Always inspect the file's existing variables before creating new ones.**

### List collections with mode info

```javascript
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const results = collections.map(c => ({
  name: c.name, id: c.id,
  varCount: c.variableIds.length,
  modes: c.modes.map(m => ({ name: m.name, id: m.modeId }))
}));
return results;
```

### Build a name→variable lookup for reuse

```javascript
const varByName = {};
for (const v of await figma.variables.getLocalVariablesAsync()) {
  varByName[v.name] = v;
}
```

### List collections with full variable details

```javascript
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const results = [];
for (const collection of collections) {
  const vars = [];
  for (const id of collection.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    vars.push([v.name, v.id, v.codeSyntax, v.scopes]);
  }
  results.push({
    name: collection.name,
    id: collection.id,
    modes: collection.modes.map(m => [m.name, m.modeId]),
    variables: vars
  });
}
return results;
```

## Effect Styles (For Shadows)

Shadows can't be stored as variables. Use effect styles:

```javascript
const shadow = figma.createEffectStyle();
shadow.name = "Shadow/Subtle";
shadow.effects = [{
  type: "DROP_SHADOW",
  color: { r: 0, g: 0, b: 0, a: 0.06 },
  offset: { x: 0, y: 2 },
  radius: 8,
  spread: 0,
  visible: true,
  blendMode: "NORMAL"
}];

// Apply to a node
frame.effectStyleId = shadow.id;
```
