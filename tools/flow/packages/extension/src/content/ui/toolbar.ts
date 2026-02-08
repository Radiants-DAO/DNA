import { subscribeOnPageState, dispatchToPanel } from './stateBridge';
import type { TopLevelMode, DesignSubMode, ModeState } from '../modes/types';
import { DESIGN_SUB_MODES } from '../modes/types';
import toolbarStyles from './toolbar.css?inline';

interface ToolbarMode {
  id: string;
  label: string;
  shortcut: string;
  icon: string; // SVG string
  editorMode: string;
  disabled?: boolean;
}

const MODES: ToolbarMode[] = [
  {
    id: 'smart-edit',
    label: 'Smart Edit',
    shortcut: 'E',
    editorMode: 'inspector',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  },
  {
    id: 'select-prompt',
    label: 'Select / Prompt',
    shortcut: 'V',
    editorMode: 'inspector',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>',
  },
  {
    id: 'text',
    label: 'Text Edit',
    shortcut: 'T',
    editorMode: 'designer',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
  },
  {
    id: 'comment',
    label: 'Comment',
    shortcut: 'C',
    editorMode: 'comment',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  },
  {
    id: 'question',
    label: 'Question',
    shortcut: 'Q',
    editorMode: 'comment',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  },
  {
    id: 'designer',
    label: 'Designer',
    shortcut: 'D',
    editorMode: 'designer',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
  },
  {
    id: 'animation',
    label: 'Animation',
    shortcut: 'A',
    editorMode: 'designer',
    disabled: true,
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  },
  {
    id: 'preview',
    label: 'Preview',
    shortcut: 'P',
    editorMode: 'cursor',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  },
];

let toolbarEl: HTMLElement | null = null;
let buttons: Map<string, HTMLButtonElement> = new Map();
let subModePopup: HTMLElement | null = null;
let subModeButtons: Map<string, HTMLButtonElement> = new Map();

export function createToolbar(shadow: ShadowRoot): HTMLElement {
  if (toolbarEl) return toolbarEl;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = toolbarStyles;
  shadow.appendChild(style);

  toolbarEl = document.createElement('div');
  toolbarEl.className = 'flow-toolbar';
  toolbarEl.setAttribute('data-flow-toolbar', '');
  toolbarEl.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);pointer-events:auto;z-index:2147483647;';

  const bar = document.createElement('div');
  bar.className = 'flow-toolbar-bar';
  toolbarEl.appendChild(bar);

  for (const mode of MODES) {
    const btn = document.createElement('button');
    btn.className = 'flow-toolbar-btn';
    btn.dataset.mode = mode.id;
    btn.innerHTML = mode.icon + `<span class="flow-toolbar-tooltip">${mode.label}<kbd>${mode.shortcut}</kbd></span>`;

    if (mode.disabled) {
      btn.classList.add('disabled');
      btn.title += ' — Coming soon';
    } else {
      btn.addEventListener('click', () => {
        dispatchToPanel({
          type: 'flow:set-editor-mode',
          payload: { mode: mode.editorMode, toolId: mode.id },
        });
      });
    }

    buttons.set(mode.id, btn);
    bar.appendChild(btn);
  }

  shadow.appendChild(toolbarEl);

  // Subscribe to state changes to update active button
  subscribeOnPageState((state) => {
    for (const [id, btn] of buttons) {
      const mode = MODES.find((m) => m.id === id);
      if (!mode) continue;
      const isActive = mode.editorMode === state.editorMode;
      btn.classList.toggle('active', isActive);
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Don't capture when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    const mode = MODES.find((m) => m.shortcut.toLowerCase() === e.key.toLowerCase());
    if (mode && !mode.disabled) {
      e.preventDefault();
      dispatchToPanel({
        type: 'flow:set-editor-mode',
        payload: { mode: mode.editorMode, toolId: mode.id },
      });
    }
  });

  return toolbarEl;
}

export function destroyToolbar(): void {
  toolbarEl?.remove();
  toolbarEl = null;
  buttons.clear();
  subModePopup = null;
  subModeButtons.clear();
}

/**
 * Connect the on-page toolbar to the mode controller.
 *
 * - Syncs active button state from mode controller
 * - Creates a sub-mode popup above the designer button (3x3 grid)
 * - Wires click handlers on toolbar buttons → mode controller
 * - Returns a cleanup function.
 */
export function connectToolbarToModeSystem(
  setTopLevel: (mode: TopLevelMode) => void,
  setDesignSubMode: (subMode: DesignSubMode) => void,
  subscribe: (listener: (state: ModeState) => void) => () => void,
): () => void {
  // Map new TopLevelMode → toolbar button id
  const modeToButton: Record<string, string> = {
    design: 'designer',
    annotate: 'comment',
    search: 'select-prompt',
    inspector: 'smart-edit',
    editText: 'text',
    select: 'select-prompt',
    default: '',
  };

  // Map toolbar button id → TopLevelMode (for click routing)
  const buttonToMode: Record<string, TopLevelMode> = {
    'designer': 'design',
    'smart-edit': 'inspector',
    'comment': 'annotate',
    'text': 'editText',
    'select-prompt': 'select',
  };

  // Wire toolbar button clicks → mode controller
  for (const [btnId, mode] of Object.entries(buttonToMode)) {
    const btn = buttons.get(btnId);
    if (btn) {
      btn.addEventListener('click', () => setTopLevel(mode));
    }
  }

  // ── Create sub-mode popup ──
  const designerBtn = buttons.get('designer');
  if (designerBtn && !subModePopup) {
    subModePopup = document.createElement('div');
    subModePopup.className = 'flow-submode-popup';

    for (const sub of DESIGN_SUB_MODES) {
      const subBtn = document.createElement('button');
      subBtn.className = 'flow-submode-btn';
      subBtn.dataset.submode = sub.id;
      subBtn.innerHTML = `<kbd>${sub.key}</kbd><span>${sub.label}</span>`;
      subBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setDesignSubMode(sub.id);
      });
      subModeButtons.set(sub.id, subBtn);
      subModePopup.appendChild(subBtn);
    }

    // Append popup inside the designer button so it positions relative to it
    designerBtn.style.position = 'relative';
    designerBtn.appendChild(subModePopup);
  }

  // Sync toolbar active state + sub-mode popup from mode controller
  const unsubscribe = subscribe((state) => {
    // Update toolbar button active states
    for (const [id, btn] of buttons) {
      const isActive = modeToButton[state.topLevel] === id;
      btn.classList.toggle('active', isActive);
    }

    // Show/hide sub-mode popup
    if (subModePopup) {
      subModePopup.toggleAttribute('data-visible', state.topLevel === 'design');
    }

    // Update active sub-mode button
    for (const [id, subBtn] of subModeButtons) {
      subBtn.classList.toggle('active', state.designSubMode === id);
    }
  });

  return unsubscribe;
}
