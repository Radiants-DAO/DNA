/**
 * Default Scratchpad content — full spec of all capabilities.
 * Shown on first open when no localStorage content exists.
 *
 * Uses only standard BlockNote block types for initialContent reliability.
 * RDNA blocks are available via the / slash menu — the spec page documents
 * them as text descriptions so users know what to try.
 */

// Helpers
function h(level: 1 | 2 | 3, text: string) {
  return {
    type: 'heading' as const,
    props: { level },
    content: [{ type: 'text' as const, text, styles: {} }],
    children: [],
  };
}

function p(...segments: Array<string | { text: string; bold?: boolean; italic?: boolean; code?: boolean; underline?: boolean; strikethrough?: boolean }>) {
  return {
    type: 'paragraph' as const,
    content: segments.map((s) =>
      typeof s === 'string'
        ? { type: 'text' as const, text: s, styles: {} }
        : {
            type: 'text' as const,
            text: s.text,
            styles: Object.fromEntries(
              Object.entries({
                bold: s.bold,
                italic: s.italic,
                code: s.code,
                underline: s.underline,
                strikethrough: s.strikethrough,
              }).filter(([, v]) => v),
            ),
          },
    ),
    children: [],
  };
}

function li(text: string) {
  return {
    type: 'bulletListItem' as const,
    content: [{ type: 'text' as const, text, styles: {} }],
    children: [],
  };
}

function nl(text: string) {
  return {
    type: 'numberedListItem' as const,
    content: [{ type: 'text' as const, text, styles: {} }],
    children: [],
  };
}

function cl(text: string, checked = false) {
  return {
    type: 'checkListItem' as const,
    props: { checked },
    content: [{ type: 'text' as const, text, styles: {} }],
    children: [],
  };
}

function empty() {
  return { type: 'paragraph' as const, children: [] };
}

// ============================================================================
// The default document — standard blocks only (RDNA blocks via / menu)
// ============================================================================

export const DEFAULT_CONTENT = [
  h(1, 'Scratchpad'),
  p(
    'A block-based editor inside RadOS, powered by ',
    { text: 'BlockNote', bold: true },
    ' and the ',
    { text: 'RDNA', bold: true },
    ' design system. Type ',
    { text: '/', code: true },
    ' anywhere to open the command menu.',
  ),

  empty(),

  // ── Typography ──
  h(2, 'Typography'),
  h(1, 'Heading 1 — Joystix'),
  h(2, 'Heading 2 — Joystix'),
  h(3, 'Heading 3 — Joystix'),
  p('Body text renders in Mondwest. The type scale is fluid — resize the window to see it adapt.'),

  empty(),

  // ── Inline formatting ──
  h(2, 'Inline Formatting'),
  p(
    { text: 'Bold', bold: true },
    '  ·  ',
    { text: 'Italic', italic: true },
    '  ·  ',
    { text: 'Underline', underline: true },
    '  ·  ',
    { text: 'Strikethrough', strikethrough: true },
    '  ·  ',
    { text: 'Inline code', code: true },
  ),

  empty(),

  // ── Lists ──
  h(2, 'Lists'),

  h(3, 'Bullet List'),
  li('First item'),
  li('Second item'),
  li('Third item'),

  h(3, 'Numbered List'),
  nl('Step one'),
  nl('Step two'),
  nl('Step three'),

  h(3, 'Check List'),
  cl('Completed task', true),
  cl('In progress'),
  cl('Todo'),

  empty(),

  // ── RDNA Components ──
  h(2, 'RDNA Components'),
  p(
    'All 39 RDNA design system components are available as blocks. Type ',
    { text: '/', code: true },
    ' and search by name or category.',
  ),

  empty(),

  h(3, 'Feedback'),
  p('Type ', { text: '/Alert', code: true }, ' — contextual messages (info, success, warning, error)'),
  p('Type ', { text: '/Badge', code: true }, ' — status indicator labels'),
  p('Type ', { text: '/Toast', code: true }, ' — ephemeral notifications'),

  h(3, 'Layout'),
  p('Type ', { text: '/Card', code: true }, ' — content surface with pixel-corner bevels (default, inverted, raised)'),
  p('Type ', { text: '/Collapsible', code: true }, ' — expandable content section'),
  p('Type ', { text: '/Tabs', code: true }, ' — tabbed navigation'),
  p('Type ', { text: '/Separator', code: true }, ' — visual divider'),
  p('Type ', { text: '/Pattern', code: true }, ' — decorative background pattern'),

  h(3, 'Form Controls'),
  p('Type ', { text: '/Input', code: true }, ', ', { text: '/Select', code: true }, ', ', { text: '/Checkbox', code: true }, ', ', { text: '/Switch', code: true }, ', ', { text: '/Slider', code: true }, ', ', { text: '/Toggle', code: true }),

  h(3, 'Actions'),
  p('Type ', { text: '/Button', code: true }, ' — primary, outline, and text modes'),
  p('Type ', { text: '/Toolbar', code: true }, ' — action bar with grouped buttons'),

  h(3, 'Navigation'),
  p('Type ', { text: '/Breadcrumbs', code: true }, ', ', { text: '/NavigationMenu', code: true }, ', ', { text: '/Menubar', code: true }),

  h(3, 'Overlays'),
  p('Type ', { text: '/Dialog', code: true }, ', ', { text: '/Sheet', code: true }, ', ', { text: '/Drawer', code: true }, ', ', { text: '/Popover', code: true }, ', ', { text: '/DropdownMenu', code: true }),

  h(3, 'Data Display'),
  p('Type ', { text: '/CountdownTimer', code: true }, ', ', { text: '/Meter', code: true }, ', ', { text: '/Spinner', code: true }, ', ', { text: '/Avatar', code: true }, ', ', { text: '/Icon', code: true }),

  empty(),

  // ── Slash Commands ──
  h(2, 'Getting Started'),
  p('Try it: click anywhere in this document, type ', { text: '/', code: true }, ', and pick a component. Drag blocks to reorder. Select text for formatting options.'),
  p('Use the ', { text: 'Documents', bold: true }, ' menu to create new documents, rename, or switch between them.'),

  empty(),
];
