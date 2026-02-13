import { createElement } from 'react';
import type { ContentInspectionResult, ElementSelectedMessage, PromptChip } from '@flow/shared';
import {
  getOnPageState,
  subscribeOnPageState,
  dispatchToPanel,
  type OnPageState,
} from './stateBridge';
import paletteStyles from './commandPalette/promptPalette.css?inline';
import { PromptPalette } from './commandPalette/PromptPalette';
import { shouldIgnoreKeyboardShortcut } from '../features/keyboardGuards';
import { mountContentUI, createContentRoot } from './contentRoot';
import { deepElementFromPoint } from '../selection/deepElementFromPoint';
import { elementRegistry, generateSelector } from '../elementRegistry';
import { inspectElement } from '../inspector';
import {
  addPersistentSelection,
  addPersistentSelectionBySelector,
  clearPersistentSelections,
  pulsePersistentSelection,
} from '../overlays/persistentSelections';

let initialized = false;
let isVisible = false;
let shadow: ShadowRoot | null = null;
let currentState: OnPageState = getOnPageState();
let unsubscribeState: (() => void) | null = null;
let keydownHandler: ((event: KeyboardEvent) => void) | null = null;
let cleanupElementPicker: (() => void) | null = null;

export function initSpotlight(shadowRoot: ShadowRoot): void {
  if (initialized) return;
  initialized = true;

  shadow = shadowRoot;
  const style = document.createElement('style');
  style.textContent = paletteStyles;
  shadowRoot.appendChild(style);

  const container = mountContentUI(shadowRoot);
  createContentRoot(container);

  unsubscribeState = subscribeOnPageState((state) => {
    currentState = state;
    renderSpotlight();
  });

  keydownHandler = (event) => {
    if (event.key === 'Escape' && isVisible) {
      event.preventDefault();
      hideSpotlight();
      return;
    }
    if (shouldIgnoreKeyboardShortcut(event)) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      toggleSpotlight();
    }
  };
  document.addEventListener('keydown', keydownHandler, true);
  renderSpotlight();
}

function toggleSpotlight(): void {
  if (isVisible) {
    hideSpotlight();
  } else {
    showSpotlight();
  }
}

function showSpotlight(): void {
  if (isVisible) return;
  isVisible = true;
  renderSpotlight();
}

function hideSpotlight(): void {
  if (!isVisible) return;
  isVisible = false;
  renderSpotlight();
}

function getTextPreview(el: Element): string {
  const text = el.textContent?.trim() ?? '';
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
}

function isFlowElement(element: Element): boolean {
  if (element.closest('flow-overlay-root')) return true;
  if (element.closest('[data-flow-toolbar]')) return true;
  return false;
}

function dispatchPromptAction(payload: Record<string, unknown>): void {
  dispatchToPanel({ type: 'flow:prompt-action', payload });
}

function dispatchSelectionAndInspection(
  element: Element,
  clickPoint?: { x: number; y: number },
  inspectionOverride?: Awaited<ReturnType<typeof inspectElement>>
): Promise<void> {
  const elementIndex = elementRegistry.register(element);
  const rect = element.getBoundingClientRect();
  const selector = generateSelector(element);
  (window as unknown as { __flow_selectedElement?: Element }).__flow_selectedElement = element;

  const selectionMsg: ElementSelectedMessage = {
    type: 'element:selected',
    payload: {
      elementIndex,
      selector,
      rect: {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      elementRef: 'selected',
      tagName: element.tagName.toLowerCase(),
      id: (element as HTMLElement).id,
      classList: [...(element as HTMLElement).classList],
      textPreview: getTextPreview(element),
      clickPoint,
    },
  };
  dispatchToPanel(selectionMsg);

  if (inspectionOverride) {
    const inspectionMsg: ContentInspectionResult = {
      type: 'flow:content:inspection-result',
      tabId: 0,
      result: inspectionOverride,
    };
    dispatchToPanel(inspectionMsg);
    return Promise.resolve();
  }

  return inspectElement(element)
    .then((result) => {
      const inspectionMsg: ContentInspectionResult = {
        type: 'flow:content:inspection-result',
        tabId: 0,
        result,
      };
      dispatchToPanel(inspectionMsg);
    })
    .catch(() => {
      // Best effort: inspection may fail for detached nodes.
    });
}

function startElementPicker(): void {
  hideSpotlight();
  cleanupElementPicker?.();

  const onDocumentClick = async (event: MouseEvent) => {
    const element = deepElementFromPoint(event.clientX, event.clientY);
    if (!element || isFlowElement(element)) return;

    event.preventDefault();
    event.stopPropagation();

    cleanupElementPicker?.();
    cleanupElementPicker = null;

    const selector = generateSelector(element);
    let inspectionResult: Awaited<ReturnType<typeof inspectElement>> | undefined;
    try {
      inspectionResult = await inspectElement(element);
    } catch {
      inspectionResult = undefined;
    }

    await dispatchSelectionAndInspection(element, {
      x: Math.round(event.clientX),
      y: Math.round(event.clientY),
    }, inspectionResult);
    const persistentSelector = addPersistentSelection(element, selector);
    pulsePersistentSelection(persistentSelector);

    dispatchPromptAction({
      action: 'insert-chip',
      chip: {
        kind: 'element',
        label: selector,
        selector,
        componentName: element.tagName.toLowerCase(),
        metadata: inspectionResult ? { inspection: inspectionResult } : undefined,
      },
    });

    showSpotlight();
  };

  const onEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    cleanupElementPicker?.();
    cleanupElementPicker = null;
    showSpotlight();
  };

  document.addEventListener('click', onDocumentClick, true);
  document.addEventListener('keydown', onEscape, true);

  cleanupElementPicker = () => {
    document.removeEventListener('click', onDocumentClick, true);
    document.removeEventListener('keydown', onEscape, true);
  };
}

function handleChipClick(chip: PromptChip): void {
  if (!chip.selector) return;
  const element = addPersistentSelectionBySelector(chip.selector) ?? document.querySelector(chip.selector);
  if (!element) return;

  element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  pulsePersistentSelection(chip.selector);
  const rect = element.getBoundingClientRect();
  void dispatchSelectionAndInspection(element, {
    x: Math.round(rect.left + rect.width / 2),
    y: Math.round(rect.top + rect.height / 2),
  });
}

function renderSpotlight(): void {
  const root = createContentRoot(mountContentUI(shadow!));
  root.render(
    createElement(PromptPalette, {
      open: isVisible,
      state: currentState,
      onClose: hideSpotlight,
      onCopyPrompt: () => dispatchToPanel({ type: 'flow:copy-prompt' }),
      onClearDraft: () => dispatchPromptAction({ action: 'clear-draft' }),
      onInsertText: (text: string) => dispatchPromptAction({ action: 'insert-text', text }),
      onInsertChip: (chip: Omit<PromptChip, 'id'> & { id?: string }) =>
        dispatchPromptAction({ action: 'insert-chip', chip }),
      onRemoveNode: (nodeId: string) => dispatchPromptAction({ action: 'remove-node', nodeId }),
      onChipClick: handleChipClick,
      onStartElementPicker: startElementPicker,
      onClearSelections: clearPersistentSelections,
    })
  );
}

export function destroySpotlight(): void {
  cleanupElementPicker?.();
  cleanupElementPicker = null;
  unsubscribeState?.();
  unsubscribeState = null;
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler, true);
    keydownHandler = null;
  }
  hideSpotlight();
}
