import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { ScannedImage, ScannedFont, ScannedStylesheet, ScannedScript } from "@flow/shared";
import { Search, RefreshCw, Copy } from "./ui/icons";
import { scanAssets } from "../scanners/assetScanner";
import { onPageNavigated } from "../api/navigationWatcher";

/**
 * AssetsPanel - Page assets browser for the extension panel.
 * Scans images, fonts, stylesheets, and scripts from the inspected page
 * via inspectedWindow.eval().
 */

// ============================================================================
// Types
// ============================================================================

type AssetSubTab = "images" | "fonts" | "stylesheets" | "scripts";

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  search: <Search className="w-3 h-3" />,
  refresh: <RefreshCw className="w-3 h-3" />,
  copy: <Copy className="w-3 h-3" />,
};

// ============================================================================
// Search Input Component
// ============================================================================

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function SearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500">
        {Icons.search}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-7 pr-2 py-1.5 text-xs text-neutral-200 bg-neutral-800 border border-neutral-700 rounded outline-none focus:border-blue-500/50 placeholder:text-neutral-500/50"
        aria-label={placeholder}
      />
    </div>
  );
}

// ============================================================================
// Helper: truncate URL for display
// ============================================================================

function displayUrl(url: string, maxLen = 60): string {
  if (!url) return "(inline)";
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    if (path.length <= maxLen) return path;
    return "..." + path.slice(-maxLen);
  } catch {
    if (url.length <= maxLen) return url;
    return "..." + url.slice(-maxLen);
  }
}

function fileName(url: string): string {
  if (!url) return "(inline)";
  try {
    const parts = new URL(url).pathname.split("/");
    return parts[parts.length - 1] || url;
  } catch {
    const parts = url.split("/");
    return parts[parts.length - 1] || url;
  }
}

// ============================================================================
// Images Tab Content
// ============================================================================

interface ImagesContentProps {
  images: ScannedImage[];
  searchQuery: string;
  onCopy: (text: string) => void;
}

function ImagesContent({ images, searchQuery, onCopy }: ImagesContentProps) {
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return images;
    const q = searchQuery.toLowerCase();
    return images.filter(
      (img) =>
        img.src.toLowerCase().includes(q) ||
        img.alt.toLowerCase().includes(q) ||
        img.tagName.toLowerCase().includes(q)
    );
  }, [images, searchQuery]);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-4 text-neutral-500 text-xs">
        {searchQuery ? `No images match "${searchQuery}"` : "No images found on this page."}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filtered.map((img, i) => (
        <div
          key={`${img.src}-${i}`}
          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-700/50 cursor-pointer group"
          onClick={() => onCopy(img.src)}
          title={img.src}
        >
          {/* Thumbnail */}
          {img.src && !img.isBackground ? (
            <img
              src={img.src}
              alt={img.alt}
              className="w-8 h-8 rounded border border-neutral-600 object-cover shrink-0 bg-neutral-800"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded border border-neutral-600 bg-neutral-800 shrink-0 flex items-center justify-center text-[8px] text-neutral-500">
              {img.isBackground ? "BG" : "IMG"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-neutral-200 truncate">{fileName(img.src)}</div>
            <div className="text-[10px] text-neutral-500">
              {img.naturalWidth > 0
                ? `${img.naturalWidth}×${img.naturalHeight}`
                : img.width > 0
                  ? `${img.width}×${img.height}`
                  : ""}
              {img.alt && <span className="ml-1">alt: {img.alt.slice(0, 20)}</span>}
            </div>
          </div>
          {img.isBackground && (
            <span className="text-[9px] text-purple-400 bg-purple-400/10 px-1 rounded">BG</span>
          )}
          <span className="opacity-0 group-hover:opacity-100 text-neutral-400 transition-opacity">
            {Icons.copy}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Fonts Tab Content
// ============================================================================

interface FontsContentProps {
  fonts: ScannedFont[];
  searchQuery: string;
  onCopy: (text: string) => void;
}

const FONT_SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  "google-fonts": { bg: "bg-blue-400/10", text: "text-blue-400" },
  typekit: { bg: "bg-red-400/10", text: "text-red-400" },
  "self-hosted": { bg: "bg-green-400/10", text: "text-green-400" },
  local: { bg: "bg-neutral-400/10", text: "text-neutral-400" },
};

function FontsContent({ fonts, searchQuery, onCopy }: FontsContentProps) {
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return fonts;
    const q = searchQuery.toLowerCase();
    return fonts.filter(
      (f) =>
        f.family.toLowerCase().includes(q) ||
        f.source.toLowerCase().includes(q)
    );
  }, [fonts, searchQuery]);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-4 text-neutral-500 text-xs">
        {searchQuery ? `No fonts match "${searchQuery}"` : "No fonts found on this page."}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filtered.map((font) => {
        const colors = FONT_SOURCE_COLORS[font.source] ?? FONT_SOURCE_COLORS.local;
        return (
          <div
            key={font.family}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-700/50 cursor-pointer group"
            onClick={() => onCopy(font.family)}
            title={`Click to copy: ${font.family}`}
          >
            <span className="flex-1 text-xs text-neutral-200 truncate">{font.family}</span>
            <span className="text-[10px] text-neutral-500">
              {font.weights.join(", ")}
            </span>
            <span className={`text-[9px] ${colors.bg} ${colors.text} px-1 rounded`}>
              {font.source}
            </span>
            <span className="opacity-0 group-hover:opacity-100 text-neutral-400 transition-opacity">
              {Icons.copy}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Stylesheets Tab Content
// ============================================================================

interface StylesheetsContentProps {
  stylesheets: ScannedStylesheet[];
  searchQuery: string;
  onCopy: (text: string) => void;
}

function StylesheetsContent({ stylesheets, searchQuery, onCopy }: StylesheetsContentProps) {
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return stylesheets;
    const q = searchQuery.toLowerCase();
    return stylesheets.filter((s) => s.url.toLowerCase().includes(q) || s.type.includes(q));
  }, [stylesheets, searchQuery]);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-4 text-neutral-500 text-xs">
        {searchQuery ? `No stylesheets match "${searchQuery}"` : "No stylesheets found."}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filtered.map((ss, i) => (
        <div
          key={`${ss.url || 'inline'}-${i}`}
          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-700/50 cursor-pointer group"
          onClick={() => onCopy(ss.url || `<style> #${i + 1}`)}
          title={ss.url || `Inline style block #${i + 1}`}
        >
          <span className="flex-1 text-xs text-neutral-200 truncate font-mono">
            {ss.url ? displayUrl(ss.url) : `<style> (inline)`}
          </span>
          {ss.type === "inline" && ss.size > 0 && (
            <span className="text-[10px] text-neutral-500">
              {ss.size > 1024 ? `${(ss.size / 1024).toFixed(1)}KB` : `${ss.size}B`}
            </span>
          )}
          <span className={`text-[9px] px-1 rounded ${
            ss.type === "link"
              ? "bg-blue-400/10 text-blue-400"
              : "bg-neutral-400/10 text-neutral-400"
          }`}>
            {ss.type}
          </span>
          <span className="opacity-0 group-hover:opacity-100 text-neutral-400 transition-opacity">
            {Icons.copy}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Scripts Tab Content
// ============================================================================

interface ScriptsContentProps {
  scripts: ScannedScript[];
  searchQuery: string;
  onCopy: (text: string) => void;
}

function ScriptsContent({ scripts, searchQuery, onCopy }: ScriptsContentProps) {
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return scripts;
    const q = searchQuery.toLowerCase();
    return scripts.filter((s) => s.url.toLowerCase().includes(q) || s.type.includes(q));
  }, [scripts, searchQuery]);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-4 text-neutral-500 text-xs">
        {searchQuery ? `No scripts match "${searchQuery}"` : "No scripts found."}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filtered.map((sc, i) => (
        <div
          key={`${sc.url || 'inline'}-${i}`}
          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-700/50 cursor-pointer group"
          onClick={() => onCopy(sc.url || `<script> #${i + 1}`)}
          title={sc.url || `Inline script block #${i + 1}`}
        >
          <span className="flex-1 text-xs text-neutral-200 truncate font-mono">
            {sc.url ? displayUrl(sc.url) : `<script> (inline)`}
          </span>
          <div className="flex items-center gap-1">
            {sc.async && (
              <span className="text-[9px] bg-yellow-400/10 text-yellow-400 px-1 rounded">async</span>
            )}
            {sc.defer && (
              <span className="text-[9px] bg-green-400/10 text-green-400 px-1 rounded">defer</span>
            )}
          </div>
          <span className={`text-[9px] px-1 rounded ${
            sc.type === "external"
              ? "bg-blue-400/10 text-blue-400"
              : "bg-neutral-400/10 text-neutral-400"
          }`}>
            {sc.type}
          </span>
          <span className="opacity-0 group-hover:opacity-100 text-neutral-400 transition-opacity">
            {Icons.copy}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main AssetsPanel Component
// ============================================================================

export function AssetsPanel() {
  const [activeSubTab, setActiveSubTab] = useState<AssetSubTab>("images");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [images, setImages] = useState<ScannedImage[]>([]);
  const [fonts, setFonts] = useState<ScannedFont[]>([]);
  const [stylesheets, setStylesheets] = useState<ScannedStylesheet[]>([]);
  const [scripts, setScripts] = useState<ScannedScript[]>([]);

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runScan = useCallback(() => {
    setLoading(true);
    scanAssets().then((result) => {
      setImages(result.images);
      setFonts(result.fonts);
      setStylesheets(result.stylesheets);
      setScripts(result.scripts);
      setLoading(false);
    });
  }, []);

  // Scan on mount + re-scan on SPA navigation
  useEffect(() => {
    runScan();
    const unsubscribe = onPageNavigated(runScan);
    return unsubscribe;
  }, [runScan]);

  // Cleanup copy timeout
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      setCopiedText(text);
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedText(null);
        copyTimeoutRef.current = null;
      }, 1500);
    });
  }, []);

  const subTabs: Array<{ id: AssetSubTab; label: string; count: number }> = [
    { id: "images", label: "Images", count: images.length },
    { id: "fonts", label: "Fonts", count: fonts.length },
    { id: "stylesheets", label: "CSS", count: stylesheets.length },
    { id: "scripts", label: "JS", count: scripts.length },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2 text-neutral-400">
          <div className="animate-spin">{Icons.refresh}</div>
          <span className="text-xs">Scanning assets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1" role="tablist" aria-label="Asset types">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              id={`${tab.id}-tab`}
              role="tab"
              aria-selected={activeSubTab === tab.id}
              aria-controls={`${tab.id}-tabpanel`}
              onClick={() => {
                setActiveSubTab(tab.id);
                setSearchQuery("");
              }}
              className={`
                px-2 py-1 text-[10px] uppercase tracking-wider font-medium rounded transition-colors
                ${activeSubTab === tab.id
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-700/50"
                }
              `}
            >
              {tab.label}
              <span className="ml-1 text-[9px] opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>

        <button
          onClick={runScan}
          title="Rescan assets"
          className="p-1 rounded hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          {Icons.refresh}
        </button>
      </div>

      {/* Search */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={`Search ${activeSubTab}...`}
      />

      {/* Tab Content */}
      <div className="pt-1">
        {activeSubTab === "images" && (
          <ImagesContent images={images} searchQuery={searchQuery} onCopy={handleCopy} />
        )}
        {activeSubTab === "fonts" && (
          <FontsContent fonts={fonts} searchQuery={searchQuery} onCopy={handleCopy} />
        )}
        {activeSubTab === "stylesheets" && (
          <StylesheetsContent stylesheets={stylesheets} searchQuery={searchQuery} onCopy={handleCopy} />
        )}
        {activeSubTab === "scripts" && (
          <ScriptsContent scripts={scripts} searchQuery={searchQuery} onCopy={handleCopy} />
        )}
      </div>

      {/* Copied toast */}
      {copiedText && (
        <div className="fixed bottom-4 right-4 bg-neutral-800 border border-neutral-600 px-3 py-2 rounded shadow-lg text-xs text-neutral-200 z-50">
          Copied: {copiedText.length > 40 ? copiedText.slice(0, 40) + "..." : copiedText}
        </div>
      )}
    </div>
  );
}

export default AssetsPanel;
