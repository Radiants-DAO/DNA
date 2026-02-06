import { getOnPageState, subscribeOnPageState, dispatchToPanel } from './stateBridge';
import spotlightStyles from './spotlight.css?inline';

let spotlightEl: HTMLElement | null = null;
let isVisible = false;
let shadow: ShadowRoot | null = null;

export function initSpotlight(shadowRoot: ShadowRoot): void {
  shadow = shadowRoot;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = spotlightStyles;
  shadow.appendChild(style);

  // Cmd+K / Ctrl+K to toggle
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleSpotlight();
    }
    if (e.key === 'Escape' && isVisible) {
      e.preventDefault();
      hideSpotlight();
    }
  });
}

function toggleSpotlight(): void {
  if (isVisible) {
    hideSpotlight();
  } else {
    showSpotlight();
  }
}

function showSpotlight(): void {
  if (!shadow || isVisible) return;
  isVisible = true;

  spotlightEl = document.createElement('div');
  spotlightEl.className = 'flow-spotlight-overlay';
  spotlightEl.innerHTML = `
    <div class="flow-spotlight-backdrop"></div>
    <div class="flow-spotlight-panel">
      <div class="flow-spotlight-header">
        <span class="flow-spotlight-title">Prompt Builder</span>
        <kbd class="flow-spotlight-kbd">Esc</kbd>
      </div>
      <div class="flow-spotlight-body">
        <div class="flow-spotlight-steps" id="flow-spotlight-steps"></div>
        <button class="flow-spotlight-add" id="flow-spotlight-add">+ Add Step</button>
      </div>
      <div class="flow-spotlight-footer">
        <button class="flow-spotlight-copy" id="flow-spotlight-copy">Copy Prompt</button>
        <span class="flow-spotlight-hint">Cmd+K to toggle</span>
      </div>
    </div>
  `;

  // Backdrop closes spotlight
  spotlightEl.querySelector('.flow-spotlight-backdrop')?.addEventListener('click', hideSpotlight);

  // Add step button
  spotlightEl.querySelector('#flow-spotlight-add')?.addEventListener('click', () => {
    dispatchToPanel({ type: 'flow:add-prompt-step' });
  });

  // Copy button
  spotlightEl.querySelector('#flow-spotlight-copy')?.addEventListener('click', () => {
    dispatchToPanel({ type: 'flow:copy-prompt' });
  });

  shadow.appendChild(spotlightEl);
}

function hideSpotlight(): void {
  if (!isVisible) return;
  isVisible = false;
  spotlightEl?.remove();
  spotlightEl = null;
}

export function destroySpotlight(): void {
  hideSpotlight();
}
