import {
  FLOW_PORT_NAME,
  FLOW_PANEL_PORT_NAME,
  FLOW_PANEL_PORTS,
  type ContentToBackgroundMessage,
  type PanelToBackgroundMessage,
} from '@flow/shared';

export default defineBackground(() => {
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

  chrome.runtime.onConnect.addListener((port) => {
    // ── Panel connection (any panel type) ──
    if ((FLOW_PANEL_PORTS as readonly string[]).includes(port.name)) {
      let tabId: number | null = null;

      const onMessage = (msg: PanelToBackgroundMessage | Record<string, unknown>) => {
        if (msg.type === 'panel:init') {
          const initMsg = msg as PanelToBackgroundMessage & { type: 'panel:init' };
          tabId = initMsg.payload.tabId;
          registerPanelPort(port.name, tabId, port);
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

      port.onMessage.addListener((msg: ContentToBackgroundMessage) => {
        // Broadcast to all panel types for this tab
        broadcastToTab(tabId, msg);
      });

      port.onDisconnect.addListener(() => {
        contentPorts.delete(tabId);
      });

      return;
    }
  });
});
