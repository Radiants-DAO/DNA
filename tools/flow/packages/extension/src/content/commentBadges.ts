/**
 * Comment badges rendered in the inspected page via Shadow DOM.
 *
 * Numbered badges appear on elements that have comments.
 * Hovering a badge shows a tooltip with the comment text.
 * Design inspired by agentation.dev badge patterns.
 */

const BADGE_HOST_ID = '__flow-comment-badges__';

interface CommentBadge {
  id: string;
  selector: string;
  index: number;
  type: 'comment' | 'question';
  content: string;
  componentName: string;
}

let shadowRoot: ShadowRoot | null = null;
const badgeMap = new Map<string, CommentBadge>();

function ensureShadowHost(): ShadowRoot {
  if (shadowRoot) return shadowRoot;

  const existing = document.getElementById(BADGE_HOST_ID);
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = BADGE_HOST_ID;
  host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483647;';
  document.documentElement.appendChild(host);
  shadowRoot = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    .comment-badge {
      position: fixed;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      color: white;
      font-size: 11px;
      font-weight: 700;
      font-family: system-ui, -apple-system, sans-serif;
      pointer-events: auto;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.1);
      transform: translate(-50%, -100%) translateY(-4px);
      transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
      z-index: 2147483647;
    }
    .comment-badge.type-comment {
      background: #eab308;
    }
    .comment-badge.type-question {
      background: #3b82f6;
    }
    .comment-badge:hover {
      transform: translate(-50%, -100%) translateY(-4px) scale(1.15);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.2);
    }
    .comment-tooltip {
      position: fixed;
      max-width: 240px;
      padding: 6px 10px;
      border-radius: 6px;
      background: #1c1c1e;
      border: 1px solid rgba(255,255,255,0.1);
      color: #e5e5e5;
      font-size: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.4;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease-out;
      z-index: 2147483647;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .comment-tooltip.visible {
      opacity: 1;
    }
    .comment-tooltip .tooltip-header {
      font-size: 10px;
      color: #999;
      margin-bottom: 2px;
    }
    .comment-tooltip .tooltip-content {
      white-space: pre-wrap;
      word-break: break-word;
    }
  `;
  shadowRoot.appendChild(style);

  // Create shared tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'comment-tooltip';
  tooltip.innerHTML = '<div class="tooltip-header"></div><div class="tooltip-content"></div>';
  shadowRoot.appendChild(tooltip);

  return shadowRoot;
}

function getTooltip(): HTMLElement | null {
  return shadowRoot?.querySelector('.comment-tooltip') as HTMLElement | null;
}

export function addCommentBadge(badge: CommentBadge): void {
  badgeMap.set(badge.id, badge);
  renderAllBadges();
}

export function removeCommentBadge(id: string): void {
  badgeMap.delete(id);
  renderAllBadges();
}

export function clearCommentBadges(): void {
  badgeMap.clear();
  if (shadowRoot) {
    shadowRoot.querySelectorAll('.comment-badge').forEach((el) => el.remove());
  }
}

function renderAllBadges(): void {
  const root = ensureShadowHost();

  // Remove existing badges (not tooltip)
  root.querySelectorAll('.comment-badge').forEach((el) => el.remove());

  let index = 0;
  for (const badge of badgeMap.values()) {
    const el = document.querySelector(badge.selector);
    if (!el) continue;

    const rect = el.getBoundingClientRect();
    const badgeEl = document.createElement('div');
    badgeEl.className = `comment-badge type-${badge.type}`;
    badgeEl.textContent = String(index + 1);
    badgeEl.style.left = `${rect.right}px`;
    badgeEl.style.top = `${rect.top}px`;
    badgeEl.dataset.commentId = badge.id;

    // Hover tooltip
    badgeEl.addEventListener('mouseenter', () => {
      const tooltip = getTooltip();
      if (!tooltip) return;
      const header = tooltip.querySelector('.tooltip-header') as HTMLElement;
      const content = tooltip.querySelector('.tooltip-content') as HTMLElement;
      header.textContent = `${badge.type === 'question' ? 'Question' : 'Comment'} on ${badge.componentName}`;
      content.textContent = badge.content;
      // Position tooltip above badge
      const badgeRect = badgeEl.getBoundingClientRect();
      tooltip.style.left = `${badgeRect.left}px`;
      tooltip.style.top = `${badgeRect.top - 8}px`;
      tooltip.style.transform = 'translateY(-100%)';
      tooltip.classList.add('visible');
    });

    badgeEl.addEventListener('mouseleave', () => {
      const tooltip = getTooltip();
      if (tooltip) tooltip.classList.remove('visible');
    });

    root.appendChild(badgeEl);
    index++;
  }
}

/** Call on scroll/resize to reposition badges */
export function repositionCommentBadges(): void {
  if (!shadowRoot) return;
  for (const badge of badgeMap.values()) {
    const el = document.querySelector(badge.selector);
    const badgeEl = shadowRoot.querySelector(`[data-comment-id="${CSS.escape(badge.id)}"]`) as HTMLElement;
    if (!el || !badgeEl) continue;
    const rect = el.getBoundingClientRect();
    badgeEl.style.left = `${rect.right}px`;
    badgeEl.style.top = `${rect.top}px`;
  }
}
