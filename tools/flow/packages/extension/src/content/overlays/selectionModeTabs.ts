import type { DesignSubMode, ModeState } from '../modes/types';
import { DESIGN_SUB_MODES } from '../modes/types';

const STYLE_ID = '__flow-selection-mode-tabs-style__';

let tabBar: HTMLDivElement | null = null;
let tabButtons: Map<string, HTMLButtonElement> = new Map();
let unsubscribe: (() => void) | null = null;

const TAB_STYLES = `
  .flow-mode-tabs {
    position: absolute;
    bottom: calc(100% + 4px);
    left: 0;
    display: flex;
    align-items: center;
    gap: 1px;
    background: var(--flow-panel-bg, rgba(23, 23, 23, 0.95));
    backdrop-filter: blur(12px);
    border: 1px solid var(--flow-input-border, rgba(63, 63, 70, 0.5));
    border-radius: 8px;
    padding: 2px;
    box-shadow: var(--flow-panel-shadow, 0 8px 32px rgba(0, 0, 0, 0.4));
    pointer-events: auto;
    z-index: 1;
  }

  .flow-mode-tab {
    all: unset;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 22px;
    border-radius: 5px;
    color: var(--flow-text-muted, #71717a);
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.12s ease-out;
    pointer-events: auto;
  }

  .flow-mode-tab:hover {
    color: var(--flow-text-primary, #e4e4e7);
    background: var(--flow-input-bg, rgba(63, 63, 70, 0.5));
  }

  .flow-mode-tab.active {
    color: #ffffff;
    background: var(--flow-accent, #2563eb);
  }

  .flow-mode-tab-tooltip {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 10px;
    font-weight: 500;
    color: var(--flow-text-primary, #e4e4e7);
    background: var(--flow-panel-bg, rgba(23, 23, 23, 0.95));
    border: 1px solid var(--flow-input-border, rgba(63, 63, 70, 0.5));
    border-radius: 4px;
    padding: 2px 6px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.12s ease-out;
  }

  .flow-mode-tab:hover .flow-mode-tab-tooltip {
    opacity: 1;
  }
`;

export function injectModeTabStyles(shadow: ShadowRoot | DocumentFragment): void {
  const root = shadow instanceof ShadowRoot ? shadow : shadow.getRootNode() as ShadowRoot;
  if (root.getElementById?.(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = TAB_STYLES;
  if (root instanceof ShadowRoot) {
    root.appendChild(style);
  } else {
    (shadow as DocumentFragment).appendChild(style);
  }
}

export function createModeTabs(): HTMLDivElement {
  if (tabBar) return tabBar;

  tabBar = document.createElement('div');
  tabBar.className = 'flow-mode-tabs';

  for (const sub of DESIGN_SUB_MODES) {
    const btn = document.createElement('button');
    btn.className = 'flow-mode-tab';
    btn.dataset.submode = sub.id;
    btn.innerHTML = `${sub.key}<span class="flow-mode-tab-tooltip">${sub.label}</span>`;
    tabButtons.set(sub.id, btn);
    tabBar.appendChild(btn);
  }

  return tabBar;
}

export function attachModeTabs(outline: HTMLDivElement): void {
  const bar = createModeTabs();
  // Move the tab bar to this outline (detaches from previous if any)
  outline.appendChild(bar);
}

export function connectModeTabs(
  subscribe: (listener: (state: ModeState) => void) => () => void,
  setDesignSubMode: (subMode: DesignSubMode) => void,
): () => void {
  // Wire click handlers
  for (const sub of DESIGN_SUB_MODES) {
    const btn = tabButtons.get(sub.id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setDesignSubMode(sub.id);
      });
    }
  }

  // Subscribe to state for active tab sync + visibility
  unsubscribe = subscribe((state) => {
    const visible = state.topLevel === 'design';
    if (tabBar) {
      tabBar.style.display = visible ? '' : 'none';
    }

    for (const [id, btn] of tabButtons) {
      btn.classList.toggle('active', state.designSubMode === id);
    }
  });

  return () => {
    unsubscribe?.();
    unsubscribe = null;
  };
}

export function showModeTabs(): void {
  if (tabBar) tabBar.style.display = '';
}

export function hideModeTabs(): void {
  if (tabBar) tabBar.style.display = 'none';
}

export function destroyModeTabs(): void {
  unsubscribe?.();
  unsubscribe = null;
  tabBar?.remove();
  tabBar = null;
  tabButtons.clear();
}
