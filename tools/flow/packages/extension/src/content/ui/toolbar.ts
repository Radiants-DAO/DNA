import type { TopLevelMode, ModeState } from '../modes/types';
import toolbarStyles from './toolbar.css?inline';

/**
 * On-page toolbar for mode selection.
 *
 * FAB pattern: a 48px circular button always visible in the bottom-right corner,
 * which expands vertically into the full mode toolbar on click.
 *
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
    id: 'comment',
    label: 'Comment',
    shortcut: 'C',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
  },
  {
    id: 'question',
    label: 'Question',
    shortcut: 'Q',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
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
    shortcut: 'T',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
  },
  {
    id: 'asset',
    label: 'Assets',
    shortcut: 'A',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
  },
];

/** Flow pixel-art icon (16x16 grid, 4 colors) */
const FLOW_ICON_SVG = `<svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="2" width="2" height="2" fill="#3b82f6"/>
  <rect x="5" y="2" width="2" height="2" fill="#60a5fa"/>
  <rect x="7" y="2" width="2" height="2" fill="#3b82f6"/>
  <rect x="9" y="2" width="2" height="2" fill="#2563eb"/>
  <rect x="2" y="4" width="2" height="2" fill="#60a5fa"/>
  <rect x="4" y="4" width="2" height="2" fill="#93c5fd"/>
  <rect x="6" y="4" width="2" height="2" fill="#60a5fa"/>
  <rect x="8" y="4" width="2" height="2" fill="#3b82f6"/>
  <rect x="10" y="4" width="2" height="2" fill="#2563eb"/>
  <rect x="3" y="6" width="2" height="2" fill="#3b82f6"/>
  <rect x="5" y="6" width="4" height="2" fill="#60a5fa"/>
  <rect x="9" y="6" width="2" height="2" fill="#3b82f6"/>
  <rect x="4" y="8" width="2" height="2" fill="#2563eb"/>
  <rect x="6" y="8" width="2" height="2" fill="#3b82f6"/>
  <rect x="8" y="8" width="2" height="2" fill="#2563eb"/>
  <rect x="5" y="10" width="2" height="2" fill="#3b82f6"/>
  <rect x="7" y="10" width="2" height="2" fill="#60a5fa"/>
  <rect x="9" y="10" width="2" height="2" fill="#3b82f6"/>
  <rect x="6" y="12" width="2" height="2" fill="#2563eb"/>
  <rect x="8" y="12" width="2" height="2" fill="#3b82f6"/>
</svg>`;

/** Close X icon for expanded state */
const CLOSE_ICON_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

let toolbarEl: HTMLElement | null = null;
let barEl: HTMLElement | null = null;
let fabEl: HTMLButtonElement | null = null;
let fabBadgeEl: HTMLElement | null = null;
let buttons: Map<string, HTMLButtonElement> = new Map();
let expanded = false;

/** Callback set by content.ts to handle FAB clicks */
let onFabClick: (() => void) | null = null;

export function createToolbar(shadow: ShadowRoot): HTMLElement {
  if (toolbarEl) return toolbarEl;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = toolbarStyles;
  shadow.appendChild(style);

  toolbarEl = document.createElement('div');
  toolbarEl.className = 'flow-toolbar';
  toolbarEl.setAttribute('data-flow-toolbar', '');

  // Bar: vertical pill, starts collapsed
  barEl = document.createElement('div');
  barEl.className = 'flow-toolbar-bar collapsed';
  toolbarEl.appendChild(barEl);

  for (const mode of MODES) {
    const btn = document.createElement('button');
    btn.className = 'flow-toolbar-btn';
    btn.dataset.mode = mode.id;
    btn.innerHTML = mode.icon + `<span class="flow-toolbar-tooltip">${mode.label}<kbd>${mode.shortcut}</kbd></span>`;
    buttons.set(mode.id, btn);
    barEl.appendChild(btn);
  }

  // FAB: always visible circular button
  fabEl = document.createElement('button');
  fabEl.className = 'flow-toolbar-fab';
  fabEl.innerHTML = FLOW_ICON_SVG;

  fabBadgeEl = document.createElement('span');
  fabBadgeEl.className = 'flow-toolbar-fab-badge';
  fabEl.appendChild(fabBadgeEl);

  fabEl.addEventListener('click', (e) => {
    e.stopPropagation();
    if (onFabClick) {
      onFabClick();
    }
  });

  toolbarEl.appendChild(fabEl);

  shadow.appendChild(toolbarEl);

  return toolbarEl;
}

export function destroyToolbar(): void {
  toolbarEl?.remove();
  toolbarEl = null;
  barEl = null;
  fabEl = null;
  fabBadgeEl = null;
  buttons.clear();
  expanded = false;
  onFabClick = null;
}

export function expandToolbar(): void {
  if (!barEl || !fabEl) return;
  expanded = true;
  barEl.classList.remove('collapsed');
  fabEl.innerHTML = CLOSE_ICON_SVG;
  fabEl.appendChild(fabBadgeEl!);
}

export function collapseToolbar(): void {
  if (!barEl || !fabEl) return;
  expanded = false;
  barEl.classList.add('collapsed');
  fabEl.innerHTML = FLOW_ICON_SVG;
  fabEl.appendChild(fabBadgeEl!);
}

export function isToolbarExpanded(): boolean {
  return expanded;
}

export function setFabBadge(count: number): void {
  if (!fabBadgeEl) return;
  if (count > 0) {
    fabBadgeEl.textContent = count > 99 ? '99+' : String(count);
    fabBadgeEl.classList.add('visible');
  } else {
    fabBadgeEl.textContent = '';
    fabBadgeEl.classList.remove('visible');
  }
}

/** Register the FAB click handler (called from content.ts) */
export function setFabClickHandler(handler: () => void): void {
  onFabClick = handler;
}

/**
 * Connect the on-page toolbar to the mode controller.
 *
 * - Wires click handlers on toolbar buttons → modeController.setTopLevel()
 * - Syncs active button state from mode controller
 * - Returns a cleanup function.
 */
export function connectToolbarToModeSystem(
  setTopLevel: (mode: TopLevelMode) => void,
  subscribe: (listener: (state: ModeState) => void) => () => void,
): () => void {
  // Wire toolbar button clicks → mode controller
  for (const mode of MODES) {
    const btn = buttons.get(mode.id);
    if (btn) {
      btn.addEventListener('click', () => setTopLevel(mode.id));
    }
  }

  // Sync toolbar active state from mode controller
  const unsubscribe = subscribe((state) => {
    for (const [id, btn] of buttons) {
      const isActive = state.topLevel === id;
      btn.classList.toggle('active', isActive);
    }
  });

  return unsubscribe;
}
