import { useState, useCallback, useEffect, useRef } from "react";
import { sendToContent, onContentMessage } from "../../api/contentBridge";
import { Copy, Check } from "../ui/icons";
import { SearchInput } from "../ui/SearchInput";
import {
  isSearchResponse,
  type SearchResultItem,
} from "@flow/shared";
import { DogfoodBoundary } from '../ui/DogfoodBoundary';

/**
 * SearchPanel - Search for elements by selector, text content, or attributes
 *
 * Features:
 * - CSS selector search
 * - Text content search
 * - Attribute search
 * - Results list with element info
 * - Click to select element
 */

// ============================================================================
// Types
// ============================================================================

type SearchMode = "selector" | "text" | "attribute";

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  copy: <Copy className="w-3 h-3" />,
  check: <Check className="w-3 h-3" />,
  element: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
};

// ============================================================================
// Mode Selector
// ============================================================================

interface ModeSelectorProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}

function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const modes: Array<{ id: SearchMode; label: string }> = [
    { id: "selector", label: "Selector" },
    { id: "text", label: "Text" },
    { id: "attribute", label: "Attr" },
  ];

  return (
    <div className="flex gap-1">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => onModeChange(m.id)}
          className={`px-2 py-1 text-[10px] rounded transition-colors ${
            mode === m.id
              ? "bg-blue-500/20 text-blue-400"
              : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-700/50"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Result Row Component
// ============================================================================

interface ResultRowProps {
  result: SearchResultItem;
  onSelect: () => void;
  onCopy: () => void;
  copied: boolean;
}

function ResultRow({ result, onSelect, onCopy, copied }: ResultRowProps) {
  return (
    <div
      className="flex items-start gap-2 px-2 py-2 rounded hover:bg-neutral-700/50 cursor-pointer group border-b border-neutral-700/50 last:border-0"
      onClick={onSelect}
    >
      <span className="text-blue-400 mt-0.5 shrink-0">{Icons.element}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-neutral-200">
            {result.tagName.toLowerCase()}
          </span>
          {result.id && (
            <span className="text-[10px] text-green-400">#{result.id}</span>
          )}
          {result.classList.length > 0 && (
            <span className="text-[10px] text-yellow-400/70 truncate">
              .{result.classList.slice(0, 2).join(".")}
              {result.classList.length > 2 && "..."}
            </span>
          )}
        </div>
        {result.textPreview && (
          <p className="text-[10px] text-neutral-500 truncate mt-0.5">
            {result.textPreview}
          </p>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCopy();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-neutral-200 rounded hover:bg-neutral-600/50 transition-all"
        title="Copy selector"
      >
        {copied ? (
          <span className="text-green-400">{Icons.check}</span>
        ) : (
          Icons.copy
        )}
      </button>
    </div>
  );
}

// ============================================================================
// Main SearchPanel Component
// ============================================================================

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("selector");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup copy timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Listen for search results from content script
  useEffect(() => {
    const cleanup = onContentMessage((message: unknown) => {
      if (isSearchResponse(message)) {
        setResults(message.payload.results);
        setLoading(false);
      }
    });

    return cleanup;
  }, []);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setResults([]);

    sendToContent({
      type: "panel:search",
      payload: {
        query: query.trim(),
        mode,
      },
    });

    // Real results come via onContentMessage callback
  }, [query, mode]);

  const handleSelect = useCallback((result: SearchResultItem) => {
    sendToContent({
      type: "panel:inspect",
      payload: { selector: result.selector },
    });
  }, []);

  const handleCopy = useCallback((index: number, selector: string) => {
    navigator.clipboard.writeText(selector);
    setCopiedIndex(index);

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedIndex(null);
    }, 1500);
  }, []);

  const getPlaceholder = () => {
    switch (mode) {
      case "selector":
        return "Enter CSS selector...";
      case "text":
        return "Search by text content...";
      case "attribute":
        return "Search by attribute value...";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 space-y-2 border-b border-neutral-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-200">
            Element Search
          </span>
          <ModeSelector mode={mode} onModeChange={setMode} />
        </div>

        <SearchInput
          value={query}
          onChange={setQuery}
          onSubmit={handleSearch}
          placeholder={getPlaceholder()}
          loading={loading}
        />

        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className="w-full py-1.5 text-xs font-medium rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {results.length > 0 ? (
          <div className="p-2">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2 px-2">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </div>
            {results.map((result, index) => (
              <ResultRow
                key={index}
                result={result}
                onSelect={() => handleSelect(result)}
                onCopy={() => handleCopy(index, result.selector)}
                copied={copiedIndex === index}
              />
            ))}
          </div>
        ) : searched && !loading ? (
          <div className="p-4 text-center text-neutral-500 text-xs">
            No elements found matching "{query}"
          </div>
        ) : (
          <div className="p-4 text-center text-neutral-500 text-xs">
            Enter a search query and click Search to find elements on the page.
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="p-3 border-t border-neutral-700">
        <p className="text-[10px] text-neutral-600">
          {mode === "selector" && "Use any valid CSS selector (e.g., .class, #id, div > p)"}
          {mode === "text" && "Search for elements containing specific text"}
          {mode === "attribute" && "Find elements by attribute value (e.g., data-testid)"}
        </p>
      </div>
    </div>
  );
}

export default SearchPanel;
