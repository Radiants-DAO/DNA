import type { Annotation } from '@flow/shared';
import { FLOW_MESSAGE_SOURCE } from '@flow/shared';
import { generateSelector } from './elementRegistry';
import { renderBadges, clearBadges, repositionBadges } from './annotationBadges';

let isActive = false;
let port: chrome.runtime.Port | null = null;
let currentBadges: { id: string; selector: string; index: number; text: string }[] = [];

function handleClick(e: MouseEvent) {
  if (!isActive) return;
  e.preventDefault();
  e.stopPropagation();

  const target = e.target as HTMLElement;
  const selector = generateSelector(target);

  // Request component identity from agent script
  window.postMessage(
    { source: FLOW_MESSAGE_SOURCE, type: 'flow:content:resolve-element', selector },
    window.location.origin,
  );

  // Notify panel that an element was clicked for annotation
  port?.postMessage({
    type: 'annotation-element-selected',
    payload: { selector, tagName: target.tagName.toLowerCase() },
  });
}

export function activateAnnotationMode(connectionPort: chrome.runtime.Port) {
  isActive = true;
  port = connectionPort;
  document.addEventListener('click', handleClick, true);
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
  document.body.style.cursor = 'crosshair';
}

export function deactivateAnnotationMode() {
  isActive = false;
  port = null;
  currentBadges = [];
  document.removeEventListener('click', handleClick, true);
  window.removeEventListener('scroll', onScrollOrResize);
  window.removeEventListener('resize', onScrollOrResize);
  document.body.style.cursor = '';
  clearBadges();
}

export function updateBadges(annotations: Annotation[]) {
  currentBadges = annotations.map((a, i) => ({
    id: a.id,
    selector: a.selector,
    index: i,
    text: a.text,
  }));
  renderBadges(currentBadges);
}

// Reposition on scroll/resize
let rafId: number | null = null;
function onScrollOrResize() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    repositionBadges(currentBadges);
  });
}
