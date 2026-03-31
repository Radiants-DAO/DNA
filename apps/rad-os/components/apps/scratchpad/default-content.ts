/**
 * Default Scratchpad content — full spec of all capabilities.
 * Shown on first open when no localStorage content exists.
 */

// Helper to make block definitions less verbose
function h(level: 1 | 2 | 3, text: string) {
  return {
    type: 'heading' as const,
    props: { level, textColor: 'default' as const, backgroundColor: 'default' as const, textAlignment: 'left' as const },
    content: [{ type: 'text' as const, text, styles: {} }],
    children: [],
  };
}

function p(...segments: Array<string | { text: string; bold?: boolean; italic?: boolean; code?: boolean; underline?: boolean; strikethrough?: boolean }>) {
  return {
    type: 'paragraph' as const,
    props: { textColor: 'default' as const, backgroundColor: 'default' as const, textAlignment: 'left' as const },
    content: segments.map((s) =>
      typeof s === 'string'
        ? { type: 'text' as const, text: s, styles: {} }
        : { type: 'text' as const, text: s.text, styles: {
            ...(s.bold ? { bold: true } : {}),
            ...(s.italic ? { italic: true } : {}),
            ...(s.code ? { code: true } : {}),
            ...(s.underline ? { underline: true } : {}),
            ...(s.strikethrough ? { strikethrough: true } : {}),
          } as Record<string, boolean> },
    ),
    children: [],
  };
}

function li(text: string) {
  return {
    type: 'bulletListItem' as const,
    props: { textColor: 'default' as const, backgroundColor: 'default' as const, textAlignment: 'left' as const },
    content: [{ type: 'text' as const, text, styles: {} }],
    children: [],
  };
}

function nl(text: string) {
  return {
    type: 'numberedListItem' as const,
    props: { textColor: 'default' as const, backgroundColor: 'default' as const, textAlignment: 'left' as const },
    content: [{ type: 'text' as const, text, styles: {} }],
    children: [],
  };
}

function cl(text: string, checked = false) {
  return {
    type: 'checkListItem' as const,
    props: { checked, textColor: 'default' as const, backgroundColor: 'default' as const, textAlignment: 'left' as const },
    content: [{ type: 'text' as const, text, styles: {} }],
    children: [],
  };
}

function empty() {
  return {
    type: 'paragraph' as const,
    props: { textColor: 'default' as const, backgroundColor: 'default' as const, textAlignment: 'left' as const },
    content: [],
    children: [],
  };
}

function rdna(type: string, props: Record<string, unknown> = {}, text?: string) {
  const block: Record<string, unknown> = {
    type,
    props: { ...props },
    children: [],
  };
  if (text) {
    block.content = [{ type: 'text', text, styles: {} }];
  }
  return block;
}

// ============================================================================
// The default document
// ============================================================================

export const DEFAULT_CONTENT = [
  // ── Title ──
  h(1, 'Scratchpad'),
  p(
    'A block-based editor inside RadOS, powered by ',
    { text: 'BlockNote', bold: true },
    ' + ',
    { text: 'RDNA', bold: true },
    ' design system components. Type ',
    { text: '/', code: true },
    ' to open the command menu.',
  ),

  empty(),

  // ── Typography ──
  h(2, 'Typography'),
  h(1, 'Heading 1'),
  h(2, 'Heading 2'),
  h(3, 'Heading 3'),
  p(
    'Body text in ',
    { text: 'Mondwest', italic: true },
    '. Headings render in ',
    { text: 'Joystix', italic: true },
    '.',
  ),

  empty(),

  // ── Inline formatting ──
  h(2, 'Inline Formatting'),
  p(
    { text: 'Bold', bold: true },
    ', ',
    { text: 'italic', italic: true },
    ', ',
    { text: 'underline', underline: true },
    ', ',
    { text: 'strikethrough', strikethrough: true },
    ', and ',
    { text: 'inline code', code: true },
    '.',
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
  cl('Done task', true),
  cl('In progress'),
  cl('Todo'),

  empty(),

  // ── RDNA Feedback Components ──
  h(2, 'RDNA Feedback'),

  h(3, 'Alert'),
  rdna('alert', { variant: 'info' }, 'Info — helpful context or guidance.'),
  rdna('alert', { variant: 'success' }, 'Success — action completed.'),
  rdna('alert', { variant: 'warning' }, 'Warning — proceed with caution.'),
  rdna('alert', { variant: 'error' }, 'Error — something went wrong.'),

  h(3, 'Badge'),
  rdna('badge', { variant: 'default' }, 'Default'),
  rdna('badge', { variant: 'success' }, 'Success'),
  rdna('badge', { variant: 'warning' }, 'Warning'),
  rdna('badge', { variant: 'error' }, 'Error'),
  rdna('badge', { variant: 'info' }, 'Info'),

  h(3, 'Toast'),
  rdna('toast'),

  h(3, 'Tooltip'),
  rdna('tooltip'),

  empty(),

  // ── RDNA Layout Components ──
  h(2, 'RDNA Layout'),

  h(3, 'Card'),
  rdna('card', { variant: 'default' }, 'Default card — the primary content surface.'),
  rdna('card', { variant: 'inverted' }, 'Inverted card — dark surface.'),
  rdna('card', { variant: 'raised' }, 'Raised card — elevated with pixel shadow.'),

  h(3, 'Separator'),
  rdna('separator'),

  h(3, 'Collapsible'),
  rdna('collapsible', {}, 'Expandable content section — click the trigger to toggle.'),

  h(3, 'Tabs'),
  rdna('tabs'),

  h(3, 'Pattern'),
  rdna('pattern', {}, 'Content overlaid on a diagonal-dots pattern.'),

  h(3, 'ScrollArea'),
  rdna('scrollarea', {}, 'Scrollable container with custom styled scrollbars.'),

  h(3, 'AppWindow'),
  rdna('appwindow'),

  empty(),

  // ── RDNA Form Controls ──
  h(2, 'RDNA Form Controls'),

  h(3, 'Input & TextArea'),
  rdna('input'),
  p({ text: 'Text input field with RDNA styling.', italic: true }),

  h(3, 'Number Field'),
  rdna('numberfield'),

  h(3, 'Select'),
  rdna('select'),

  h(3, 'Combobox'),
  rdna('combobox'),

  h(3, 'Checkbox'),
  rdna('checkbox'),

  h(3, 'Switch'),
  rdna('switch'),

  h(3, 'Slider'),
  rdna('slider'),

  h(3, 'Toggle'),
  rdna('toggle'),

  h(3, 'Toggle Group'),
  rdna('togglegroup'),

  h(3, 'Input Set'),
  rdna('inputset'),

  empty(),

  // ── RDNA Action Components ──
  h(2, 'RDNA Actions'),

  h(3, 'Button'),
  rdna('button', { mode: 'filled', tone: 'primary' }, 'Primary Button'),
  rdna('button', { mode: 'outline', tone: 'default' }, 'Outline Button'),
  rdna('button', { mode: 'text', tone: 'default' }, 'Text Button'),

  h(3, 'Toolbar'),
  rdna('toolbar'),

  empty(),

  // ── RDNA Overlays ──
  h(2, 'RDNA Overlays'),
  p('Overlay components render as placeholders in the editor. In the live app, they produce modals, sheets, and popovers.'),

  h(3, 'Dialog'),
  rdna('dialog'),

  h(3, 'Alert Dialog'),
  rdna('alertdialog'),

  h(3, 'Sheet'),
  rdna('sheet'),

  h(3, 'Drawer'),
  rdna('drawer'),

  h(3, 'Popover'),
  rdna('popover'),

  h(3, 'Dropdown Menu'),
  rdna('dropdownmenu'),

  h(3, 'Context Menu'),
  rdna('contextmenu'),

  h(3, 'Preview Card'),
  rdna('previewcard'),

  empty(),

  // ── RDNA Navigation ──
  h(2, 'RDNA Navigation'),

  h(3, 'Breadcrumbs'),
  rdna('breadcrumbs'),

  h(3, 'Navigation Menu'),
  rdna('navigationmenu'),

  h(3, 'Menubar'),
  rdna('menubar'),

  empty(),

  // ── RDNA Data Display ──
  h(2, 'RDNA Data Display'),

  h(3, 'Meter'),
  rdna('meter'),

  h(3, 'Countdown Timer'),
  rdna('countdowntimer'),

  h(3, 'Avatar'),
  rdna('avatar'),

  h(3, 'Icon'),
  rdna('icon'),

  h(3, 'Spinner'),
  rdna('spinner'),

  empty(),

  // ── Closing ──
  h(2, 'Slash Commands'),
  p(
    'Type ',
    { text: '/', code: true },
    ' anywhere to insert any block type. Search by name, alias, or category. All 39 RDNA components are available alongside standard blocks.',
  ),

  empty(),
] as const;
