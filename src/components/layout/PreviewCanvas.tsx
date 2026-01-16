import { useState } from "react";

/**
 * PreviewCanvas - Center area for live component preview
 * Displays component grid or focused component view
 */

export function PreviewCanvas() {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [previewBg, setPreviewBg] = useState<"dark" | "light">("dark");

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Preview Toolbar */}
      <div className="h-10 bg-surface/50 border-b border-white/5 flex items-center justify-between px-4">
        <span className="text-xs text-text-muted">
          {selectedComponent || "Select a component to edit"}
        </span>
        <div className="flex items-center gap-2">
          {/* Background toggle */}
          <div className="flex gap-1 bg-background/50 rounded-md p-0.5">
            <button
              onClick={() => setPreviewBg("dark")}
              className={`w-6 h-6 rounded-md ${
                previewBg === "dark"
                  ? "bg-gray-800 ring-2 ring-primary"
                  : "bg-gray-800"
              }`}
              title="Dark background"
            />
            <button
              onClick={() => setPreviewBg("light")}
              className={`w-6 h-6 rounded-md ${
                previewBg === "light"
                  ? "bg-gray-200 ring-2 ring-primary"
                  : "bg-gray-200"
              }`}
              title="Light background"
            />
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div
        className={`flex-1 overflow-auto p-8 ${
          previewBg === "dark" ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        {selectedComponent ? (
          <FocusedComponentView component={selectedComponent} />
        ) : (
          <ComponentGridView onSelect={setSelectedComponent} />
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-surface/50 border-t border-white/5 flex items-center justify-between px-4">
        <span className="text-xs text-text-muted font-mono">
          src/components/Button.tsx
        </span>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span>Last saved: just now</span>
          <span className="text-green-500">0 errors</span>
        </div>
      </div>
    </div>
  );
}

interface ComponentGridViewProps {
  onSelect: (component: string) => void;
}

function ComponentGridView({ onSelect }: ComponentGridViewProps) {
  const components = [
    { id: "button", name: "Button", category: "Core" },
    { id: "input", name: "Input", category: "Core" },
    { id: "card", name: "Card", category: "Core" },
    { id: "dialog", name: "Dialog", category: "Core" },
    { id: "tabs", name: "Tabs", category: "Core" },
    { id: "badge", name: "Badge", category: "Core" },
  ];

  return (
    <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
      {components.map((comp) => (
        <div
          key={comp.id}
          onClick={() => onSelect(comp.name)}
          className="bg-surface/50 rounded-lg p-6 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
        >
          <div className="h-24 flex items-center justify-center mb-4">
            {/* Placeholder preview */}
            <div className="bg-primary/20 text-primary px-4 py-2 rounded-md text-sm">
              {comp.name}
            </div>
          </div>
          <div className="text-sm font-medium text-text">{comp.name}</div>
          <div className="text-xs text-text-muted">{comp.category}</div>
        </div>
      ))}
    </div>
  );
}

interface FocusedComponentViewProps {
  component: string;
}

function FocusedComponentView({ component }: FocusedComponentViewProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        {/* Component preview placeholder */}
        <div className="bg-surface/50 rounded-lg p-8 mb-4">
          <div className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-medium">
            {component}
          </div>
        </div>
        <p className="text-xs text-text-muted">
          Live component preview - Click elements to select
        </p>
      </div>
    </div>
  );
}

export default PreviewCanvas;
