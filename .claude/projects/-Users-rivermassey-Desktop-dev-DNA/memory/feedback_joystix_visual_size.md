---
name: Joystix appears bigger than actual size
description: Joystix Monospace has a large visual footprint relative to its pixel size due to monospace grid
type: feedback
---

Joystix Monospace appears visually "bigger" than its declared font size suggests, because its monospace character grid gives every glyph maximum width. A 16px Joystix heading looks larger than a 16px Mondwest heading.

**Why:** This matters when calibrating the typography scale — size comparisons between Joystix and Mondwest are not 1:1. A Joystix heading at 20px may have the visual impact of a Mondwest heading at 24px.

**How to apply:** When setting heading sizes or comparing font sizes across families, account for Joystix's oversized visual footprint. Don't assume equal px = equal visual weight.
