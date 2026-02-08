/**
 * Shared icon components for spatial canvas.
 * Follows Lucide conventions: 24x24 viewBox, 2px stroke.
 */

export interface IconProps {
  size?: number;
  className?: string;
}

// Base SVG wrapper for consistent icon rendering
function IconBase({
  size = 14,
  className = "",
  children,
}: IconProps & { children: React.ReactNode }): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

// Navigation icons
export function ChevronRight({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <path d="m9 18 6-6-6-6" />
    </IconBase>
  );
}

export function ChevronDown({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

// File type icons
export function FolderIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </IconBase>
  );
}

export function FileIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </IconBase>
  );
}

export function FileCodeIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m10 13-2 2 2 2" />
      <path d="m14 17 2-2-2-2" />
    </IconBase>
  );
}

export function FileJsonIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1" />
      <path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1" />
    </IconBase>
  );
}

export function FileTextIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </IconBase>
  );
}

// Action icons
export function CheckIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <path d="M20 6 9 17l-5-5" />
    </IconBase>
  );
}

export function XIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </IconBase>
  );
}

export function MoreHorizontalIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </IconBase>
  );
}

export function RefreshIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </IconBase>
  );
}

export function SettingsIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

// Zoom icons
export function Plus({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </IconBase>
  );
}

export function Minus({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function Maximize2({ size, className }: IconProps): React.ReactElement {
  return (
    <IconBase size={size} className={className}>
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" x2="14" y1="3" y2="10" />
      <line x1="3" x2="10" y1="21" y2="14" />
    </IconBase>
  );
}

// File extension to icon mapping
const CODE_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "rs", "py", "go", "rb", "java", "c", "cpp", "h", "hpp",
]);

const CONFIG_EXTENSIONS = new Set(["json", "yaml", "yml", "toml"]);

const TEXT_EXTENSIONS = new Set(["md", "mdx", "txt", "rst"]);

export function getFileIcon(
  extension: string | null
): React.ComponentType<IconProps> {
  if (extension === null) {
    return FileIcon;
  }
  if (CODE_EXTENSIONS.has(extension)) {
    return FileCodeIcon;
  }
  if (CONFIG_EXTENSIONS.has(extension)) {
    return FileJsonIcon;
  }
  if (TEXT_EXTENSIONS.has(extension)) {
    return FileTextIcon;
  }
  return FileIcon;
}
