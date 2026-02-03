import { useState, useEffect, useRef } from 'react';
import {
  FLOW_PANEL_PORT_NAME,
  type BackgroundToPanelMessage,
  type PanelToBackgroundMessage,
  type ElementHoveredMessage,
  type ElementSelectedMessage,
} from '@flow/shared';

export function Panel() {
  const [hoveredElement, setHoveredElement] =
    useState<ElementHoveredMessage['payload'] | null>(null);
  const [selectedElement, setSelectedElement] =
    useState<ElementSelectedMessage['payload'] | null>(null);
  const [agentGlobals, setAgentGlobals] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    const tabId = chrome.devtools.inspectedWindow.tabId;
    const port = chrome.runtime.connect({ name: FLOW_PANEL_PORT_NAME });
    portRef.current = port;

    // Register this panel with the service worker
    const initMsg: PanelToBackgroundMessage = {
      type: 'panel:init',
      payload: { tabId },
    };
    port.postMessage(initMsg);
    setConnected(true);

    port.onMessage.addListener((msg: BackgroundToPanelMessage) => {
      switch (msg.type) {
        case 'element:hovered':
          setHoveredElement(msg.payload);
          break;
        case 'element:unhovered':
          setHoveredElement(null);
          break;
        case 'element:selected':
          setSelectedElement(msg.payload);
          break;
        case 'agent:ready':
          setAgentGlobals(msg.payload.globals);
          break;
      }
    });

    port.onDisconnect.addListener(() => {
      setConnected(false);
      portRef.current = null;
    });

    return () => {
      port.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 font-mono text-sm">
      <header className="mb-4 flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-tight">Flow</h1>
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            connected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-neutral-500 text-xs">
          {connected ? 'connected' : 'disconnected'}
        </span>
      </header>

      {agentGlobals.length > 0 && (
        <section className="mb-4 p-3 rounded bg-neutral-900 border border-neutral-800">
          <h2 className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
            Detected Globals
          </h2>
          <div className="flex gap-2">
            {agentGlobals.map((g) => (
              <span
                key={g}
                className="px-2 py-0.5 rounded bg-neutral-800 text-xs"
              >
                {g}
              </span>
            ))}
          </div>
        </section>
      )}

      {selectedElement && (
        <section className="mb-4 p-3 rounded bg-blue-950 border border-blue-800">
          <h2 className="text-xs text-blue-400 uppercase tracking-wide mb-2">
            Selected Element
          </h2>
          <div className="space-y-1">
            <div>
              <span className="text-blue-400">
                &lt;{selectedElement.tagName}
              </span>
              {selectedElement.id && (
                <span className="text-yellow-400">
                  #{selectedElement.id}
                </span>
              )}
              {selectedElement.classList.length > 0 && (
                <span className="text-green-400">
                  .{selectedElement.classList.join('.')}
                </span>
              )}
              <span className="text-blue-400">&gt;</span>
            </div>
            <div className="text-neutral-500 text-xs">
              Index: {selectedElement.elementIndex} | {selectedElement.rect.width}x{selectedElement.rect.height}
            </div>
            <div className="text-neutral-400 text-xs font-mono truncate">
              {selectedElement.selector}
            </div>
          </div>
        </section>
      )}

      <section className="p-3 rounded bg-neutral-900 border border-neutral-800">
        <h2 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
          Hovered Element
        </h2>
        {hoveredElement ? (
          <div className="space-y-1">
            <div>
              <span className="text-blue-400">
                &lt;{hoveredElement.tagName}
              </span>
              {hoveredElement.id && (
                <span className="text-yellow-400">
                  #{hoveredElement.id}
                </span>
              )}
              {hoveredElement.classList.length > 0 && (
                <span className="text-green-400">
                  .{hoveredElement.classList.join('.')}
                </span>
              )}
              <span className="text-blue-400">&gt;</span>
            </div>
            <div className="text-neutral-500 text-xs">
              {hoveredElement.rect.width}x{hoveredElement.rect.height} at (
              {hoveredElement.rect.left}, {hoveredElement.rect.top})
            </div>
            {hoveredElement.textPreview && (
              <div className="text-neutral-400 text-xs truncate">
                &quot;{hoveredElement.textPreview}&quot;
              </div>
            )}
          </div>
        ) : (
          <p className="text-neutral-600 text-xs">
            Hover over an element on the page...
          </p>
        )}
      </section>
    </div>
  );
}
