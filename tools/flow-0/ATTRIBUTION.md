# Attribution

This project includes code derived from and inspired by open source projects. We gratefully acknowledge these contributions.

## Webstudio

**Repository**: https://github.com/webstudio-is/webstudio
**License**: AGPL-3.0-or-later
**Copyright**: Webstudio, Inc.

RadFlow adopts several architectural patterns and code structures from Webstudio's visual builder, adapting them for design system management with clipboard-first workflows.

### Directly Derived Code

The following files contain code ported from Webstudio's css-engine package:

| RadFlow File | Original Webstudio Source | Modifications |
|--------------|---------------------------|---------------|
| `src/types/styleValue.ts` | `packages/css-engine/src/schema.ts` | Extended with ColorValue supporting multiple color spaces (oklch, oklab, lab, lch); added ShadowValue type; adapted for RadFlow's DNA token philosophy |
| `src/utils/styleValueToCss.ts` | `packages/css-engine/src/core/to-value.ts` | Added support for modern color spaces; integrated with Culori for color conversion |
| `src/utils/parseStyleValue.ts` | N/A (original implementation) | TypeScript parser based on Webstudio's type patterns (ADR-6) |

### Architecture Patterns Adopted

The following patterns and architectural decisions were inspired by Webstudio:

1. **StyleValue Discriminated Union** - Type-safe CSS value representation using Zod schemas with discriminated unions (unit, keyword, color, var, layers, tuple, shadow, function, etc.)

2. **Dual-Mode Output Interface** - Abstraction supporting both clipboard and file write targets, inspired by Webstudio's persistence patterns but adapted for RadFlow's clipboard-first design

3. **Style Panel Organization** - Section-based style panel layout with context-aware sections (FlexChild/GridChild visible only when parent has relevant display type)

4. **Layered Value Editors** - Shadow and gradient editor UI patterns for manipulating comma-separated CSS values with layer add/remove/reorder controls

5. **Canvas Interaction Patterns** - Selection overlays, hover detection with debounce, and event interception patterns (planned for future implementation)

### Files Inspired by Webstudio Patterns

These files implement original code following patterns established by Webstudio:

| RadFlow File | Webstudio Influence |
|--------------|---------------------|
| `src/utils/colorConversions.ts` | Color space support inspired by Webstudio's color handling; uses Culori library |
| `src/utils/tokenResolver.ts` | Token chain resolution with cycle detection; algorithm pattern from Webstudio's variable resolution |
| `src/utils/layersValue.ts` | Layer manipulation utilities for comma-separated CSS values |
| `src/types/output.ts` | Dual-mode output interface design |
| `src/components/designer/ShadowEditor.tsx` | Layered shadow editor UI |
| `src/components/designer/GradientEditor.tsx` | Gradient editor UI with color stops |
| `src/components/designer/sections/*.tsx` | Style panel section organization |

## Culori

**Repository**: https://github.com/Evercoder/culori
**License**: MIT
**Copyright**: Evercoder

RadFlow uses Culori for color space conversions between sRGB, OKLCH, OKLAB, LAB, LCH, HSL, and other color spaces. Culori provides mathematically accurate color transformations and gamut mapping.

Used in:
- `src/utils/colorConversions.ts`

## License Notice

RadFlow is licensed under AGPL-3.0-or-later due to its adoption of Webstudio-derived code.

### AGPL-3.0 Network Copyleft

The AGPL-3.0 license includes network copyleft requirements:

- **Desktop application**: For desktop-only use (Tauri), standard AGPL distribution requirements apply. Source code must be made available when distributing the application.

- **Web service**: If RadFlow ever operates as a network-accessible service, users interacting with the service must have access to the complete corresponding source code.

For questions about licensing, please refer to:
- [GNU AGPL-3.0 Full Text](https://www.gnu.org/licenses/agpl-3.0.html)
- Webstudio licensing: https://github.com/webstudio-is/webstudio/blob/main/LICENSE
