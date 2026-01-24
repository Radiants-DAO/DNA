import { useState, useCallback, useMemo } from "react";

/**
 * AssetsPanel - Icons, Logos, and Images browser for the left panel
 *
 * Port of radflow/devtools AssetsTab adapted for the narrower left panel
 * context in radflow-tauri.
 *
 * Features:
 * - Sub-tabs for Icons, Logos, Images
 * - Grid display with click-to-copy names
 * - Search/filter across all asset types
 * - Icon size selector for Icons tab
 * - Recently used icons section
 */

// ============================================================================
// Types
// ============================================================================

type AssetSubTab = "icons" | "logos" | "images";
type IconSizeOption = 16 | 20 | 24 | 32;

interface AssetItem {
  name: string;
  type: "icon" | "logo" | "image";
  path?: string;
  variant?: string;
  color?: string;
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
// Mock Data
// ============================================================================

const MOCK_ICONS: AssetItem[] = [
  { name: "home", type: "icon" },
  { name: "settings", type: "icon" },
  { name: "user", type: "icon" },
  { name: "search", type: "icon" },
  { name: "menu", type: "icon" },
  { name: "close", type: "icon" },
  { name: "arrow-left", type: "icon" },
  { name: "arrow-right", type: "icon" },
  { name: "chevron-down", type: "icon" },
  { name: "chevron-up", type: "icon" },
  { name: "plus", type: "icon" },
  { name: "minus", type: "icon" },
  { name: "check", type: "icon" },
  { name: "x", type: "icon" },
  { name: "edit", type: "icon" },
  { name: "trash", type: "icon" },
  { name: "copy", type: "icon" },
  { name: "download", type: "icon" },
  { name: "upload", type: "icon" },
  { name: "external-link", type: "icon" },
  { name: "refresh", type: "icon" },
  { name: "filter", type: "icon" },
  { name: "sort", type: "icon" },
  { name: "grid", type: "icon" },
];

const MOCK_LOGOS: AssetItem[] = [
  { name: "logo-primary", type: "logo", variant: "wordmark", color: "light" },
  { name: "logo-dark", type: "logo", variant: "wordmark", color: "dark" },
  { name: "logo-mark", type: "logo", variant: "mark", color: "light" },
  { name: "logo-mark-dark", type: "logo", variant: "mark", color: "dark" },
];

const MOCK_IMAGES: AssetItem[] = [
  { name: "hero-bg.png", type: "image" },
  { name: "pattern.svg", type: "image" },
  { name: "avatar-placeholder.png", type: "image" },
  { name: "empty-state.svg", type: "image" },
];

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
// Tab Button Component
// ============================================================================

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2 py-1 text-[10px] uppercase tracking-wider font-medium rounded transition-colors
        ${active
          ? "bg-primary/20 text-primary"
          : "text-text-muted hover:text-text hover:bg-white/5"
        }
      `}
    >
      {label}
    </button>
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
// Asset Grid Item Component
// ============================================================================

interface AssetGridItemProps {
  asset: AssetItem;
  iconSize?: IconSizeOption;
  copied: boolean;
  onCopy: () => void;
}

function AssetGridItem({ asset, iconSize = 24, copied, onCopy }: AssetGridItemProps) {
  // Render different content based on asset type
  const renderContent = () => {
    switch (asset.type) {
      case "icon":
        return (
          <div
            className="flex items-center justify-center"
            style={{ width: iconSize, height: iconSize }}
          >
            {/* Placeholder icon representation */}
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-text"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        );
      case "logo":
        return (
          <div className="text-text">{Icons.logo}</div>
        );
      case "image":
        return (
          <div className="text-text-muted">{Icons.image}</div>
        );
    }
  };

  return (
    <button
      onClick={onCopy}
      className={`
        relative flex flex-col items-center gap-1.5 p-2 rounded-md border transition-all
        ${copied
          ? "bg-success/20 border-success/50"
          : "bg-white/5 border-border hover:border-primary/50 hover:bg-white/10"
        }
      `}
      title={`Click to copy: ${asset.name}`}
    >
      {/* Asset Preview */}
      <div className="w-full aspect-square flex items-center justify-center">
        {copied ? (
          <span className="text-success">{Icons.check}</span>
        ) : (
          renderContent()
        )}
      </div>

      {/* Asset Name */}
      <span className="text-[9px] text-text-muted truncate w-full text-center">
        {asset.name}
      </span>
    </button>
  );
}

// ============================================================================
// Icons Sub-Tab Content
// ============================================================================

interface IconsContentProps {
  searchQuery: string;
  iconSize: IconSizeOption;
  copiedAsset: string | null;
  onCopy: (name: string) => void;
}

function IconsContent({ searchQuery, iconSize, copiedAsset, onCopy }: IconsContentProps) {
  // Filter icons by search
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_ICONS;
    const query = searchQuery.toLowerCase();
    return MOCK_ICONS.filter((icon) => icon.name.toLowerCase().includes(query));
  }, [searchQuery]);

  // Get recently used from localStorage (simplified mock)
  const recentIcons = useMemo(() => MOCK_ICONS.slice(0, 5), []);

  const handleCopyIcon = (iconName: string) => {
    // Copy JSX code for the icon
    const jsxCode = `<Icon name="${iconName}" size={${iconSize}} />`;
    navigator.clipboard.writeText(jsxCode);
    onCopy(iconName);
  };

  return (
    <div className="space-y-4">
      {/* Recently Used */}
      {recentIcons.length > 0 && !searchQuery && (
        <div className="space-y-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            Recently Used
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {recentIcons.map((icon) => (
              <AssetGridItem
                key={`recent-${icon.name}`}
                asset={icon}
                iconSize={iconSize}
                copied={copiedAsset === icon.name}
                onCopy={() => handleCopyIcon(icon.name)}
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
              <AssetGridItem
                key={icon.name}
                asset={icon}
                iconSize={iconSize}
                copied={copiedAsset === icon.name}
                onCopy={() => handleCopyIcon(icon.name)}
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
  onCopy: (name: string) => void;
}

function LogosContent({ searchQuery, copiedAsset, onCopy }: LogosContentProps) {
  // Filter logos by search
  const filteredLogos = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_LOGOS;
    const query = searchQuery.toLowerCase();
    return MOCK_LOGOS.filter((logo) => logo.name.toLowerCase().includes(query));
  }, [searchQuery]);

  // Group logos by variant
  const groupedLogos = useMemo(() => {
    const groups = new Map<string, AssetItem[]>();
    filteredLogos.forEach((logo) => {
      const variant = logo.variant || "Other";
      const existing = groups.get(variant) || [];
      existing.push(logo);
      groups.set(variant, existing);
    });
    return Array.from(groups.entries());
  }, [filteredLogos]);

  const handleCopyLogo = (logoName: string) => {
    navigator.clipboard.writeText(logoName);
    onCopy(logoName);
  };

  return (
    <div className="space-y-4">
      {groupedLogos.length > 0 ? (
        groupedLogos.map(([variant, logos]) => (
          <div key={variant} className="space-y-2">
            <span className="text-[10px] text-text-muted uppercase tracking-wider capitalize">
              {variant}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {logos.map((logo) => (
                <button
                  key={logo.name}
                  onClick={() => handleCopyLogo(logo.name)}
                  className={`
                    relative flex flex-col items-center gap-1.5 p-3 rounded-md border transition-all
                    ${copiedAsset === logo.name
                      ? "bg-success/20 border-success/50"
                      : "bg-white/5 border-border hover:border-primary/50 hover:bg-white/10"
                    }
                  `}
                  title={`Click to copy: ${logo.name}`}
                >
                  <div className="w-full aspect-[2/1] flex items-center justify-center">
                    {copiedAsset === logo.name ? (
                      <span className="text-success">{Icons.check}</span>
                    ) : (
                      <div className="text-text">{Icons.logo}</div>
                    )}
                  </div>
                  <span className="text-[9px] text-text-muted truncate w-full text-center">
                    {logo.name}
                  </span>
                  {logo.color && (
                    <span className="text-[8px] text-text-muted/60 capitalize">
                      {logo.color}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-4 text-text-muted text-xs">
          No logos match "{searchQuery}"
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Images Sub-Tab Content
// ============================================================================

interface ImagesContentProps {
  searchQuery: string;
  copiedAsset: string | null;
  onCopy: (name: string) => void;
}

function ImagesContent({ searchQuery, copiedAsset, onCopy }: ImagesContentProps) {
  // Filter images by search
  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_IMAGES;
    const query = searchQuery.toLowerCase();
    return MOCK_IMAGES.filter((img) => img.name.toLowerCase().includes(query));
  }, [searchQuery]);

  const handleCopyImage = (imageName: string) => {
    navigator.clipboard.writeText(imageName);
    onCopy(imageName);
  };

  return (
    <div className="space-y-2">
      <span className="text-[10px] text-text-muted uppercase tracking-wider">
        Images ({filteredImages.length})
      </span>
      {filteredImages.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {filteredImages.map((image) => (
            <button
              key={image.name}
              onClick={() => handleCopyImage(image.name)}
              className={`
                relative flex flex-col items-center gap-1.5 p-3 rounded-md border transition-all
                ${copiedAsset === image.name
                  ? "bg-success/20 border-success/50"
                  : "bg-white/5 border-border hover:border-primary/50 hover:bg-white/10"
                }
              `}
              title={`Click to copy: ${image.name}`}
            >
              <div className="w-full aspect-square flex items-center justify-center bg-surface/50 rounded">
                {copiedAsset === image.name ? (
                  <span className="text-success">{Icons.check}</span>
                ) : (
                  <div className="text-text-muted">{Icons.image}</div>
                )}
              </div>
              <span className="text-[9px] text-text-muted truncate w-full text-center">
                {image.name}
              </span>
            </button>
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

  // Handle copy with feedback
  const handleCopy = useCallback((name: string) => {
    setCopiedAsset(name);
    setTimeout(() => setCopiedAsset(null), 1500);
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
        <div className="flex gap-1">
          {subTabs.map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              active={activeSubTab === tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setSearchQuery(""); // Clear search when switching tabs
              }}
            />
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
      <p className="text-[10px] text-text-muted/60 pt-2">
        Click any asset to copy its name to clipboard.
      </p>

      {/* Copied toast */}
      {copiedAsset && (
        <div className="fixed bottom-4 right-4 bg-surface border border-border px-3 py-2 rounded shadow-lg text-xs text-text z-50">
          Copied: {copiedAsset}
        </div>
      )}
    </div>
  );
}

export default AssetsPanel;
