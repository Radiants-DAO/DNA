import { useState } from "react";

/**
 * RightPanel - Designer panel with CSS property sections
 * Sections: Layout, Spacing, Size, Position, Typography, Colors, Borders, Effects
 */

type RightPanelSection =
  | "layout"
  | "spacing"
  | "size"
  | "position"
  | "typography"
  | "colors"
  | "borders"
  | "effects";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <span className="text-text-muted">{icon}</span>
          <span className="text-xs font-medium text-text uppercase tracking-wider">
            {title}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-text-muted transition-transform ${
            isOpen ? "" : "-rotate-90"
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function RightPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("default");

  const icons = {
    layout: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18" />
        <path d="M15 3v18" />
      </svg>
    ),
    spacing: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <rect x="7" y="7" width="10" height="10" rx="1" />
      </svg>
    ),
    size: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 3H3v18" />
        <path d="M21 3v18" />
      </svg>
    ),
    position: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    typography: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
    colors: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    borders: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
    effects: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  };

  if (isCollapsed) {
    return (
      <div className="w-14 bg-surface border-l border-white/5 flex flex-col items-center py-3 gap-1">
        {Object.entries(icons).map(([key, icon]) => (
          <button
            key={key}
            onClick={() => setIsCollapsed(false)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-white/5"
            title={key.charAt(0).toUpperCase() + key.slice(1)}
          >
            {icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-80 bg-surface/50 border-l border-white/5 flex flex-col">
      {/* Header */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-white/5">
        <span className="text-xs font-medium text-text uppercase tracking-wider">
          Properties
        </span>
        <div className="flex items-center gap-2">
          {/* State selector */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-background/50 border border-white/8 rounded-md px-2 py-1 text-xs text-text"
          >
            <option value="default">Default</option>
            <option value="hover">Hover</option>
            <option value="focus">Focus</option>
            <option value="active">Active</option>
          </select>
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-text-muted hover:text-text"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 py-2 border-b border-white/5">
        <div className="text-xs text-text-muted font-mono">
          <span className="hover:text-primary cursor-pointer">div</span>
          <span className="mx-1">{">"}</span>
          <span className="hover:text-primary cursor-pointer">section</span>
          <span className="mx-1">{">"}</span>
          <span className="text-text">button</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        <CollapsibleSection title="Layout" icon={icons.layout}>
          <LayoutSection />
        </CollapsibleSection>

        <CollapsibleSection title="Spacing" icon={icons.spacing}>
          <SpacingSection />
        </CollapsibleSection>

        <CollapsibleSection title="Size" icon={icons.size} defaultOpen={false}>
          <SizeSection />
        </CollapsibleSection>

        <CollapsibleSection title="Position" icon={icons.position} defaultOpen={false}>
          <PositionSection />
        </CollapsibleSection>

        <CollapsibleSection title="Typography" icon={icons.typography} defaultOpen={false}>
          <TypographySection />
        </CollapsibleSection>

        <CollapsibleSection title="Colors" icon={icons.colors}>
          <ColorsSection />
        </CollapsibleSection>

        <CollapsibleSection title="Borders" icon={icons.borders} defaultOpen={false}>
          <BordersSection />
        </CollapsibleSection>

        <CollapsibleSection title="Effects" icon={icons.effects} defaultOpen={false}>
          <EffectsSection />
        </CollapsibleSection>
      </div>

      {/* CSS Output */}
      <div className="border-t border-white/5 p-4">
        <div className="text-xs text-text-muted mb-2">CSS Output</div>
        <div className="bg-background/50 rounded-md p-3 font-mono text-xs text-text-muted max-h-24 overflow-auto">
          <pre>{`.button {
  display: flex;
  padding: 8px 16px;
  background: var(--primary);
}`}</pre>
        </div>
        <button className="mt-2 w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary text-xs rounded-md transition-colors">
          Copy CSS
        </button>
      </div>
    </div>
  );
}

function LayoutSection() {
  const [display, setDisplay] = useState<"block" | "flex" | "grid" | "none">("flex");

  return (
    <div className="space-y-3">
      {/* Display tabs */}
      <div className="flex gap-1 bg-background/50 rounded-md p-0.5">
        {(["block", "flex", "grid", "none"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDisplay(d)}
            className={`flex-1 py-1 text-xs rounded-md transition-colors ${
              display === d
                ? "bg-surface text-text"
                : "text-text-muted hover:text-text"
            }`}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {display === "flex" && (
        <>
          {/* 9-point alignment grid */}
          <div className="flex gap-3 items-center">
            <div className="grid grid-cols-3 gap-1 w-16 h-16 bg-background/50 rounded-md p-1.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <button
                  key={i}
                  className={`w-full h-full rounded-sm ${
                    i === 4
                      ? "bg-primary"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                />
              ))}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-12">Gap</span>
                <input
                  type="text"
                  defaultValue="8"
                  className="flex-1 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SpacingSection() {
  return (
    <div className="space-y-3">
      {/* Chrome DevTools style box model */}
      <div className="relative bg-background/50 rounded-md p-4">
        {/* Margin (outer) */}
        <div className="border border-dashed border-orange-500/50 p-3 rounded-md">
          <div className="absolute top-1 left-2 text-xs text-orange-500/70">margin</div>
          <div className="flex justify-center text-xs text-text-muted mb-1">8</div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">8</span>
            {/* Padding (inner) */}
            <div className="border border-dashed border-green-500/50 p-3 rounded-md flex-1 mx-2">
              <div className="absolute left-8 text-xs text-green-500/70">padding</div>
              <div className="flex justify-center text-xs text-text-muted mb-1">16</div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">16</span>
                {/* Content */}
                <div className="bg-primary/20 rounded-sm px-4 py-2 text-xs text-text">
                  content
                </div>
                <span className="text-xs text-text-muted">16</span>
              </div>
              <div className="flex justify-center text-xs text-text-muted mt-1">16</div>
            </div>
            <span className="text-xs text-text-muted">8</span>
          </div>
          <div className="flex justify-center text-xs text-text-muted mt-1">8</div>
        </div>
      </div>
    </div>
  );
}

function SizeSection() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text-muted block mb-1">Width</label>
          <input
            type="text"
            defaultValue="auto"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Height</label>
          <input
            type="text"
            defaultValue="auto"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text-muted block mb-1">Min W</label>
          <input
            type="text"
            defaultValue="0"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Max W</label>
          <input
            type="text"
            defaultValue="none"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
    </div>
  );
}

function PositionSection() {
  const [position, setPosition] = useState<"static" | "relative" | "absolute" | "fixed" | "sticky">("relative");

  return (
    <div className="space-y-3">
      <div className="flex gap-1 bg-background/50 rounded-md p-0.5 flex-wrap">
        {(["static", "relative", "absolute", "fixed", "sticky"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPosition(p)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              position === p
                ? "bg-surface text-text"
                : "text-text-muted hover:text-text"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      {position !== "static" && (
        <div className="grid grid-cols-2 gap-2">
          {["Top", "Right", "Bottom", "Left"].map((dir) => (
            <div key={dir}>
              <label className="text-xs text-text-muted block mb-1">{dir}</label>
              <input
                type="text"
                defaultValue="auto"
                className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TypographySection() {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-text-muted block mb-1">Font Family</label>
        <input
          type="text"
          defaultValue="Inter, sans-serif"
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text-muted block mb-1">Size</label>
          <input
            type="text"
            defaultValue="14px"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Weight</label>
          <input
            type="text"
            defaultValue="500"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text-muted block mb-1">Line Height</label>
          <input
            type="text"
            defaultValue="1.5"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Letter Spacing</label>
          <input
            type="text"
            defaultValue="0"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
    </div>
  );
}

function ColorsSection() {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-text-muted block mb-1">Background</label>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-md bg-primary border border-white/10 cursor-pointer" />
          <input
            type="text"
            defaultValue="var(--primary)"
            className="flex-1 h-8 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Text Color</label>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-md bg-text border border-white/10 cursor-pointer" />
          <input
            type="text"
            defaultValue="var(--text)"
            className="flex-1 h-8 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
          />
        </div>
      </div>
    </div>
  );
}

function BordersSection() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text-muted block mb-1">Width</label>
          <input
            type="text"
            defaultValue="1px"
            className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Style</label>
          <select className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text">
            <option>solid</option>
            <option>dashed</option>
            <option>dotted</option>
            <option>none</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Color</label>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-md bg-white/10 border border-white/10 cursor-pointer" />
          <input
            type="text"
            defaultValue="rgba(255,255,255,0.1)"
            className="flex-1 h-8 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Radius</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="24"
            defaultValue="8"
            className="flex-1"
          />
          <input
            type="text"
            defaultValue="8px"
            className="w-16 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
    </div>
  );
}

function EffectsSection() {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-text-muted block mb-1">Box Shadow</label>
        <input
          type="text"
          defaultValue="0 2px 8px rgba(0,0,0,0.25)"
          className="w-full h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text font-mono"
        />
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Backdrop Blur</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="40"
            defaultValue="0"
            className="flex-1"
          />
          <input
            type="text"
            defaultValue="0px"
            className="w-16 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-text-muted block mb-1">Opacity</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="100"
            className="flex-1"
          />
          <input
            type="text"
            defaultValue="100%"
            className="w-16 h-7 bg-background/50 border border-white/8 rounded-md px-2 text-xs text-text"
          />
        </div>
      </div>
    </div>
  );
}

export default RightPanel;
