import type { TopLevelMode, DesignSubMode, ModeState } from '../modes/types';
import { DESIGN_SUB_MODES } from '../modes/types';
import toolbarStyles from './toolbar.css?inline';

/**
 * On-page toolbar for mode selection.
 *
 * Creates buttons matching TopLevelMode values from the mode system.
 * Click handlers are wired by connectToolbarToModeSystem() which maps
 * button clicks → modeController.setTopLevel().
 */

interface ToolbarMode {
  id: TopLevelMode;
  label: string;
  shortcut: string;
  icon: string;
}

const MODES: ToolbarMode[] = [
  {
    id: 'select',
    label: 'Select',
    shortcut: 'S',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>',
  },
  {
    id: 'design',
    label: 'Design',
    shortcut: 'D',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
  },
  {
    id: 'annotate',
    label: 'Annotate',
    shortcut: 'A',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  },
  {
    id: 'search',
    label: 'Search',
    shortcut: '/',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
  },
  {
    id: 'inspector',
    label: 'Inspector',
    shortcut: 'I',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  },
  {
    id: 'editText',
    label: 'Edit Text',
    shortcut: 'E',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
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
    buttons.set(mode.id, btn);
    bar.appendChild(btn);
  }

  shadow.appendChild(toolbarEl);

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
 * - Wires click handlers on toolbar buttons → modeController.setTopLevel()
 * - Creates a sub-mode popup above the design button (3x3 grid)
 * - Syncs active button state from mode controller
 * - Returns a cleanup function.
 */
export function connectToolbarToModeSystem(
  setTopLevel: (mode: TopLevelMode) => void,
  setDesignSubMode: (subMode: DesignSubMode) => void,
  subscribe: (listener: (state: ModeState) => void) => () => void,
): () => void {
  // Wire toolbar button clicks → mode controller
  for (const mode of MODES) {
    const btn = buttons.get(mode.id);
    if (btn) {
      btn.addEventListener('click', () => setTopLevel(mode.id));
    }
  }

  // ── Create sub-mode popup above Design button ──
  const designBtn = buttons.get('design');
  if (designBtn && !subModePopup) {
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

    designBtn.style.position = 'relative';
    designBtn.appendChild(subModePopup);
  }

  // Sync toolbar active state + sub-mode popup from mode controller
  const unsubscribe = subscribe((state) => {
    for (const [id, btn] of buttons) {
      const isActive = state.topLevel === id;
      btn.classList.toggle('active', isActive);
    }

    if (subModePopup) {
      subModePopup.toggleAttribute('data-visible', state.topLevel === 'design');
    }

    for (const [id, subBtn] of subModeButtons) {
      subBtn.classList.toggle('active', state.designSubMode === id);
    }
  });

  return unsubscribe;
}
