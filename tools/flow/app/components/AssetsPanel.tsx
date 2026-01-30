import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useAppStore } from "../stores/appStore";
import type { IconAsset, LogoAsset, ImageAsset } from "../bindings";

/**
 * AssetsPanel - Icons, Logos, and Images browser for the left panel
 *
 * Loads real assets from theme and project directories via Tauri backend.
 * Theme assets take precedence over project assets.
 *
 * Features:
 * - Sub-tabs for Icons, Logos, Images
 * - Grid display with click-to-copy names
 * - Search/filter across all asset types
 * - Icon size selector for Icons tab
 * - Recently used icons section
 * - Real SVG preview from theme assets
 */

// ============================================================================
// Types
// ============================================================================

type AssetSubTab = "icons" | "logos" | "images";
type IconSizeOption = 16 | 20 | 24 | 32;

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
  search: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
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
// Skeleton Loader
// ============================================================================

function AssetGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-square bg-white/5 border border-border animate-pulse"
          style={{ borderRadius: '8px' }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ type, hasTheme }: { type: string; hasTheme: boolean }) {
  return (
    <div className="text-center py-8 text-text-muted">
      <div className="text-2xl mb-2 opacity-50">
        {type === "icons" && Icons.icon}
        {type === "logos" && Icons.logo}
        {type === "images" && Icons.image}
      </div>
      <p className="text-xs">
        {hasTheme
          ? `No ${type} found in theme`
          : `Open a project to load ${type}`}
      </p>
    </div>
  );
}

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
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted">
        {Icons.search}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-7 pr-2 py-1.5 text-xs text-text bg-surface border border-border rounded outline-none focus:border-primary/50 placeholder:text-text-muted/50"
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
      <span className="text-[10px] text-text-muted mr-1">Size:</span>
      {sizes.map((size) => (
        <button
          key={size}
          onClick={() => onSelect(size)}
          className={`
            w-6 h-5 text-[10px] rounded transition-colors
            ${selected === size
              ? "bg-primary/20 text-primary"
              : "text-text-muted hover:text-text hover:bg-white/5"
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
// Icon Grid Item Component (with real SVG preview)
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
        relative flex flex-col items-center gap-1.5 p-2 border transition-all
        ${copied
          ? "bg-success/20 border-success/50"
          : "bg-white/5 border-border hover:border-primary/50 hover:bg-white/10"
        }
      `}
      style={{ borderRadius: '8px' }}
      title={`Click to copy: ${icon.name}`}
    >
      {/* Icon Preview */}
      <div className="w-full aspect-square flex items-center justify-center">
        {copied ? (
          <span className="text-success">{Icons.check}</span>
        ) : icon.content ? (
          <div
            className="text-current flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
            style={{ width: iconSize, height: iconSize }}
            dangerouslySetInnerHTML={{ __html: icon.content }}
          />
        ) : (
          <div
            className="flex items-center justify-center text-text-muted"
            style={{ width: iconSize, height: iconSize }}
          >
            {Icons.icon}
          </div>
        )}
      </div>

      {/* Icon Name */}
      <span className="text-[9px] text-text-muted truncate w-full text-center">
        {icon.name}
      </span>
    </button>
  );
});

// ============================================================================
// Logo Grid Item Component
// ============================================================================

interface LogoGridItemProps {
  logo: LogoAsset;
  copied: boolean;
  onCopy: () => void;
}

const LogoGridItem = React.memo(function LogoGridItem({ logo, copied, onCopy }: LogoGridItemProps) {
  // SVG content is raw string; raster content is a data URI
  const isSvg = logo.content?.startsWith("<");

  return (
    <button
      onClick={onCopy}
      className={`
        relative flex flex-col items-center gap-1.5 p-3 rounded-md border transition-all
        ${copied
          ? "bg-success/20 border-success/50"
          : "bg-white/5 border-border hover:border-primary/50 hover:bg-white/10"
        }
      `}
      title={`Click to copy: ${logo.name}`}
    >
      <div className="w-full aspect-[2/1] flex items-center justify-center">
        {copied ? (
          <span className="text-success">{Icons.check}</span>
        ) : logo.content ? (
          isSvg ? (
            <div
              className="max-w-full max-h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
              dangerouslySetInnerHTML={{ __html: logo.content }}
            />
          ) : (
            <img src={logo.content} alt={logo.name} className="max-w-full max-h-full object-contain" />
          )
        ) : (
          <div className="text-text-muted">{Icons.logo}</div>
        )}
      </div>
      <span className="text-[9px] text-text-muted truncate w-full text-center">
        {logo.name}
      </span>
    </button>
  );
});

// ============================================================================
// Image Grid Item Component
// ============================================================================

interface ImageGridItemProps {
  image: ImageAsset;
  copied: boolean;
  onCopy: () => void;
}

const ImageGridItem = React.memo(function ImageGridItem({ image, copied, onCopy }: ImageGridItemProps) {
  const isSvg = image.content?.startsWith("<");

  return (
    <button
      onClick={onCopy}
      className={`
        relative flex flex-col items-center gap-1.5 p-3 rounded-md border transition-all
        ${copied
          ? "bg-success/20 border-success/50"
          : "bg-white/5 border-border hover:border-primary/50 hover:bg-white/10"
        }
      `}
      title={`Click to copy: ${image.name}`}
    >
      <div className="w-full aspect-square flex items-center justify-center bg-surface/50 rounded overflow-hidden">
        {copied ? (
          <span className="text-success">{Icons.check}</span>
        ) : image.content ? (
          isSvg ? (
            <div
              className="max-w-full max-h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
              dangerouslySetInnerHTML={{ __html: image.content }}
            />
          ) : (
            <img src={image.content} alt={image.name} className="max-w-full max-h-full object-contain" />
          )
        ) : (
          <div className="text-text-muted">{Icons.image}</div>
        )}
      </div>
      <span className="text-[9px] text-text-muted truncate w-full text-center">
        {image.name}
      </span>
      <span className="text-[8px] text-text-muted/60">
        {image.extension.toUpperCase()}
      </span>
    </button>
  );
});

// ============================================================================
// Icons Sub-Tab Content
// ============================================================================

interface IconsContentProps {
  searchQuery: string;
  iconSize: IconSizeOption;
  copiedAsset: string | null;
  onCopy: (id: string) => void;
}

function IconsContent({ searchQuery, iconSize, copiedAsset, onCopy }: IconsContentProps) {
  // Get icons from store
  const getMergedIcons = useAppStore((s) => s.getMergedIcons);
  const getRecentAssets = useAppStore((s) => s.getRecentAssets);
  const addRecentAsset = useAppStore((s) => s.addRecentAsset);
  const assetsLoading = useAppStore((s) => s.assetsLoading);
  const themeAssets = useAppStore((s) => s.themeAssets);

  const allIcons = getMergedIcons();
  const recentIcons = getRecentAssets();

  // Filter icons by search
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) return allIcons;
    const query = searchQuery.toLowerCase();
    return allIcons.filter((icon) => icon.name.toLowerCase().includes(query));
  }, [allIcons, searchQuery]);

  const handleCopyIcon = (icon: IconAsset) => {
    // Copy JSX code for the icon
    const jsxCode = `<Icon name="${icon.name}" size={${iconSize}} />`;
    navigator.clipboard.writeText(jsxCode);
    addRecentAsset(icon.id);
    onCopy(icon.id);
  };

  // Loading state
  if (assetsLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            Loading Icons...
          </span>
          <AssetGridSkeleton count={15} />
        </div>
      </div>
    );
  }

  // Empty state
  if (allIcons.length === 0) {
    return <EmptyState type="icons" hasTheme={themeAssets !== null} />;
  }

  return (
    <div className="space-y-4">
      {/* Recently Used */}
      {recentIcons.length > 0 && !searchQuery && (
        <div className="space-y-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            Recently Used
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {recentIcons.slice(0, 5).map((icon) => (
              <IconGridItem
                key={`recent-${icon.id}`}
                icon={icon}
                iconSize={iconSize}
                copied={copiedAsset === icon.id}
                onCopy={() => handleCopyIcon(icon)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Icons */}
      <div className="space-y-2">
        <span className="text-[10px] text-text-muted uppercase tracking-wider">
          {searchQuery ? `Results (${filteredIcons.length})` : `All Icons (${filteredIcons.length})`}
        </span>
        {filteredIcons.length > 0 ? (
          <div className="grid grid-cols-5 gap-1.5">
            {filteredIcons.map((icon) => (
              <IconGridItem
                key={icon.id}
                icon={icon}
                iconSize={iconSize}
                copied={copiedAsset === icon.id}
                onCopy={() => handleCopyIcon(icon)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-text-muted text-xs">
            No icons match "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Logos Sub-Tab Content
// ============================================================================

interface LogosContentProps {
  searchQuery: string;
  copiedAsset: string | null;
  onCopy: (id: string) => void;
}

function LogosContent({ searchQuery, copiedAsset, onCopy }: LogosContentProps) {
  // Get logos from store
  const getMergedLogos = useAppStore((s) => s.getMergedLogos);
  const assetsLoading = useAppStore((s) => s.assetsLoading);
  const themeAssets = useAppStore((s) => s.themeAssets);

  const allLogos = getMergedLogos();

  // Filter logos by search
  const filteredLogos = useMemo(() => {
    if (!searchQuery.trim()) return allLogos;
    const query = searchQuery.toLowerCase();
    return allLogos.filter((logo) => logo.name.toLowerCase().includes(query));
  }, [allLogos, searchQuery]);

  const handleCopyLogo = (logo: LogoAsset) => {
    navigator.clipboard.writeText(logo.path);
    onCopy(logo.id);
  };

  // Loading state
  if (assetsLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            Loading Logos...
          </span>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/1] bg-white/5 border border-border animate-pulse rounded-md"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (allLogos.length === 0) {
    return <EmptyState type="logos" hasTheme={themeAssets !== null} />;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="text-[10px] text-text-muted uppercase tracking-wider">
          {searchQuery ? `Results (${filteredLogos.length})` : `Logos (${filteredLogos.length})`}
        </span>
        {filteredLogos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {filteredLogos.map((logo) => (
              <LogoGridItem
                key={logo.id}
                logo={logo}
                copied={copiedAsset === logo.id}
                onCopy={() => handleCopyLogo(logo)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-text-muted text-xs">
            No logos match "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Images Sub-Tab Content
// ============================================================================

interface ImagesContentProps {
  searchQuery: string;
  copiedAsset: string | null;
  onCopy: (id: string) => void;
}

function ImagesContent({ searchQuery, copiedAsset, onCopy }: ImagesContentProps) {
  // Get images from store
  const getMergedImages = useAppStore((s) => s.getMergedImages);
  const assetsLoading = useAppStore((s) => s.assetsLoading);
  const themeAssets = useAppStore((s) => s.themeAssets);

  const allImages = getMergedImages();

  // Filter images by search
  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return allImages;
    const query = searchQuery.toLowerCase();
    return allImages.filter((img) => img.name.toLowerCase().includes(query));
  }, [allImages, searchQuery]);

  const handleCopyImage = (image: ImageAsset) => {
    navigator.clipboard.writeText(image.path);
    onCopy(image.id);
  };

  // Loading state
  if (assetsLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            Loading Images...
          </span>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-white/5 border border-border animate-pulse rounded-md"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (allImages.length === 0) {
    return <EmptyState type="images" hasTheme={themeAssets !== null} />;
  }

  return (
    <div className="space-y-2">
      <span className="text-[10px] text-text-muted uppercase tracking-wider">
        {searchQuery ? `Results (${filteredImages.length})` : `Images (${filteredImages.length})`}
      </span>
      {filteredImages.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {filteredImages.map((image) => (
            <ImageGridItem
              key={image.id}
              image={image}
              copied={copiedAsset === image.id}
              onCopy={() => handleCopyImage(image)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-text-muted text-xs">
          No images match "{searchQuery}"
        </div>
      )}
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

  // Ref for timeout cleanup
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get counts from store for tab badges
  const getMergedIcons = useAppStore((s) => s.getMergedIcons);
  const getMergedLogos = useAppStore((s) => s.getMergedLogos);
  const getMergedImages = useAppStore((s) => s.getMergedImages);
  const assetsError = useAppStore((s) => s.assetsError);

  // Memoize the asset arrays at component level to prevent re-calling getters on every render
  const allIcons = useMemo(() => getMergedIcons(), [getMergedIcons]);
  const allLogos = useMemo(() => getMergedLogos(), [getMergedLogos]);
  const allImages = useMemo(() => getMergedImages(), [getMergedImages]);

  const iconCount = allIcons.length;
  const logoCount = allLogos.length;
  const imageCount = allImages.length;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Handle copy with feedback
  const handleCopy = useCallback((id: string) => {
    // Clear any existing timeout
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    setCopiedAsset(id);
    // Get name for toast
    const asset = [...allIcons, ...allLogos, ...allImages].find((a) => a.id === id);
    setCopiedName(asset?.name ?? id);

    copyTimeoutRef.current = setTimeout(() => {
      setCopiedAsset(null);
      setCopiedName(null);
      copyTimeoutRef.current = null;
    }, 1500);
  }, [allIcons, allLogos, allImages]);

  const subTabs: Array<{ id: AssetSubTab; label: string; count: number }> = [
    { id: "icons", label: "Icons", count: iconCount },
    { id: "logos", label: "Logos", count: logoCount },
    { id: "images", label: "Images", count: imageCount },
  ];

  const iconSizeOptions: IconSizeOption[] = [16, 20, 24, 32];

  return (
    <div className="p-3 space-y-3">
      {/* Error Banner */}
      {assetsError && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
          {assetsError}
        </div>
      )}

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
                setSearchQuery(""); // Clear search when switching tabs
              }}
              className={`
                px-2 py-1 text-[10px] uppercase tracking-wider font-medium rounded transition-colors
                flex items-center gap-1
                ${activeSubTab === tab.id
                  ? "bg-primary/20 text-primary"
                  : "text-text-muted hover:text-text hover:bg-white/5"
                }
              `}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="text-[9px] opacity-60">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Icon Size Selector (only for icons tab) */}
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
          <div id="icons-tabpanel" role="tabpanel" aria-labelledby="icons-tab">
            <IconsContent
              searchQuery={searchQuery}
              iconSize={iconSize}
              copiedAsset={copiedAsset}
              onCopy={handleCopy}
            />
          </div>
        )}
        {activeSubTab === "logos" && (
          <div id="logos-tabpanel" role="tabpanel" aria-labelledby="logos-tab">
            <LogosContent
              searchQuery={searchQuery}
              copiedAsset={copiedAsset}
              onCopy={handleCopy}
            />
          </div>
        )}
        {activeSubTab === "images" && (
          <div id="images-tabpanel" role="tabpanel" aria-labelledby="images-tab">
            <ImagesContent
              searchQuery={searchQuery}
              copiedAsset={copiedAsset}
              onCopy={handleCopy}
            />
          </div>
        )}
      </div>

      {/* Info text */}
      <p className="text-[10px] text-text-muted/60 pt-2">
        Click any asset to copy its path to clipboard.
      </p>

      {/* Copied toast */}
      {copiedAsset && copiedName && (
        <div className="fixed bottom-4 right-4 bg-surface border border-border px-3 py-2 rounded shadow-lg text-xs text-text z-50">
          Copied: {copiedName}
        </div>
      )}
    </div>
  );
}

export default AssetsPanel;
