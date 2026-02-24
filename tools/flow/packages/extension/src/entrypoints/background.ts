import {
  FLOW_PORT_NAME,
  FLOW_PANEL_PORT_NAME,
  FLOW_PANEL_PORTS,
  type ContentToBackgroundMessage,
  type PanelToBackgroundMessage,
  type BackgroundToPanelMessage,
  type ContentInspectionResult,
  type MutationDiffEvent,
  type GroupedStyles,
  type PanelSessionDataMessage,
  type PanelHumanThreadReplyMessage,
} from '@flow/shared';
import { createSidecarClient, type SidecarMessage } from '../lib/sidecar-client.js';
import { cdpCommand, detachCDP, resetDomains } from '../lib/cdpSession.js';
import { addComment, updateComment, updateSessionFromPanelSync, getSession } from '../lib/backgroundSessionStore.js';
import { scheduleCompileAndPush, cancelPendingCompile } from '../lib/backgroundCompiler.js';
import { recordTabActivity, removeTab, handleAlarm, onTabSleep, startKeepalive } from '../lib/keepalive.js';
import { saveSession, type SessionData } from '../services/sessionPersistence.js';
import type { Feedback, FeedbackType } from '@flow/shared';

const ALLOWED_CDP_METHODS = new Set([
  'DOM.enable', 'DOM.getDocument', 'DOM.querySelector', 'DOM.requestNode', 'DOM.getBoxModel',
  'CSS.enable', 'CSS.forcePseudoState', 'CSS.getMatchedStylesForNode',
  'Overlay.enable', 'Overlay.highlightNode', 'Overlay.hideHighlight',
  'Page.captureScreenshot',
  'Runtime.evaluate',
  'Accessibility.enable', 'Accessibility.getFullAXTree',
]);

export default defineBackground(() => {
  // Open Side Panel when the extension icon is clicked
  chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (err) {
      console.warn('[background] Failed to open side panel:', err);
    }
  });

  // Enable side panel for all tabs
  chrome.sidePanel.setOptions({ enabled: true }).catch(() => {});

  // Initialize sidecar client for MCP server connection
  const sidecar = createSidecarClient();
  sidecar.startPolling();

  sidecar.onStatusChange((connected, health) => {
    // Notify all DevTools panels of mode change
    chrome.runtime.sendMessage({
      type: connected ? "sidecar-connected" : "sidecar-disconnected",
      health,
    }).catch(() => {
      // Ignore errors when no receivers are available
    });
  });

  // Route incoming agent messages from sidecar to panels + content scripts
  sidecar.onMessage((msg) => {
    if (msg.type === 'agent-feedback' || msg.type === 'agent-resolve' || msg.type === 'agent-thread-reply') {
      const payload = msg.payload as { tabId?: number } | undefined;
      const tabId = payload?.tabId;
      if (typeof tabId !== 'number') return;

      // Route to panel ports (bg: prefix distinguishes from other message sources)
      const bgMsg = { type: `bg:${msg.type}`, payload: msg.payload } as BackgroundToPanelMessage;
      broadcastToTab(tabId, bgMsg as unknown as ContentToBackgroundMessage);

      // Route to content script for badge rendering (thread replies don't render badges)
      if (msg.type === 'agent-feedback' || msg.type === 'agent-resolve') {
        const contentPort = contentPorts.get(tabId);
        if (contentPort) {
          contentPort.postMessage({
            type: msg.type === 'agent-feedback' ? 'panel:agent-feedback' : 'panel:agent-resolve',
            payload: msg.payload,
          });
        }
      }
    }
  });

  // ── Keepalive alarm and auto-sleep ──
  chrome.alarms.onAlarm.addListener(handleAlarm);

  onTabSleep((tabId) => {
    // Send sleep signal to content script
    const contentPort = contentPorts.get(tabId);
    if (contentPort) {
      contentPort.postMessage({ type: 'bg:sleep' });
    }

    // Cancel any pending compile for this tab
    cancelPendingCompile(tabId);

    // Flush session to chrome.storage.session
    const session = getSession(tabId);
    if (session) {
      const sessionData: SessionData = {
        textEdits: session.textEdits,
        mutationDiffs: session.mutationDiffs,
        animationDiffs: session.animationDiffs,
        promptDraft: session.promptDraft,
        promptSteps: session.promptSteps,
        comments: session.comments,
        activeLanguage: 'css',
        savedAt: Date.now(),
      };
      saveSession(tabId, sessionData).catch(() => {});
    }

    // Close sidecar session
    sidecar.closeSession(tabId);
  });

  // Reset CDP domain tracking on navigation so stale enables don't cause errors.
  // Guard at runtime in case the permission is missing in a given build.
  if (chrome.webNavigation?.onCommitted) {
    chrome.webNavigation.onCommitted.addListener((details) => {
      if (details.frameId === 0) {
        resetDomains(details.tabId);
      }
    });
  }

  // Handle panel requests for sidecar status + CDP commands.
  // CDP command channel — separate from port-based pipeline.
  // Ports handle streaming events (hover, selection, inspection).
  // sendMessage handles one-shot CDP requests from the panel.
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "get-sidecar-status") {
      sendResponse({ connected: sidecar.connected, health: sidecar.health });
      return true;
    }

    if (message.type === 'cdp:command') {
      const { method, params } = message.payload;
      const tabId = message.tabId;
      if (typeof tabId !== 'number') {
        sendResponse({ error: 'Invalid tabId' });
        return true;
      }
      if (!ALLOWED_CDP_METHODS.has(method)) {
        sendResponse({ error: `CDP method not allowed: ${method}` });
        return true;
      }
      cdpCommand(tabId, method, params)
        .then((result) => sendResponse({ result }))
        .catch((err: Error) => sendResponse({ error: err.message }));
      return true; // async response
    }

    return false;
  });
  /**
   * Service worker — message router keyed by tabId.
   *
   * Content script connects via FLOW_PORT_NAME.
   * Panel ports (main, mutation, text-edit) connect via their respective port names.
   * Messages from content are forwarded to all registered panels for the same tab.
   */

  // Map of port name → (tabId → port)
  const panelPortsByType = new Map<string, Map<number, chrome.runtime.Port>>();
  const contentPorts = new Map<number, chrome.runtime.Port>();

  // Initialize port maps for all known panel types
  for (const portName of FLOW_PANEL_PORTS) {
    panelPortsByType.set(portName, new Map());
  }

  /**
   * Register a panel port for a specific tab.
   * Used for main panel and future mutation/text-edit panels.
   */
  function registerPanelPort(
    portName: string,
    tabId: number,
    port: chrome.runtime.Port
  ): void {
    let portMap = panelPortsByType.get(portName);
    if (!portMap) {
      portMap = new Map();
      panelPortsByType.set(portName, portMap);
    }
    portMap.set(tabId, port);

    port.onDisconnect.addListener(() => {
      portMap?.delete(tabId);
      const hasRemainingPorts = [...panelPortsByType.values()].some(m => m.has(tabId));
      if (!hasRemainingPorts) {
        detachCDP(tabId);
      }
    });
  }

  /**
   * Broadcast a message to all panel ports for a given tab.
   */
  function broadcastToTab(tabId: number, msg: ContentToBackgroundMessage): void {
    for (const portMap of panelPortsByType.values()) {
      const port = portMap.get(tabId);
      if (port) {
        port.postMessage(msg);
      }
    }
  }

  /**
   * Forward relevant content messages to the sidecar WebSocket for MCP tools.
   * This centralizes sidecar communication in the background script to avoid
   * duplication in content scripts and panel components.
   */
  function forwardToSidecar(msg: ContentToBackgroundMessage): void {
    if (!sidecar.connected) return;

    switch (msg.type) {
      case 'flow:content:inspection-result': {
        const inspectionMsg = msg as ContentInspectionResult;
        const { result } = inspectionMsg;

        // Send element context
        if (result.selector) {
          const contextPayload: SidecarMessage = {
            type: 'element-context',
            payload: {
              selector: result.selector,
              componentName: result.fiber?.componentName,
              filePath: result.fiber?.source?.fileName,
              line: result.fiber?.source?.lineNumber,
              column: result.fiber?.source?.columnNumber,
              props: result.fiber?.props,
              parentChain: result.fiber?.hierarchy?.map((h) => h.componentName),
              appliedTokens: extractAppliedTokens(result.customProperties ?? []),
              computedStyles: flattenGroupedStyles(result.styles),
            },
          };
          sidecar.send(contextPayload);

          // Send extracted styles
          if (result.styles) {
            sidecar.send({
              type: 'extracted-styles',
              payload: {
                selector: result.selector,
                styles: result.styles,
              },
            });
          }

          // Send animation state
          if (result.animations && result.animations.length > 0) {
            sidecar.send({
              type: 'animation-state',
              payload: {
                selector: result.selector,
                animations: result.animations,
              },
            });
          }
        }
        break;
      }

      // TODO: Handle component-tree when React DevTools integration is available
      // case 'flow:content:component-tree':
      //   sidecar.send({ type: 'component-tree', payload: msg.payload });
      //   break;
    }
  }

  /**
   * Extract applied token names from custom properties.
   */
  function extractAppliedTokens(
    customProperties: Array<{ name: string; value: string }>
  ): Record<string, string> {
    const tokens: Record<string, string> = {};
    for (const prop of customProperties) {
      tokens[prop.name] = prop.value;
    }
    return tokens;
  }

  /**
   * Flatten GroupedStyles into a single record for context store.
   */
  function flattenGroupedStyles(styles: GroupedStyles | undefined): Record<string, string> {
    if (!styles) return {};
    const flat: Record<string, string> = {};
    const categories: (keyof GroupedStyles)[] = [
      'layout', 'spacing', 'size', 'typography', 'colors',
      'borders', 'shadows', 'effects', 'animations'
    ];
    for (const category of categories) {
      const entries = styles[category];
      if (entries) {
        for (const entry of entries) {
          flat[entry.property] = entry.value;
        }
      }
    }
    return flat;
  }

  /**
   * Forward mutation diff events to the sidecar for MCP tools.
   */
  function forwardMutationToSidecar(msg: MutationDiffEvent): void {
    if (!sidecar.connected) return;

    const { diff } = msg;
    // Transform to sidecar's expected MutationDiff format
    for (const change of diff.changes) {
      sidecar.send({
        type: 'mutation-diff',
        payload: {
          selector: diff.element.selector,
          componentName: diff.element.componentName,
          filePath: diff.element.sourceFile,
          property: change.property,
          before: change.oldValue,
          after: change.newValue,
          timestamp: Date.parse(diff.timestamp),
        },
      });
    }
  }

  chrome.runtime.onConnect.addListener((port) => {
    // ── Panel connection (any panel type) ──
    if ((FLOW_PANEL_PORTS as readonly string[]).includes(port.name)) {
      let tabId: number | null = null;

      const onMessage = (msg: PanelToBackgroundMessage | Record<string, unknown>) => {
        if (msg.type === 'panel:init') {
          const initMsg = msg as PanelToBackgroundMessage & { type: 'panel:init' };
          tabId = initMsg.payload.tabId;
          registerPanelPort(port.name, tabId, port);
          // Background owns the sidecar session for this tab
          sidecar.registerTab(tabId);
          return;
        }

        // Handle session data from panel → background session store → compile → push
        if (msg.type === 'panel:session-data') {
          if (tabId !== null) {
            const sessionMsg = msg as PanelSessionDataMessage;
            // Panel sends typed data serialized as unknown[] over the port
            updateSessionFromPanelSync(tabId, sessionMsg.payload as Parameters<typeof updateSessionFromPanelSync>[1]);
            scheduleCompileAndPush(tabId, sidecar);
          }
          return;
        }

        // Forward state sync from panel to content script
        if (msg.type === 'flow:state-sync') {
          if (tabId !== null) {
            const contentPort = contentPorts.get(tabId);
            if (contentPort) {
              contentPort.postMessage(msg);
            }
          }
          return;
        }

        // Handle human thread replies from panel
        if (msg.type === 'panel:human-thread-reply') {
          if (tabId !== null) {
            const replyMsg = msg as PanelHumanThreadReplyMessage;
            sidecar.pushHumanReply(tabId, replyMsg.payload.feedbackId, replyMsg.payload.content);
          }
          return;
        }

        if (tabId !== null) {
          contentPorts.get(tabId)?.postMessage(msg);
        }
      };
      port.onMessage.addListener(onMessage);
      return;
    }

    // ── Content script connection ──
    if (port.name === FLOW_PORT_NAME) {
      const tabId = port.sender?.tab?.id;
      if (tabId === undefined) return;

      contentPorts.set(tabId, port);
      recordTabActivity(tabId);
      startKeepalive();

      // Inject agent script into MAIN world now that content script is ready
      chrome.scripting
        .executeScript({
          target: { tabId },
          world: 'MAIN',
          files: ['/agent.js'],
        })
        .catch(() => {
          // Expected to fail on chrome://, edge://, extension pages, etc.
        });

      port.onMessage.addListener((msg: ContentToBackgroundMessage | Record<string, unknown>) => {
        // Broadcast to all panel types for this tab
        broadcastToTab(tabId, msg as ContentToBackgroundMessage);

        // Forward relevant messages to sidecar WebSocket for MCP tools
        forwardToSidecar(msg as ContentToBackgroundMessage);

        // Forward mutation diffs to sidecar (mutations come from content script)
        if ('kind' in msg && (msg as { kind: string }).kind === 'mutation:diff') {
          forwardMutationToSidecar(msg as unknown as MutationDiffEvent);
        }

        // Track user activity for keepalive/sleep
        if ('type' in msg && msg.type === 'flow:activity') {
          recordTabActivity(tabId);
          return;
        }

        // Capture comments in background session store (dual-write with panel)
        if ('type' in msg && msg.type === 'comment:submitted') {
          const payload = (msg as Record<string, unknown>).payload as {
            id: string;
            type: FeedbackType;
            selector: string;
            componentName: string;
            content: string;
            coordinates: { x: number; y: number };
            linkedSelectors?: string[];
          };
          const feedback: Feedback = {
            id: payload.id,
            type: payload.type,
            elementSelector: payload.selector,
            componentName: payload.componentName,
            devflowId: null,
            source: null,
            content: payload.content,
            coordinates: payload.coordinates,
            timestamp: Date.now(),
            linkedSelectors: payload.linkedSelectors,
          };
          addComment(tabId, feedback);
        }

        if ('type' in msg && msg.type === 'comment:edited') {
          const payload = (msg as Record<string, unknown>).payload as {
            id: string;
            content: string;
          };
          if (payload.id && typeof payload.content === 'string') {
            updateComment(tabId, payload.id, payload.content);
          }
        }
      });

      port.onDisconnect.addListener(() => {
        contentPorts.delete(tabId);
        removeTab(tabId);
      });

      return;
    }
  });
});
