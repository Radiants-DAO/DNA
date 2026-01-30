import type { BridgeComment, RadflowId } from './types.js';
import { findElementById } from './dom-annotator.js';

const CONTAINER_ID = '__radflow-comment-container';
const badgeElements = new Map<string, HTMLElement>();
let container: HTMLElement | null = null;
let activeComments: BridgeComment[] = [];
let repositionRaf: number | null = null;
let watcherActive = false;

function ensureContainer(): HTMLElement {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.id = CONTAINER_ID;
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:999998;';
  document.body.appendChild(container);
  return container;
}

function findElement(comment: BridgeComment): HTMLElement | null {
  // Prefer radflowId (stable across renders)
  if (comment.radflowId) {
    const el = findElementById(comment.radflowId);
    if (el) return el;
  }
  // Fallback to CSS selector
  if (comment.selector) {
    try {
      return document.querySelector<HTMLElement>(comment.selector);
    } catch {
      // Invalid selector — skip
    }
  }
  return null;
}

function positionBadge(badge: HTMLElement, comment: BridgeComment): void {
  const el = findElement(comment);
  if (!el) {
    badge.style.display = 'none';
    return;
  }
  const rect = el.getBoundingClientRect();
  badge.style.display = 'flex';
  badge.style.top = `${rect.top - 8}px`;
  badge.style.left = `${rect.right - 8}px`;
}

function createBadge(comment: BridgeComment): HTMLElement {
  const isQ = comment.type === 'question';
  const color = isQ ? '#FCC383' : '#95BAD2';

  const badge = document.createElement('div');
  badge.dataset.commentId = comment.id;
  badge.style.cssText = `
    position:fixed;pointer-events:auto;width:24px;height:24px;border-radius:50%;
    background:${color};color:#0F0E0C;font-size:12px;font-weight:700;font-family:monospace;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:default;
    transition:transform 0.15s ease-out;z-index:999999;
  `;
  badge.textContent = isQ ? '?' : String(comment.index);

  // Tooltip on hover
  const tip = document.createElement('div');
  tip.style.cssText = `
    position:absolute;left:32px;top:-4px;background:#1a1a1a;color:#e5e5e5;
    padding:6px 10px;border-radius:6px;font-size:11px;font-family:monospace;
    white-space:nowrap;opacity:0;pointer-events:none;transition:opacity 0.15s ease-out;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);max-width:280px;overflow:hidden;text-overflow:ellipsis;
  `;
  tip.textContent = `#${comment.index} ${comment.componentName}: ${comment.content}`;
  badge.appendChild(tip);

  badge.addEventListener('mouseenter', () => {
    tip.style.opacity = '1';
    badge.style.transform = 'scale(1.15)';
  });
  badge.addEventListener('mouseleave', () => {
    tip.style.opacity = '0';
    badge.style.transform = 'scale(1)';
  });

  return badge;
}

function repositionAll(): void {
  for (const comment of activeComments) {
    const badge = badgeElements.get(comment.id);
    if (badge) positionBadge(badge, comment);
  }
}

function onScrollOrResize(): void {
  if (repositionRaf !== null) cancelAnimationFrame(repositionRaf);
  repositionRaf = requestAnimationFrame(repositionAll);
}

function startWatcher(): void {
  if (watcherActive) return;
  watcherActive = true;
  window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
}

function stopWatcher(): void {
  if (!watcherActive) return;
  watcherActive = false;
  window.removeEventListener('scroll', onScrollOrResize, true);
  window.removeEventListener('resize', onScrollOrResize);
  if (repositionRaf !== null) {
    cancelAnimationFrame(repositionRaf);
    repositionRaf = null;
  }
}

export function addComment(comment: BridgeComment): void {
  const parent = ensureContainer();
  removeComment(comment.id); // Deduplicate

  const badge = createBadge(comment);
  positionBadge(badge, comment);
  parent.appendChild(badge);
  badgeElements.set(comment.id, badge);

  activeComments = activeComments.filter(c => c.id !== comment.id);
  activeComments.push(comment);
  startWatcher();
}

export function removeComment(commentId: string): void {
  const badge = badgeElements.get(commentId);
  if (badge) {
    badge.remove();
    badgeElements.delete(commentId);
  }
  activeComments = activeComments.filter(c => c.id !== commentId);
  if (activeComments.length === 0) stopWatcher();
}

export function clearComments(): void {
  for (const b of badgeElements.values()) b.remove();
  badgeElements.clear();
  activeComments = [];
  stopWatcher();
}
