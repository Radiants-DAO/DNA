import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useAppStore } from "../stores/appStore";
import { Search, Check } from "./ui/icons";
import { DogfoodBoundary } from './ui/DogfoodBoundary';

/**
 * AssetsPanel - Icons, Logos, and Images browser for the panel
 * Extension version - shows assets from the page or configured theme.
 *
 * Features:
 * - Sub-tabs for Icons, Logos, Images
 * - Grid display with click-to-copy names
 * - Search/filter across all asset types
 * - Icon size selector for Icons tab
 */

// ============================================================================
// Types
// ============================================================================

type AssetSubTab = "icons" | "logos" | "images";
type IconSizeOption = 16 | 20 | 24 | 32;

interface IconAsset {
  id: string;
  name: string;
  path: string;
  content?: string;
}

interface LogoAsset {
  id: string;
  name: string;
  path: string;
  content?: string;
}

interface ImageAsset {
  id: string;
  name: string;
  path: string;
  extension: string;
  content?: string;
}

// ============================================================================
// Icons (UI Icons for the panel itself)
// ============================================================================

const Icons = {
  copy: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  search: <Search className="w-3 h-3" />,
  check: <Check className="w-3.5 h-3.5" />,
  image: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  logo: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
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
// Size Selector Component
// ============================================================================

interface SizeSelectorProps {
  sizes: IconSizeOption[];
  selected: IconSizeOption;
  onSelect: (size: IconSizeOption) => void;
}

function SizeSelector({ sizes, selected, onSelect }: SizeSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-neutral-500 mr-1">Size:</span>
      {sizes.map((size) => (
        <button
          key={size}
          onClick={() => onSelect(size)}
          className={`
            w-6 h-5 text-[10px] rounded transition-colors
            ${selected === size
              ? "bg-blue-500/20 text-blue-400"
              : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-700/50"
            }
          `}
        >
          {size}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ type }: { type: string }) {
  return (
    <div className="text-center py-8 text-neutral-500">
      <div className="text-2xl mb-2 opacity-50">
        {type === "icons" && Icons.icon}
        {type === "logos" && Icons.logo}
        {type === "images" && Icons.image}
      </div>
      <p className="text-xs">
        No {type} found
      </p>
    </div>
  );
}

// ============================================================================
// Icon Grid Item Component
// ============================================================================

interface IconGridItemProps {
  icon: IconAsset;
  iconSize?: IconSizeOption;
  copied: boolean;
  onCopy: () => void;
}

const IconGridItem = React.memo(function IconGridItem({ icon, iconSize = 24, copied, onCopy }: IconGridItemProps) {
  return (
    <button
      onClick={onCopy}
      className={`
        relative flex flex-col items-center gap-1.5 p-2 border transition-all rounded-lg
        ${copied
          ? "bg-green-500/20 border-green-500/50"
          : "bg-neutral-700/30 border-neutral-700 hover:border-blue-500/50 hover:bg-neutral-700/50"
        }
      `}
      title={`Click to copy: ${icon.name}`}
    >
      <div className="w-full aspect-square flex items-center justify-center">
        {copied ? (
          <span className="text-green-400">{Icons.check}</span>
        ) : (
          <div
            className="flex items-center justify-center text-neutral-400"
            style={{ width: iconSize, height: iconSize }}
          >
            {Icons.icon}
          </div>
        )}
      </div>
      <span className="text-[9px] text-neutral-500 truncate w-full text-center">
        {icon.name}
      </span>
    </button>
  );
});

// ============================================================================
// Content Components
// ============================================================================

interface IconsContentProps {
  searchQuery: string;
  iconSize: IconSizeOption;
  copiedAsset: string | null;
  onCopy: (id: string, name: string) => void;
}

function IconsContent({ searchQuery, iconSize, copiedAsset, onCopy }: IconsContentProps) {
  // Mock icon data
  const mockIcons: IconAsset[] = [
    { id: "icon-1", name: "home", path: "/icons/home.svg" },
    { id: "icon-2", name: "settings", path: "/icons/settings.svg" },
    { id: "icon-3", name: "user", path: "/icons/user.svg" },
    { id: "icon-4", name: "search", path: "/icons/search.svg" },
    { id: "icon-5", name: "menu", path: "/icons/menu.svg" },
    { id: "icon-6", name: "close", path: "/icons/close.svg" },
    { id: "icon-7", name: "check", path: "/icons/check.svg" },
    { id: "icon-8", name: "arrow-left", path: "/icons/arrow-left.svg" },
    { id: "icon-9", name: "arrow-right", path: "/icons/arrow-right.svg" },
    { id: "icon-10", name: "plus", path: "/icons/plus.svg" },
  ];

  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) return mockIcons;
    const query = searchQuery.toLowerCase();
    return mockIcons.filter((icon) => icon.name.toLowerCase().includes(query));
  }, [searchQuery]);

  if (filteredIcons.length === 0) {
    return searchQuery ? (
      <div className="text-center py-4 text-neutral-500 text-xs">
        No icons match "{searchQuery}"
      </div>
    ) : (
      <EmptyState type="icons" />
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
        {searchQuery ? `Results (${filteredIcons.length})` : `All Icons (${filteredIcons.length})`}
      </span>
      <div className="grid grid-cols-5 gap-1.5">
        {filteredIcons.map((icon) => (
          <IconGridItem
            key={icon.id}
            icon={icon}
            iconSize={iconSize}
            copied={copiedAsset === icon.id}
            onCopy={() => onCopy(icon.id, icon.name)}
          />
        ))}
      </div>
    </div>
  );
}

function LogosContent({ searchQuery, copiedAsset, onCopy }: { searchQuery: string; copiedAsset: string | null; onCopy: (id: string, name: string) => void }) {
  // Mock logo data
  const mockLogos: LogoAsset[] = [
    { id: "logo-1", name: "brand-full", path: "/logos/brand-full.svg" },
    { id: "logo-2", name: "brand-mark", path: "/logos/brand-mark.svg" },
  ];

  const filteredLogos = useMemo(() => {
    if (!searchQuery.trim()) return mockLogos;
    const query = searchQuery.toLowerCase();
    return mockLogos.filter((logo) => logo.name.toLowerCase().includes(query));
  }, [searchQuery]);

  if (filteredLogos.length === 0) {
    return <EmptyState type="logos" />;
  }

  return (
    <div className="space-y-2">
      <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
        Logos ({filteredLogos.length})
      </span>
      <div className="grid grid-cols-3 gap-2">
        {filteredLogos.map((logo) => (
          <button
            key={logo.id}
            onClick={() => onCopy(logo.id, logo.name)}
            className={`
              relative flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all
              ${copiedAsset === logo.id
                ? "bg-green-500/20 border-green-500/50"
                : "bg-neutral-700/30 border-neutral-700 hover:border-blue-500/50 hover:bg-neutral-700/50"
              }
            `}
            title={`Click to copy: ${logo.name}`}
          >
            <div className="w-full aspect-[2/1] flex items-center justify-center">
              {copiedAsset === logo.id ? (
                <span className="text-green-400">{Icons.check}</span>
              ) : (
                <div className="text-neutral-400">{Icons.logo}</div>
              )}
            </div>
            <span className="text-[9px] text-neutral-500 truncate w-full text-center">
              {logo.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ImagesContent({ searchQuery, copiedAsset, onCopy }: { searchQuery: string; copiedAsset: string | null; onCopy: (id: string, name: string) => void }) {
  // Mock image data
  const mockImages: ImageAsset[] = [
    { id: "img-1", name: "hero-bg", path: "/images/hero-bg.jpg", extension: "jpg" },
    { id: "img-2", name: "pattern", path: "/images/pattern.png", extension: "png" },
  ];

  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return mockImages;
    const query = searchQuery.toLowerCase();
    return mockImages.filter((img) => img.name.toLowerCase().includes(query));
  }, [searchQuery]);

  if (filteredImages.length === 0) {
    return <EmptyState type="images" />;
  }

  return (
    <div className="space-y-2">
      <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
        Images ({filteredImages.length})
      </span>
      <div className="grid grid-cols-3 gap-2">
        {filteredImages.map((image) => (
          <button
            key={image.id}
            onClick={() => onCopy(image.id, image.name)}
            className={`
              relative flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all
              ${copiedAsset === image.id
                ? "bg-green-500/20 border-green-500/50"
                : "bg-neutral-700/30 border-neutral-700 hover:border-blue-500/50 hover:bg-neutral-700/50"
              }
            `}
            title={`Click to copy: ${image.name}`}
          >
            <div className="w-full aspect-square flex items-center justify-center bg-neutral-800/50 rounded overflow-hidden">
              {copiedAsset === image.id ? (
                <span className="text-green-400">{Icons.check}</span>
              ) : (
                <div className="text-neutral-400">{Icons.image}</div>
              )}
            </div>
            <span className="text-[9px] text-neutral-500 truncate w-full text-center">
              {image.name}
            </span>
            <span className="text-[8px] text-neutral-600">
              {image.extension.toUpperCase()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main AssetsPanel Component
// ============================================================================

export function AssetsPanel() {
  const [activeSubTab, setActiveSubTab] = useState<AssetSubTab>("icons");
  const [searchQuery, setSearchQuery] = useState("");
  const [iconSize, setIconSize] = useState<IconSizeOption>(24);
  const [copiedAsset, setCopiedAsset] = useState<string | null>(null);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback((id: string, name: string) => {
    navigator.clipboard.writeText(name);

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    setCopiedAsset(id);
    setCopiedName(name);

    copyTimeoutRef.current = setTimeout(() => {
      setCopiedAsset(null);
      setCopiedName(null);
      copyTimeoutRef.current = null;
    }, 1500);
  }, []);

  const subTabs: Array<{ id: AssetSubTab; label: string }> = [
    { id: "icons", label: "Icons" },
    { id: "logos", label: "Logos" },
    { id: "images", label: "Images" },
  ];

  const iconSizeOptions: IconSizeOption[] = [16, 20, 24, 32];

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
            </button>
          ))}
        </div>

        {activeSubTab === "icons" && (
          <SizeSelector
            sizes={iconSizeOptions}
            selected={iconSize}
            onSelect={setIconSize}
          />
        )}
      </div>

      {/* Search */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={`Search ${activeSubTab}...`}
      />

      {/* Tab Content */}
      <div className="pt-1">
        {activeSubTab === "icons" && (
          <IconsContent
            searchQuery={searchQuery}
            iconSize={iconSize}
            copiedAsset={copiedAsset}
            onCopy={handleCopy}
          />
        )}
        {activeSubTab === "logos" && (
          <LogosContent
            searchQuery={searchQuery}
            copiedAsset={copiedAsset}
            onCopy={handleCopy}
          />
        )}
        {activeSubTab === "images" && (
          <ImagesContent
            searchQuery={searchQuery}
            copiedAsset={copiedAsset}
            onCopy={handleCopy}
          />
        )}
      </div>

      {/* Info text */}
      <p className="text-[10px] text-neutral-600 pt-2">
        Click any asset to copy its name to clipboard.
      </p>

      {/* Copied toast */}
      {copiedAsset && copiedName && (
        <div className="fixed bottom-4 right-4 bg-neutral-800 border border-neutral-600 px-3 py-2 rounded shadow-lg text-xs text-neutral-200 z-50">
          Copied: {copiedName}
        </div>
      )}
    </div>
  );
}

export default AssetsPanel;
