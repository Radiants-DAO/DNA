import { beforeEach, describe, expect, it, vi } from 'vitest'

const runtime = vi.hoisted(() => {
  const posted: unknown[] = []
  let messageListener: ((msg: unknown) => void) | null = null
  let disconnectListener: (() => void) | null = null

  const port = {
    onMessage: {
      addListener: (listener: (msg: unknown) => void) => {
        messageListener = listener
      },
    },
    onDisconnect: {
      addListener: (listener: () => void) => {
        disconnectListener = listener
      },
    },
    postMessage: vi.fn((message: unknown) => {
      posted.push(message)
    }),
  } as unknown as chrome.runtime.Port

  return {
    port,
    posted,
    reset: () => {
      posted.length = 0
      messageListener = null
      disconnectListener = null
      ;(port.postMessage as unknown as { mockClear: () => void }).mockClear()
    },
    emitToContent: (message: unknown) => {
      messageListener?.(message)
    },
    disconnect: () => {
      disconnectListener?.()
    },
  }
})

const toolbarState = vi.hoisted(() => {
  let expanded = false
  let fabClickHandler: (() => void) | null = null

  return {
    reset: () => {
      expanded = false
      fabClickHandler = null
    },
    setFabHandler: (handler: () => void) => {
      fabClickHandler = handler
    },
    clickFab: () => {
      fabClickHandler?.()
    },
    expand: () => {
      expanded = true
    },
    collapse: () => {
      expanded = false
    },
    isExpanded: () => expanded,
  }
})

const overlayState = vi.hoisted(() => {
  let host: HTMLElement | null = null
  let shadow: ShadowRoot | null = null

  return {
    ensure: () => {
      if (shadow) return shadow
      host = document.createElement('flow-overlay-root')
      shadow = host.attachShadow({ mode: 'open' })
      document.documentElement.appendChild(host)
      return shadow
    },
    getHost: () => host,
    remove: () => {
      host?.remove()
      host = null
      shadow = null
    },
    reset: () => {
      host?.remove()
      host = null
      shadow = null
    },
  }
})

const inspectMocks = vi.hoisted(() => ({
  inspectElement: vi.fn(async (el: Element) => ({
    selector: `#${(el as HTMLElement).id}`,
    tagName: el.tagName.toLowerCase(),
  })),
}))

vi.mock('../../utils/runtimeSafety', () => ({
  safeRuntimeConnect: vi.fn(() => runtime.port),
  safePortPostMessage: vi.fn((port: chrome.runtime.Port, message: unknown) => {
    port.postMessage(message)
  }),
  isRuntimeMessagingError: vi.fn(() => false),
}))

vi.mock('../ui/toolbar', () => ({
  createToolbar: vi.fn(() => document.createElement('div')),
  connectToolbarToModeSystem: vi.fn(() => () => {}),
  destroyToolbar: vi.fn(),
  expandToolbar: vi.fn(() => toolbarState.expand()),
  collapseToolbar: vi.fn(() => toolbarState.collapse()),
  isToolbarExpanded: vi.fn(() => toolbarState.isExpanded()),
  setFabBadge: vi.fn(),
  setFabClickHandler: vi.fn((handler: () => void) => toolbarState.setFabHandler(handler)),
}))

vi.mock('../ui/modeIndicator', () => ({
  createModeIndicator: vi.fn(() => ({
    update: vi.fn(),
    destroy: vi.fn(),
  })),
}))

vi.mock('../overlays/overlayRoot', () => ({
  ensureOverlayRoot: vi.fn(() => overlayState.ensure()),
  getOverlayShadow: vi.fn(() => overlayState.ensure()),
  getOverlayHost: vi.fn(() => overlayState.getHost()),
  removeOverlayRoot: vi.fn(() => overlayState.remove()),
}))

vi.mock('../ui/contentRoot', () => ({ mountContentUI: vi.fn() }))
vi.mock('../ui/spotlight', () => ({ initSpotlight: vi.fn() }))
vi.mock('../ui/stateBridge', () => ({ initStateBridge: vi.fn() }))
vi.mock('../panelRouter', () => ({ initPanelRouter: vi.fn() }))
vi.mock('../mutations/mutationMessageHandler', () => ({
  initMutationMessageHandler: vi.fn(),
  broadcastMutationState: vi.fn(),
}))
vi.mock('../mutations/textEditMode', () => ({ initTextEditMode: vi.fn() }))
vi.mock('../commentBadges', () => ({
  openCommentComposer: vi.fn(),
  setCommentBadgeCallbacks: vi.fn(),
}))
vi.mock('../sharedRegistry', () => ({ registerSharedFeature: vi.fn() }))

vi.mock('../modes/eventInterceptor', () => ({
  enableEventInterception: vi.fn(),
  disableEventInterception: vi.fn(),
  getInterceptorElement: vi.fn(() => null),
}))
vi.mock('../modes/modeHotkeys', () => ({ registerModeHotkeys: vi.fn(() => () => {}) }))

vi.mock('../modes/tools/colorTool', () => ({
  createColorTool: vi.fn(() => ({ attach: vi.fn(), detach: vi.fn(), destroy: vi.fn() })),
}))
vi.mock('../modes/tools/effectsTool', () => ({
  createEffectsTool: vi.fn(() => ({ attach: vi.fn(), detach: vi.fn(), destroy: vi.fn() })),
}))
vi.mock('../modes/tools/positionTool', () => ({
  createPositionTool: vi.fn(() => ({ attach: vi.fn(), detach: vi.fn(), destroy: vi.fn() })),
}))
vi.mock('../modes/tools/layoutTool', () => ({
  createLayoutTool: vi.fn(() => ({ attach: vi.fn(), detach: vi.fn(), destroy: vi.fn() })),
}))
vi.mock('../modes/tools/typographyTool', () => ({
  createTypographyTool: vi.fn(() => ({ attach: vi.fn(), detach: vi.fn(), destroy: vi.fn() })),
}))
vi.mock('../modes/tools/moveTool', () => ({
  createMoveTool: vi.fn(() => ({
    beginDrag: vi.fn(),
    updateDrag: vi.fn(),
    endDrag: vi.fn(),
    isDragging: vi.fn(() => false),
    deselect: vi.fn(),
    destroy: vi.fn(),
  })),
}))
vi.mock('../modes/tools/inspectTooltip', () => ({
  createInspectTooltip: vi.fn(() => ({ show: vi.fn(), hide: vi.fn(), destroy: vi.fn() })),
}))
vi.mock('../modes/tools/inspectPanel', () => ({
  createInspectPanel: vi.fn(() => ({ attach: vi.fn(), detach: vi.fn(), destroy: vi.fn() })),
}))
vi.mock('../modes/tools/inspectRuler', () => ({
  createInspectRuler: vi.fn(() => ({
    setAnchor: vi.fn(),
    measureTo: vi.fn(),
    clearLines: vi.fn(),
    clear: vi.fn(),
    destroy: vi.fn(),
  })),
}))
vi.mock('../modes/tools/guidesTool', () => ({
  createGuidesTool: vi.fn(() => ({
    activate: vi.fn(),
    deactivate: vi.fn(),
    onHover: vi.fn(),
    onSelect: vi.fn(),
    destroy: vi.fn(),
  })),
}))
vi.mock('../modes/tools/toolTheme.css?inline', () => ({ default: '' }))

vi.mock('../inspector', () => ({
  inspectElement: inspectMocks.inspectElement,
}))

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

function ensureStylesheetPolyfill(): void {
  class TestCSSStyleSheet {
    replaceSync(_cssText: string): void {}
  }

  vi.stubGlobal('CSSStyleSheet', TestCSSStyleSheet)

  if (!('adoptedStyleSheets' in ShadowRoot.prototype)) {
    Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
      configurable: true,
      get() {
        return (this as ShadowRoot & { __adoptedSheets?: unknown[] }).__adoptedSheets ?? []
      },
      set(value: unknown[]) {
        ;(this as ShadowRoot & { __adoptedSheets?: unknown[] }).__adoptedSheets = value
      },
    })
  }
}

describe('content traversal wiring', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    runtime.reset()
    toolbarState.reset()
    overlayState.reset()
    inspectMocks.inspectElement.mockClear()
    document.body.innerHTML = ''
    document.head.innerHTML = ''
    ensureStylesheetPolyfill()
    ;(window as unknown as { __flow_selectedElement?: Element }).__flow_selectedElement = undefined
  })

  it('Tab traversal posts element:selected and inspection-result for next sibling', async () => {
    vi.stubGlobal('defineContentScript', (definition: unknown) => definition)

    const parent = document.createElement('div')
    const childA = document.createElement('div')
    childA.id = 'a'
    const childB = document.createElement('div')
    childB.id = 'b'
    parent.append(childA, childB)
    document.body.appendChild(parent)

    let hitElement: Element = childA
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => hitElement),
    })

    const entry = (await import('../../entrypoints/content')).default as { main: () => void }
    entry.main()

    // Enable Flow (setFlowEnabled(true))
    toolbarState.clickFab()

    // Seed selection to childA via click path
    document.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: 10,
        clientY: 10,
      }),
    )
    await flushAsyncWork()

    // Ignore seed click messages; focus on traversal output.
    runtime.posted.length = 0
    inspectMocks.inspectElement.mockClear()

    // Trigger traversal to next sibling (childB)
    hitElement = childB
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      }),
    )
    await flushAsyncWork()

    const selectedMessages = runtime.posted.filter(
      (msg) => (msg as { type?: string }).type === 'element:selected',
    ) as Array<{ type: 'element:selected'; payload: { selector: string } }>
    const inspectionMessages = runtime.posted.filter(
      (msg) => (msg as { type?: string }).type === 'flow:content:inspection-result',
    ) as Array<{ type: 'flow:content:inspection-result'; result: { selector: string } }>

    expect(selectedMessages.length).toBeGreaterThan(0)
    expect(inspectionMessages.length).toBeGreaterThan(0)
    expect(selectedMessages.at(-1)?.payload.selector).toBe('#b')
    expect(inspectionMessages.at(-1)?.result.selector).toBe('#b')
    expect(
      (window as unknown as { __flow_selectedElement?: Element }).__flow_selectedElement,
    ).toBe(childB)

    // Ensures previous selection index was cleaned up during traversal.
    expect(childA.hasAttribute('data-flow-index')).toBe(false)
    expect(childB.hasAttribute('data-flow-index')).toBe(true)
  })
})
