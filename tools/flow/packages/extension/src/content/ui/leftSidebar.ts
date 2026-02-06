import { subscribeOnPageState, dispatchToPanel } from './stateBridge';
import leftSidebarStyles from './leftSidebar.css?inline';

interface SidebarSection {
  id: string;
  label: string;
  shortcut: string;
  icon: string;
}

const SECTIONS: SidebarSection[] = [
  {
    id: 'layers',
    label: 'Layers',
    shortcut: '1',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  },
  {
    id: 'components',
    label: 'Components',
    shortcut: '2',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  },
  {
    id: 'assets',
    label: 'Assets',
    shortcut: '3',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  },
  {
    id: 'variables',
    label: 'Variables',
    shortcut: '4',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
  },
];

let sidebarEl: HTMLElement | null = null;
let panelEl: HTMLElement | null = null;
let activeSection: string | null = null;
let sectionButtons: Map<string, HTMLButtonElement> = new Map();

export function createLeftSidebar(shadow: ShadowRoot): HTMLElement {
  if (sidebarEl) return sidebarEl;

  const style = document.createElement('style');
  style.textContent = leftSidebarStyles;
  shadow.appendChild(style);

  sidebarEl = document.createElement('div');
  sidebarEl.className = 'flow-left-sidebar';

  const bar = document.createElement('div');
  bar.className = 'flow-left-bar';
  sidebarEl.appendChild(bar);

  for (const section of SECTIONS) {
    const btn = document.createElement('button');
    btn.className = 'flow-left-btn';
    btn.dataset.section = section.id;
    btn.innerHTML = section.icon + `<span class="flow-left-tooltip">${section.label}<kbd>${section.shortcut}</kbd></span>`;

    btn.addEventListener('click', () => {
      toggleSection(section.id, shadow);
    });

    sectionButtons.set(section.id, btn);
    bar.appendChild(btn);
  }

  shadow.appendChild(sidebarEl);

  // Keyboard shortcuts (1-4)
  document.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

    const section = SECTIONS.find((s) => s.shortcut === e.key);
    if (section) {
      e.preventDefault();
      toggleSection(section.id, shadow);
    }
  });

  return sidebarEl;
}

function toggleSection(sectionId: string, shadow: ShadowRoot): void {
  if (activeSection === sectionId) {
    closePanel(shadow);
  } else {
    openPanel(sectionId, shadow);
  }
}

function openPanel(sectionId: string, shadow: ShadowRoot): void {
  closePanel(shadow);
  activeSection = sectionId;

  const section = SECTIONS.find((s) => s.id === sectionId);
  if (!section) return;

  // Update button states
  for (const [id, btn] of sectionButtons) {
    btn.classList.toggle('active', id === sectionId);
  }

  // Request data from panel
  dispatchToPanel({ type: 'flow:request-section-data', payload: { section: sectionId } });

  panelEl = document.createElement('div');
  panelEl.className = 'flow-left-panel';
  panelEl.innerHTML = `
    <div class="flow-left-panel-header">
      <span class="flow-left-panel-title">${section.label}</span>
      <button class="flow-left-panel-close">&times;</button>
    </div>
    <div class="flow-left-panel-body" id="flow-left-panel-body">
      <div class="flow-left-panel-empty">Select an element to see ${section.label.toLowerCase()}</div>
    </div>
  `;

  panelEl.querySelector('.flow-left-panel-close')?.addEventListener('click', () => {
    closePanel(shadow);
  });

  shadow.appendChild(panelEl);
}

function closePanel(shadow: ShadowRoot): void {
  activeSection = null;
  panelEl?.remove();
  panelEl = null;
  for (const btn of sectionButtons.values()) {
    btn.classList.remove('active');
  }
}

export function destroyLeftSidebar(): void {
  sidebarEl?.remove();
  sidebarEl = null;
  panelEl?.remove();
  panelEl = null;
  activeSection = null;
  sectionButtons.clear();
}
