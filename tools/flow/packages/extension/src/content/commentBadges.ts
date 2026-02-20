/**
 * Comment badges rendered in the inspected page via Shadow DOM.
 *
 * - Badges are anchored to the click point (offset from target element rect).
 * - Clicking a badge opens an in-DOM editor bubble to update the text.
 * - New comment/question bubbles can be opened from panel commands.
 */

import { isEditableElement } from './features/keyboardGuards';

const BADGE_HOST_ID = '__flow-comment-badges__';

interface CommentBadge {
  id: string;
  selector: string;
  index: number;
  type: 'comment' | 'question';
  content: string;
  componentName: string;
  coordinates?: { x: number; y: number };
  linkedSelectors?: string[];
}

interface StoredCommentBadge extends CommentBadge {
  offsetX: number;
  offsetY: number;
  anchorX: number;
  anchorY: number;
  linkedSelectors?: string[];
}

export interface CommentComposeDraft {
  id?: string;
  type: 'comment' | 'question';
  selector: string;
  componentName: string;
  x: number;
  y: number;
  content?: string;
  /** Additional selectors from multi-selection (excludes primary). */
  linkedSelectors?: string[];
}

interface CommentBadgeCallbacks {
  onCreate?: (payload: {
    id: string;
    type: 'comment' | 'question';
    selector: string;
    componentName: string;
    content: string;
    coordinates: { x: number; y: number };
    linkedSelectors?: string[];
  }) => void;
  onUpdate?: (payload: { id: string; content: string }) => void;
}

interface ComposerStateCreate extends CommentComposeDraft {
  mode: 'create';
}

interface ComposerStateEdit {
  mode: 'edit';
  id: string;
}

type ComposerState = ComposerStateCreate | ComposerStateEdit;

let shadowRoot: ShadowRoot | null = null;
const badgeMap = new Map<string, StoredCommentBadge>();
let callbacks: CommentBadgeCallbacks = {};
let composerState: ComposerState | null = null;
let pulseHideTimer: number | null = null;

function ensureShadowHost(): ShadowRoot {
  if (shadowRoot) return shadowRoot;

  const existing = document.getElementById(BADGE_HOST_ID);
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = BADGE_HOST_ID;
  host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483647;';
  document.documentElement.appendChild(host);
  shadowRoot = host.attachShadow({ mode: 'closed' });
  shadowRoot.addEventListener('keydown', (event) => {
    if (isEditableElement(event.target)) {
      event.stopPropagation();
    }
  });

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
    .comment-badge.linked {
      background: transparent;
      border: 2px solid;
      width: 20px;
      height: 20px;
      font-size: 10px;
    }
    .comment-badge.linked.type-comment {
      border-color: #eab308;
      color: #eab308;
    }
    .comment-badge.linked.type-question {
      border-color: #3b82f6;
      color: #3b82f6;
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
    .comment-composer {
      position: fixed;
      width: 260px;
      background: #171717;
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 8px;
      box-shadow: 0 10px 28px rgba(0,0,0,0.45);
      padding: 8px;
      display: none;
      pointer-events: auto;
      z-index: 2147483647;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .comment-composer.visible {
      display: block;
      animation: flow-composer-pop-in 180ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .comment-composer-header {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #e5e5e5;
    }
    .comment-composer-header.comment {
      color: #facc15;
    }
    .comment-composer-header.question {
      color: #60a5fa;
    }
    .comment-composer textarea {
      width: 100%;
      min-height: 72px;
      resize: vertical;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.12);
      background: #262626;
      color: #e5e5e5;
      font-size: 12px;
      padding: 8px;
      box-sizing: border-box;
      outline: none;
    }
    .comment-composer textarea:focus {
      border-color: rgba(96,165,250,0.8);
    }
    .comment-composer-actions {
      margin-top: 6px;
      display: flex;
      justify-content: flex-end;
      gap: 6px;
    }
    .comment-composer-actions button {
      border: none;
      border-radius: 6px;
      font-size: 11px;
      padding: 5px 9px;
      cursor: pointer;
    }
    .comment-composer-actions .cancel {
      background: #404040;
      color: #d4d4d4;
    }
    .comment-composer-actions .save {
      background: #2563eb;
      color: #fff;
    }
    .comment-anchor-pulse {
      position: fixed;
      width: 14px;
      height: 14px;
      border-radius: 999px;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 2147483647;
      opacity: 0;
    }
    .comment-anchor-pulse.comment {
      border: 2px solid rgba(234, 179, 8, 0.95);
      background: rgba(234, 179, 8, 0.22);
    }
    .comment-anchor-pulse.question {
      border: 2px solid rgba(96, 165, 250, 0.95);
      background: rgba(96, 165, 250, 0.22);
    }
    .comment-anchor-pulse.visible {
      animation: flow-anchor-pulse 420ms cubic-bezier(0.17, 0.84, 0.44, 1);
    }
    @keyframes flow-anchor-pulse {
      0% {
        opacity: 0.95;
        transform: translate(-50%, -50%) scale(0.45);
      }
      70% {
        opacity: 0.28;
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(2.35);
      }
    }
    @keyframes flow-composer-pop-in {
      0% {
        opacity: 0;
        transform: translateY(6px) scale(0.96);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;
  shadowRoot.appendChild(style);

  const tooltip = document.createElement('div');
  tooltip.className = 'comment-tooltip';
  tooltip.innerHTML = '<div class="tooltip-header"></div><div class="tooltip-content"></div>';
  shadowRoot.appendChild(tooltip);

  const composer = document.createElement('div');
  composer.className = 'comment-composer';
  composer.innerHTML = `
    <div class="comment-composer-header"></div>
    <textarea placeholder="Add feedback..."></textarea>
    <div class="comment-composer-actions">
      <button class="cancel" type="button">Cancel</button>
      <button class="save" type="button">Save</button>
    </div>
  `;
  shadowRoot.appendChild(composer);
  wireComposerEvents(composer);

  const anchorPulse = document.createElement('div');
  anchorPulse.className = 'comment-anchor-pulse';
  shadowRoot.appendChild(anchorPulse);

  return shadowRoot;
}

function getTooltip(): HTMLElement | null {
  return shadowRoot?.querySelector('.comment-tooltip') as HTMLElement | null;
}

function getComposer(): HTMLElement | null {
  return shadowRoot?.querySelector('.comment-composer') as HTMLElement | null;
}

function getComposerTextarea(): HTMLTextAreaElement | null {
  return shadowRoot?.querySelector('.comment-composer textarea') as HTMLTextAreaElement | null;
}

function getAnchorPulse(): HTMLElement | null {
  return shadowRoot?.querySelector('.comment-anchor-pulse') as HTMLElement | null;
}

function playAnchorPulse(x: number, y: number, type: 'comment' | 'question'): void {
  const pulse = getAnchorPulse();
  if (!pulse) return;

  pulse.className = `comment-anchor-pulse ${type}`;
  pulse.style.left = `${x}px`;
  pulse.style.top = `${y}px`;
  pulse.classList.remove('visible');
  // Force reflow so the animation restarts for repeated clicks.
  void pulse.offsetWidth;
  pulse.classList.add('visible');

  if (pulseHideTimer !== null) {
    window.clearTimeout(pulseHideTimer);
  }
  pulseHideTimer = window.setTimeout(() => {
    pulse.classList.remove('visible');
    pulseHideTimer = null;
  }, 440);
}

function showComposer(composer: HTMLElement): void {
  composer.classList.remove('visible');
  // Force reflow so opening animation always runs.
  void composer.offsetWidth;
  composer.classList.add('visible');
}

function wireComposerEvents(composer: HTMLElement): void {
  const cancel = composer.querySelector('.cancel') as HTMLButtonElement | null;
  const save = composer.querySelector('.save') as HTMLButtonElement | null;
  const textarea = composer.querySelector('textarea') as HTMLTextAreaElement | null;
  if (!cancel || !save || !textarea) return;

  cancel.addEventListener('click', (event) => {
    event.preventDefault();
    closeComposer();
  });

  save.addEventListener('click', (event) => {
    event.preventDefault();
    commitComposer();
  });

  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeComposer();
      return;
    }
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      commitComposer();
    }
  });
}

function positionComposerAt(x: number, y: number): void {
  const composer = getComposer();
  if (!composer) return;
  const width = 260;
  const height = 190;
  const margin = 8;
  const left = Math.max(margin, Math.min(x + 12, window.innerWidth - width - margin));
  const top = Math.max(margin, Math.min(y + 12, window.innerHeight - height - margin));
  composer.style.left = `${left}px`;
  composer.style.top = `${top}px`;
}

function openComposer(state: ComposerState, presetText = ''): void {
  ensureShadowHost();
  composerState = state;

  const composer = getComposer();
  const textarea = getComposerTextarea();
  if (!composer || !textarea) return;

  const header = composer.querySelector('.comment-composer-header') as HTMLElement | null;
  if (header) {
    if (state.mode === 'create') {
      const modeLabel = state.type === 'question' ? 'Question' : 'Comment';
      header.textContent = `${modeLabel} on ${state.componentName}`;
      header.className = `comment-composer-header ${state.type}`;
      playAnchorPulse(state.x, state.y, state.type);
      positionComposerAt(state.x, state.y);
    } else {
      const existing = badgeMap.get(state.id);
      const modeLabel = existing?.type === 'question' ? 'Question' : 'Comment';
      header.textContent = `${modeLabel} on ${existing?.componentName ?? 'element'}`;
      header.className = `comment-composer-header ${existing?.type ?? 'comment'}`;
      const position = existing ? resolveBadgePosition(existing) : { x: 80, y: 80 };
      positionComposerAt(position.x, position.y);
    }
  }

  textarea.value = presetText;
  showComposer(composer);
  textarea.focus();
  textarea.select();
}

function closeComposer(): void {
  const composer = getComposer();
  if (composer) composer.classList.remove('visible');
  composerState = null;
}

function resolveBadgePosition(badge: StoredCommentBadge): { x: number; y: number } {
  const el = document.querySelector(badge.selector);
  if (el) {
    const rect = el.getBoundingClientRect();
    badge.anchorX = rect.left + badge.offsetX;
    badge.anchorY = rect.top + badge.offsetY;
  }
  return { x: badge.anchorX, y: badge.anchorY };
}

function normalizeBadge(input: CommentBadge): StoredCommentBadge {
  const el = document.querySelector(input.selector);
  if (el) {
    const rect = el.getBoundingClientRect();
    const anchorX = input.coordinates?.x ?? rect.right;
    const anchorY = input.coordinates?.y ?? rect.top;
    return {
      ...input,
      offsetX: anchorX - rect.left,
      offsetY: anchorY - rect.top,
      anchorX,
      anchorY,
    };
  }
  return {
    ...input,
    offsetX: 0,
    offsetY: 0,
    anchorX: input.coordinates?.x ?? 0,
    anchorY: input.coordinates?.y ?? 0,
  };
}

function commitComposer(): void {
  if (!composerState) return;
  const textarea = getComposerTextarea();
  if (!textarea) return;
  const content = textarea.value.trim();
  if (!content) return;

  if (composerState.mode === 'create') {
    const id = composerState.id ?? crypto.randomUUID();
    const linked = composerState.linkedSelectors;
    addCommentBadge({
      id,
      selector: composerState.selector,
      index: 0,
      type: composerState.type,
      content,
      componentName: composerState.componentName,
      coordinates: { x: composerState.x, y: composerState.y },
      linkedSelectors: linked,
    });
    callbacks.onCreate?.({
      id,
      type: composerState.type,
      selector: composerState.selector,
      componentName: composerState.componentName,
      content,
      coordinates: { x: composerState.x, y: composerState.y },
      linkedSelectors: linked,
    });
  } else {
    updateCommentBadge(composerState.id, { content });
    callbacks.onUpdate?.({ id: composerState.id, content });
  }

  closeComposer();
}

function openComposerForEdit(id: string): void {
  const badge = badgeMap.get(id);
  if (!badge) return;
  openComposer({ mode: 'edit', id }, badge.content);
}

export function setCommentBadgeCallbacks(nextCallbacks: CommentBadgeCallbacks): void {
  callbacks = nextCallbacks;
}

export function openCommentComposer(draft: CommentComposeDraft): void {
  openComposer({ ...draft, mode: 'create' }, draft.content ?? '');
}

export function addCommentBadge(badge: CommentBadge): void {
  badgeMap.set(badge.id, normalizeBadge(badge));
  renderAllBadges();
}

export function removeCommentBadge(id: string): void {
  badgeMap.delete(id);
  renderAllBadges();
}

export function updateCommentBadge(id: string, updates: {
  content?: string;
  componentName?: string;
  type?: 'comment' | 'question';
}): void {
  const existing = badgeMap.get(id);
  if (!existing) return;
  badgeMap.set(id, { ...existing, ...updates });
  renderAllBadges();
}

export function clearCommentBadges(): void {
  badgeMap.clear();
  closeComposer();
  if (shadowRoot) {
    shadowRoot.querySelectorAll('.comment-badge').forEach((el) => el.remove());
  }
}

function renderAllBadges(): void {
  const root = ensureShadowHost();
  root.querySelectorAll('.comment-badge').forEach((el) => el.remove());

  let index = 0;
  for (const badge of badgeMap.values()) {
    const numberLabel = String(index + 1);

    const badgeEl = document.createElement('div');
    badgeEl.className = `comment-badge type-${badge.type}`;
    badgeEl.textContent = numberLabel;
    badgeEl.dataset.commentId = badge.id;
    const position = resolveBadgePosition(badge);
    badgeEl.style.left = `${position.x}px`;
    badgeEl.style.top = `${position.y}px`;

    badgeEl.addEventListener('mouseenter', () => {
      const tooltip = getTooltip();
      if (!tooltip) return;
      const header = tooltip.querySelector('.tooltip-header') as HTMLElement;
      const content = tooltip.querySelector('.tooltip-content') as HTMLElement;
      header.textContent = `${badge.type === 'question' ? 'Question' : 'Comment'} on ${badge.componentName}`;
      content.textContent = badge.content;
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

    badgeEl.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const tooltip = getTooltip();
      if (tooltip) tooltip.classList.remove('visible');
      openComposerForEdit(badge.id);
    });

    root.appendChild(badgeEl);

    // Render secondary (linked) badges on linked elements
    if (badge.linkedSelectors && badge.linkedSelectors.length > 0) {
      for (const linkedSelector of badge.linkedSelectors) {
        const linkedEl = document.querySelector(linkedSelector);
        if (!linkedEl) continue;
        const linkedRect = linkedEl.getBoundingClientRect();
        const linkedBadgeEl = document.createElement('div');
        linkedBadgeEl.className = `comment-badge linked type-${badge.type}`;
        linkedBadgeEl.textContent = numberLabel;
        linkedBadgeEl.dataset.commentId = badge.id;
        linkedBadgeEl.dataset.linkedSelector = linkedSelector;
        linkedBadgeEl.style.left = `${linkedRect.right}px`;
        linkedBadgeEl.style.top = `${linkedRect.top}px`;
        root.appendChild(linkedBadgeEl);
      }
    }

    index++;
  }
}

/** Call on scroll/resize to reposition badges */
export function repositionCommentBadges(): void {
  if (!shadowRoot) return;
  for (const badge of badgeMap.values()) {
    // Reposition primary badge
    const badgeEl = shadowRoot.querySelector(
      `.comment-badge:not(.linked)[data-comment-id="${CSS.escape(badge.id)}"]`
    ) as HTMLElement | null;
    if (badgeEl) {
      const position = resolveBadgePosition(badge);
      badgeEl.style.left = `${position.x}px`;
      badgeEl.style.top = `${position.y}px`;
    }

    // Reposition linked badges
    if (badge.linkedSelectors) {
      for (const linkedSelector of badge.linkedSelectors) {
        const linkedBadgeEl = shadowRoot.querySelector(
          `.comment-badge.linked[data-comment-id="${CSS.escape(badge.id)}"][data-linked-selector="${CSS.escape(linkedSelector)}"]`
        ) as HTMLElement | null;
        if (!linkedBadgeEl) continue;
        const linkedEl = document.querySelector(linkedSelector);
        if (!linkedEl) {
          linkedBadgeEl.style.display = 'none';
          continue;
        }
        const rect = linkedEl.getBoundingClientRect();
        linkedBadgeEl.style.left = `${rect.right}px`;
        linkedBadgeEl.style.top = `${rect.top}px`;
        linkedBadgeEl.style.display = '';
      }
    }
  }
}
