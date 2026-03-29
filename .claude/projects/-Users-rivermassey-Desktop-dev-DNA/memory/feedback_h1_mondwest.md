---
name: H1 headings should use Mondwest
description: User direction that h1 elements should use Mondwest (font-sans), not Joystix (font-heading)
type: feedback
---

H1 headings should use Mondwest (font-sans), not Joystix Monospace (font-heading).

**Why:** Joystix is monospaced and appears visually "bigger" than its actual pixel size due to uniform character widths and chunky pixel grid. For display-level headings (h1), Mondwest Bold provides better readability and a more natural typographic hierarchy. Joystix is better suited for smaller UI headings (h3-h6) and labels.

**How to apply:** When editing typography.css or any heading styles, h1 (and likely h2) should use `font-sans` (Mondwest). Joystix stays for smaller headings and UI chrome.
