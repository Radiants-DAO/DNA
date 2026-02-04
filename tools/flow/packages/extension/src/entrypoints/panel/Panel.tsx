import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FLOW_PANEL_PORT_NAME,
  type BackgroundToPanelMessage,
  type PanelToBackgroundMessage,
  type ElementHoveredMessage,
  type ElementSelectedMessage,
  type InspectionResult,
  type GroupedStyles,
  type CustomProperty,
  type AnimationData,
  type HierarchyEntry,
  type MutationDiff,
} from '@flow/shared';
import { MutationDiffPanel } from '../../panel/components/MutationDiffPanel';
import { useMutationBridge } from '../../panel/hooks/useMutationBridge';
import { useTextEditBridge } from '../../panel/hooks/useTextEditBridge';

export function Panel() {
  const [hoveredElement, setHoveredElement] =
    useState<ElementHoveredMessage['payload'] | null>(null);
  const [selectedElement, setSelectedElement] =
    useState<ElementSelectedMessage['payload'] | null>(null);
  const [inspectionResult, setInspectionResult] = useState<InspectionResult | null>(null);
  const [agentGlobals, setAgentGlobals] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  // Mutation state
  const [mutationDiffs, setMutationDiffs] = useState<MutationDiff[]>([]);
  const [textEditActive, setTextEditActive] = useState(false);

  const tabId = chrome.devtools.inspectedWindow.tabId;

  // Mutation diff handlers
  const handleMutationDiff = useCallback((diff: MutationDiff) => {
    setMutationDiffs((prev) => (prev.some((d) => d.id === diff.id) ? prev : [...prev, diff]));
  }, []);

  const handleMutationReverted = useCallback((mutationId: string | 'all') => {
    if (mutationId === 'all') {
      setMutationDiffs([]);
    } else {
      setMutationDiffs((prev) => prev.filter((d) => d.id !== mutationId));
    }
  }, []);

  // Get the elementRef from the selected element (sent by content script)
  const elementRef = selectedElement?.elementRef ?? null;

  // Mutation bridge hook
  const { revert, clear } = useMutationBridge({
    elementRef,
    tabId,
    onDiff: handleMutationDiff,
    onReverted: handleMutationReverted,
  });

  // Text edit bridge hook
  useTextEditBridge({
    active: textEditActive,
    tabId,
    onDiff: handleMutationDiff,
  });

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
          // Clear previous inspection result while new one loads
          setInspectionResult(null);
          break;
        case 'agent:ready':
          setAgentGlobals(msg.payload.globals);
          break;
        case 'flow:content:inspection-result':
          setInspectionResult(msg.result);
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 font-mono text-sm overflow-y-auto">
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
          <SectionHeader>Detected Globals</SectionHeader>
          <div className="flex gap-2 flex-wrap">
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

      {inspectionResult ? (
        <InspectionDisplay result={inspectionResult} />
      ) : selectedElement ? (
        <section className="mb-4 p-3 rounded bg-blue-950 border border-blue-800">
          <SectionHeader className="text-blue-400">Selected Element</SectionHeader>
          <ElementTag
            tagName={selectedElement.tagName}
            id={selectedElement.id}
            classList={selectedElement.classList}
          />
          <div className="text-neutral-500 text-xs mt-1">
            Inspecting...
          </div>
        </section>
      ) : (
        <section className="mb-4 p-3 rounded bg-neutral-900 border border-neutral-800">
          <p className="text-neutral-500 text-xs">
            Alt+Click an element on the page to inspect it.
          </p>
        </section>
      )}

      <section className="p-3 rounded bg-neutral-900 border border-neutral-800">
        <SectionHeader>Hovered Element</SectionHeader>
        {hoveredElement ? (
          <div className="space-y-1">
            <ElementTag
              tagName={hoveredElement.tagName}
              id={hoveredElement.id}
              classList={hoveredElement.classList}
            />
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

      {/* Mutations section */}
      <section className="mt-4 p-3 rounded bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <SectionHeader className="mb-0">Mutations</SectionHeader>
          <button
            onClick={() => setTextEditActive((prev) => !prev)}
            className={`text-xs px-2 py-1 rounded ${
              textEditActive
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {textEditActive ? 'Text Edit: ON' : 'Text Edit: OFF'}
          </button>
        </div>
        <MutationDiffPanel
          diffs={mutationDiffs}
          onRevert={(mutationId) => revert(mutationId)}
          onRevertAll={() => revert('all')}
          onClear={() => {
            clear();
            setMutationDiffs([]);
          }}
        />
      </section>
    </div>
  );
}

// ─── Sub-components ───

function SectionHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-xs text-neutral-500 uppercase tracking-wide mb-2 ${className}`}>
      {children}
    </h2>
  );
}

function ElementTag({ tagName, id, classList }: { tagName: string; id: string; classList: string[] }) {
  return (
    <div>
      <span className="text-blue-400">
        &lt;{tagName}
      </span>
      {id && (
        <span className="text-yellow-400">
          #{id}
        </span>
      )}
      {classList.length > 0 && (
        <span className="text-green-400">
          .{classList.join('.')}
        </span>
      )}
      <span className="text-blue-400">&gt;</span>
    </div>
  );
}

function InspectionDisplay({ result }: { result: InspectionResult }) {
  return (
    <div className="space-y-4">
      {/* Element identity */}
      <section className="p-3 rounded bg-blue-950 border border-blue-800">
        <SectionHeader className="text-blue-400">Element</SectionHeader>
        <div className="font-mono text-xs text-neutral-300">
          &lt;{result.tagName}&gt;
        </div>
        <div className="font-mono text-xs text-neutral-500 mt-1">
          {result.selector}
        </div>
      </section>

      {/* React component info */}
      {(result.fiber || result.reactGrab) && (
        <section className="p-3 rounded bg-purple-950 border border-purple-800">
          <SectionHeader className="text-purple-400">Component</SectionHeader>
          <ComponentInfo fiber={result.fiber} reactGrab={result.reactGrab} />
        </section>
      )}

      {/* Custom properties */}
      {result.customProperties.length > 0 && (
        <section className="p-3 rounded bg-neutral-900 border border-neutral-800">
          <SectionHeader>
            Custom Properties ({result.customProperties.length})
          </SectionHeader>
          <CustomPropertiesList properties={result.customProperties} />
        </section>
      )}

      {/* Layout structure */}
      {result.layout.type !== 'block' && result.layout.type !== 'none' && (
        <section className="p-3 rounded bg-neutral-900 border border-neutral-800">
          <SectionHeader>Layout: {result.layout.type}</SectionHeader>
          <LayoutInfo layout={result.layout} />
        </section>
      )}

      {/* Grouped styles */}
      <StyleCategories styles={result.styles} />

      {/* Animations */}
      {result.animations.length > 0 && (
        <section className="p-3 rounded bg-orange-950 border border-orange-800">
          <SectionHeader className="text-orange-400">
            Animations ({result.animations.length})
          </SectionHeader>
          <AnimationsList animations={result.animations} />
        </section>
      )}
    </div>
  );
}

function ComponentInfo({
  fiber,
  reactGrab,
}: {
  fiber: InspectionResult['fiber'];
  reactGrab?: InspectionResult['reactGrab'];
}) {
  const componentName = fiber?.componentName || reactGrab?.componentName || 'Unknown';
  const fiberSource = fiber?.source ?? null;
  const grabFile = reactGrab?.fileName ?? null;
  const grabLine = reactGrab?.lineNumber ?? null;
  const grabColumn = reactGrab?.columnNumber ?? null;

  return (
    <div className="space-y-2">
      <div className="font-semibold text-neutral-100">
        {componentName}
        {reactGrab && !fiber && (
          <span className="ml-2 text-[10px] text-purple-400 uppercase">(via React Grab)</span>
        )}
      </div>

      {fiberSource ? (
        <div className="font-mono text-xs text-neutral-400">
          {fiberSource.fileName}:{fiberSource.lineNumber}
          {fiberSource.columnNumber ? `:${fiberSource.columnNumber}` : ''}
        </div>
      ) : grabFile ? (
        <div className="font-mono text-xs text-neutral-400">
          {grabFile}
          {grabLine != null ? `:${grabLine}` : ''}
          {grabColumn != null ? `:${grabColumn}` : ''}
        </div>
      ) : null}

      {/* Props */}
      {fiber && Object.keys(fiber.props).length > 0 && (
        <div>
          <span className="text-xs text-neutral-500">Props:</span>
          <div className="font-mono text-xs ml-2 mt-1 space-y-0.5">
            {Object.entries(fiber.props).map(([key, val]) => (
              <div key={key}>
                <span className="text-neutral-500">{key}</span>
                <span className="text-neutral-300">={JSON.stringify(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hierarchy */}
      {fiber && fiber.hierarchy.length > 0 && (
        <div>
          <span className="text-xs text-neutral-500">Hierarchy:</span>
          <div className="font-mono text-xs ml-2 mt-1">
            {fiber.hierarchy.map((entry: HierarchyEntry, i: number) => (
              <div key={i} className="text-neutral-400">
                {'  '.repeat(i)}&lt;{entry.componentName}&gt;
                {entry.source && (
                  <span className="ml-1 opacity-60">
                    {entry.source.fileName.split('/').pop()}:{entry.source.lineNumber}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomPropertiesList({ properties }: { properties: CustomProperty[] }) {
  const tierColors: Record<string, string> = {
    semantic: 'text-green-400',
    brand: 'text-blue-400',
    unknown: 'text-neutral-500',
  };

  return (
    <div className="font-mono text-xs space-y-0.5">
      {properties.map((prop) => (
        <div key={prop.name} className="flex items-center gap-2">
          {prop.tier !== 'unknown' && (
            <span className={`text-[10px] uppercase ${tierColors[prop.tier]}`}>
              {prop.tier}
            </span>
          )}
          <span className="text-neutral-500">{prop.name}:</span>
          <span className="text-neutral-300">{prop.value}</span>
        </div>
      ))}
    </div>
  );
}

function LayoutInfo({ layout }: { layout: InspectionResult['layout'] }) {
  return (
    <div className="font-mono text-xs space-y-0.5">
      {layout.type === 'grid' && (
        <>
          {layout.gridTemplateColumns && (
            <div>
              <span className="text-neutral-500">columns:</span>{' '}
              <span className="text-neutral-300">{layout.gridTemplateColumns}</span>
            </div>
          )}
          {layout.gridTemplateRows && (
            <div>
              <span className="text-neutral-500">rows:</span>{' '}
              <span className="text-neutral-300">{layout.gridTemplateRows}</span>
            </div>
          )}
          {layout.inferredColumns && (
            <div>
              <span className="text-neutral-500">inferred:</span>{' '}
              <span className="text-neutral-300">
                {layout.inferredColumns} cols x {layout.inferredRows ?? '?'} rows
              </span>
            </div>
          )}
          {layout.gridGap && (
            <div>
              <span className="text-neutral-500">gap:</span>{' '}
              <span className="text-neutral-300">{layout.gridGap}</span>
            </div>
          )}
        </>
      )}
      {layout.type === 'flex' && (
        <>
          {layout.flexDirection && (
            <div>
              <span className="text-neutral-500">direction:</span>{' '}
              <span className="text-neutral-300">{layout.flexDirection}</span>
            </div>
          )}
          {layout.alignItems && (
            <div>
              <span className="text-neutral-500">align:</span>{' '}
              <span className="text-neutral-300">{layout.alignItems}</span>
            </div>
          )}
          {layout.justifyContent && (
            <div>
              <span className="text-neutral-500">justify:</span>{' '}
              <span className="text-neutral-300">{layout.justifyContent}</span>
            </div>
          )}
          {layout.gap && (
            <div>
              <span className="text-neutral-500">gap:</span>{' '}
              <span className="text-neutral-300">{layout.gap}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const CATEGORY_LABELS: Record<keyof GroupedStyles, string> = {
  layout: 'Layout',
  spacing: 'Spacing',
  size: 'Size',
  typography: 'Typography',
  colors: 'Colors',
  borders: 'Borders',
  shadows: 'Shadows',
  effects: 'Effects',
  animations: 'Animations',
};

function StyleCategories({ styles }: { styles: GroupedStyles }) {
  const nonEmpty = (Object.entries(styles) as [keyof GroupedStyles, GroupedStyles[keyof GroupedStyles]][]).filter(
    ([, entries]) => entries.length > 0
  );

  if (nonEmpty.length === 0) return null;

  return (
    <>
      {nonEmpty.map(([category, entries]) => (
        <section key={category} className="p-3 rounded bg-neutral-900 border border-neutral-800">
          <SectionHeader>{CATEGORY_LABELS[category]}</SectionHeader>
          <div className="font-mono text-xs space-y-0.5">
            {entries.map((entry) => (
              <div key={entry.property}>
                <span className="text-neutral-500">{entry.property}:</span>{' '}
                <span className="text-neutral-300">{entry.value}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function AnimationsList({ animations }: { animations: AnimationData[] }) {
  return (
    <div className="space-y-3">
      {animations.map((anim, i) => (
        <div key={i} className="font-mono text-xs space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-neutral-500">
              {anim.type}
            </span>
            <span className="text-neutral-100 font-semibold">{anim.name}</span>
            <span className="text-neutral-500">
              {anim.duration}ms
              {anim.delay ? ` +${anim.delay}ms delay` : ''}
            </span>
          </div>
          <div className="text-neutral-500">
            {anim.easing} | {anim.playState}
            {anim.currentTime !== null && ` @ ${anim.currentTime.toFixed(0)}ms`}
          </div>
          {anim.keyframes.length > 0 && (
            <div className="ml-2 space-y-0.5">
              {anim.keyframes.map((kf, j) => (
                <div key={j} className="text-neutral-500">
                  {Object.entries(kf).map(([prop, val]) => (
                    <span key={prop} className="mr-2">
                      {prop}: {val}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
