const BADGE_HOST_ID = '__flow-annotation-badges__';

interface BadgeData {
  id: string;
  selector: string;
  index: number;
  text: string;
}

let shadowRoot: ShadowRoot | null = null;

function ensureShadowHost(): ShadowRoot {
  if (shadowRoot) return shadowRoot;

  // Remove stale host from previous injection (e.g. extension update, HMR)
  const existing = document.getElementById(BADGE_HOST_ID);
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = BADGE_HOST_ID;
  host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483647;';
  document.documentElement.appendChild(host);
  shadowRoot = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    .flow-badge {
      position: fixed;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #3b82f6;
      color: white;
      font-size: 11px;
      font-weight: 700;
      font-family: system-ui, sans-serif;
      pointer-events: auto;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transform: translate(-50%, -100%);
      transition: transform 0.15s ease-out;
      z-index: 2147483647;
    }
    .flow-badge:hover {
      transform: translate(-50%, -100%) scale(1.2);
    }
  `;
  shadowRoot.appendChild(style);
  return shadowRoot;
}

export function renderBadges(badges: BadgeData[]): void {
  const root = ensureShadowHost();

  // Remove existing badges
  root.querySelectorAll('.flow-badge').forEach((el) => el.remove());

  for (const badge of badges) {
    const el = document.querySelector(badge.selector);
    if (!el) continue;

    const rect = el.getBoundingClientRect();
    const badgeEl = document.createElement('div');
    badgeEl.className = 'flow-badge';
    badgeEl.textContent = String(badge.index + 1);
    badgeEl.title = badge.text;
    badgeEl.style.left = `${rect.right}px`;
    badgeEl.style.top = `${rect.top}px`;
    badgeEl.dataset.annotationId = badge.id;

    root.appendChild(badgeEl);
  }
}

export function clearBadges(): void {
  if (shadowRoot) {
    shadowRoot.querySelectorAll('.flow-badge').forEach((el) => el.remove());
  }
}

/** Call on scroll/resize to reposition badges */
export function repositionBadges(badges: BadgeData[]): void {
  if (!shadowRoot) return;
  for (const badge of badges) {
    const el = document.querySelector(badge.selector);
    const badgeEl = shadowRoot.querySelector(`[data-annotation-id="${CSS.escape(badge.id)}"]`) as HTMLElement;
    if (!el || !badgeEl) continue;
    const rect = el.getBoundingClientRect();
    badgeEl.style.left = `${rect.right}px`;
    badgeEl.style.top = `${rect.top}px`;
  }
}
