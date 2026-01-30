/**
 * Radiants Core Icons
 *
 * Inline SVG React components for pixel-art icons.
 * 16x16 grid with currentColor for theming.
 *
 * Names follow lucide-react conventions for easy migration.
 */

import type { IconProps } from './types';

// Helper to create icon components
function createIcon(
  displayName: string,
  path: string,
  viewBox = '0 0 16 16'
) {
  const Icon = ({ size = 16, className = '', ...props }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d={path} />
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
}

// ============================================================================
// Navigation & Actions
// ============================================================================

/** X / Close icon */
export const X = createIcon(
  'X',
  'M3,4H5V5H6V6H7V7H9V6H10V5H11V4H13V6H12V7H11V8H10V10H11V11H12V12H13V14H11V13H10V12H9V11H7V12H6V13H5V14H3V12H4V11H5V10H6V8H5V7H4V6H3V4Z'
);

/** Check / Checkmark icon */
export const Check = createIcon(
  'Check',
  'M2,8H4V9H5V10H7V9H8V8H9V7H10V6H11V5H12V4H14V6H13V7H12V8H11V9H10V10H9V11H8V12H7V13H5V12H4V11H3V10H2V8Z'
);

/** Plus icon */
export const Plus = createIcon('Plus', 'M3,7H7V3H9V7H13V9H9V13H7V9H3V7Z');

/** Minus icon */
export const Minus = createIcon('Minus', 'M3,7H13V9H3V7Z');

/** ChevronDown icon */
export const ChevronDown = createIcon(
  'ChevronDown',
  'M1,6H3V7H4V8H5V9H6V10H7V11H9V10H10V9H11V8H12V7H13V6H15V8H14V9H13V10H12V11H11V12H10V13H9V14H7V13H6V12H5V11H4V10H3V9H2V8H1V6Z'
);

/** ChevronUp icon */
export const ChevronUp = createIcon(
  'ChevronUp',
  'M1,10H3V9H4V8H5V7H6V6H7V5H9V6H10V7H11V8H12V9H13V10H15V8H14V7H13V6H12V5H11V4H10V3H9V2H7V3H6V4H5V5H4V6H3V7H2V8H1V10Z'
);

/** ChevronLeft icon */
export const ChevronLeft = createIcon(
  'ChevronLeft',
  'M10,1H9V3H8V4H7V5H6V6H5V7H4V9H5V10H6V11H7V12H8V13H9V15H10V13H9V12H8V11H7V10H6V9V7H7V6H8V5H9V4H10V1Z'
);

/** ChevronRight icon */
export const ChevronRight = createIcon(
  'ChevronRight',
  'M6,1H7V3H8V4H9V5H10V6H11V7H12V9H11V10H10V11H9V12H8V13H7V15H6V13H7V12H8V11H9V10H10V9V7H9V6H8V5H7V4H6V1Z'
);

/** RefreshCw / Refresh icon */
export const RefreshCw = createIcon(
  'RefreshCw',
  'M2,8H3V7H4V6H5V7H6V8H7V9H6V10H7V11H12V12H11V13H6V12H5V11H4V9H2V8ZM4,4H5V3H10V4H11V5H12V7H14V8H13V9H12V10H11V9H10V8H9V7H10V6H9V5H4V4Z'
);

/** RotateCcw icon (alias for RefreshCw) */
export const RotateCcw = RefreshCw;

// ============================================================================
// Editor Modes
// ============================================================================

/** MousePointer2 / Cursor icon */
export const MousePointer2 = createIcon(
  'MousePointer2',
  'M4,1H5V2H6V3H7V4H8V5H9V6H10V7H11V8H12V9H9V11H10V13H11V15H9V14H8V12H7V10H6V11H5V12H4V1Z'
);

/** Type / Text cursor icon */
export const Type = createIcon(
  'Type',
  'M3,2H6V3H3V2ZM3,13H6V14H3V13ZM6,3H9V4H8V12H9V13H6V12H7V4H6V3ZM9,2H12V3H9V2ZM9,13H12V14H9V13Z'
);

/** Pencil / Edit icon */
export const Pencil = createIcon(
  'Pencil',
  'M11,1H12V2H13V3H14V5H13V6H12V7H11V8H10V9H9V10H8V11H7V12H6V13H5V14H4V15H2V14H1V12H2V11H3V10H4V9H5V8H6V7H7V6H8V5H9V4H10V3H11V1ZM5,10V11H6V10H5ZM9,5V6H10V5H9Z'
);

/** Hand / Pan icon */
export const Hand = createIcon(
  'Hand',
  'M4,7H5V4H7V7H8V3H10V7H11V4H13V9H12V11H11V13H10V14H5V13H4V11H3V9H4V7Z'
);

// ============================================================================
// Comments & Feedback
// ============================================================================

/** MessageSquare / Comment bubble icon */
export const MessageSquare = createIcon(
  'MessageSquare',
  'M2,13H3V14H2V13ZM3,11H4V4H5V3H13V4H14V11H13V12H5V13H3V11Z'
);

/** MessageCircle (alias for MessageSquare) */
export const MessageCircle = MessageSquare;

/** HelpCircle / Question mark icon */
export const HelpCircle = createIcon(
  'HelpCircle',
  'M4,4H5V3H6V2H11V3H12V4H13V7H12V8H10V9H9V10H7V8H8V7H10V6H11V5H10V4H7V5H6V6H4V4ZM7,12H9V14H7V12Z'
);

/** CircleHelp (alias for HelpCircle) */
export const CircleHelp = HelpCircle;

// ============================================================================
// Clipboard & Copy
// ============================================================================

/** Copy / CopyToClipboard icon */
export const Copy = createIcon(
  'Copy',
  'M3,4H4V13H12V4H13V14H3V4ZM4,3H5V4H4V3ZM5,5H6V6H10V5H11V12H5V5ZM6,7V8H10V7H6ZM6,9V10H10V9H6ZM6,3H7V4H9V3H10V5H6V3ZM7,2H9V3H7V2ZM11,3H12V4H11V3Z'
);

/** ClipboardCopy (alias for Copy) */
export const ClipboardCopy = Copy;

/** Clipboard icon */
export const Clipboard = Copy;

/** ClipboardCheck / Copied icon */
export const ClipboardCheck = createIcon(
  'ClipboardCheck',
  'M2,3H3V13H2V3ZM3,2H5V3H3V2ZM3,13H12V14H3V13ZM4,5H11V6H5V11H7V12H4V5ZM5,1H10V2H9V3H10V4H5V3H6V2H5V1ZM6,8H7V9H6V8ZM7,9H8V10H7V9ZM8,10H9V11H8V10ZM9,9H10V10H9V9ZM10,2H12V3H10V2ZM10,8H11V9H10V8ZM10,11H11V12H10V11ZM11,7H12V8H11V7ZM12,3H13V5H12V3ZM12,6H13V7H12V6ZM12,8H13V13H12V8ZM13,5H14V6H13V5Z'
);

/** CopiedIcon (alias for ClipboardCheck) */
export const CopiedIcon = ClipboardCheck;

// ============================================================================
// Files & Folders
// ============================================================================

/** File / Document icon */
export const File = createIcon(
  'File',
  'M3,2H10V3H11V4H12V5H13V14H3V2ZM4,3V13H12V6H10V5H9V3H4Z'
);

/** FileText icon */
export const FileText = createIcon(
  'FileText',
  'M3,2H10V3H11V4H12V5H13V14H3V2ZM4,3V13H12V6H10V5H9V3H4ZM5,8H11V9H5V8ZM5,10H11V11H5V10Z'
);

/** Folder icon */
export const Folder = createIcon(
  'Folder',
  'M2,4H7V5H14V13H2V4ZM3,5V12H13V6H6V5H3Z'
);

/** FolderOpen icon */
export const FolderOpen = createIcon(
  'FolderOpen',
  'M1,3H7V4H12V5H5V6H4V8H3V10H2V12H1V3ZM2,12H3V10H4V8H5V6H15V7H14V9H13V11H12V13H2V12Z'
);

/** FolderTree icon */
export const FolderTree = FolderOpen;

// ============================================================================
// UI Elements
// ============================================================================

/** Menu / Hamburger icon */
export const Menu = createIcon(
  'Menu',
  'M2,4H14V6H2V4ZM2,7H14V9H2V7ZM2,10H14V12H2V10Z'
);

/** MoreHorizontal icon */
export const MoreHorizontal = createIcon(
  'MoreHorizontal',
  'M2,7H4V9H2V7ZM7,7H9V9H7V7ZM12,7H14V9H12V7Z'
);

/** MoreVertical icon */
export const MoreVertical = createIcon(
  'MoreVertical',
  'M7,2H9V4H7V2ZM7,7H9V9H7V7ZM7,12H9V14H7V12Z'
);

/** Settings / Cog icon */
export const Settings = createIcon(
  'Settings',
  'M2,7H4V5H3V3H5V4H7V2H9V4H11V3H13V5H12V7H14V9H12V11H13V13H11V12H9V14H7V12H5V13H3V11H4V9H2V7ZM6,7V9H7V10H9V9H10V7H9V6H7V7H6Z'
);

/** Settings2 (alias for Settings) */
export const Settings2 = Settings;

/** Sliders icon */
export const Sliders = createIcon(
  'Sliders',
  'M3,3H5V5H3V3ZM5,4H13V6H5V4ZM3,10H13V12H3V10ZM11,9H13V11H11V9Z'
);

/** SlidersHorizontal (alias for Sliders) */
export const SlidersHorizontal = Sliders;

// ============================================================================
// View Modes
// ============================================================================

/** Eye icon */
export const Eye = createIcon(
  'Eye',
  'M1,8H2V9H1V8ZM2,7H3V8H2V7ZM2,9H3V10H2V9ZM3,6H5V7H3V6ZM3,10H5V11H3V10ZM5,5H11V6H5V5ZM5,11H11V12H5V11ZM6,7H8V8H7V9H6V7ZM7,9H9V10H7V9ZM9,7H10V9H9V7ZM11,6H13V7H11V6ZM11,10H13V11H11V10ZM13,7H14V8H13V7ZM13,9H14V10H13V9ZM14,8H15V9H14V8Z'
);

/** EyeOff icon */
export const EyeOff = createIcon(
  'EyeOff',
  'M1,8H2V9H1V8ZM2,7H3V8H2V7ZM2,9H3V10H2V9ZM3,6H5V7H3V6ZM3,10H5V11H3V10ZM4,13H5V14H4V13ZM5,5H10V6H5V5ZM5,12H6V13H5V12ZM6,7H8V8H7V9H6V7ZM6,11H7V12H6V11ZM7,10H8V11H7V10ZM8,9H9V10H8V9ZM8,11H11V12H8V11ZM9,8H10V9H9V8ZM10,7H11V8H10V7ZM11,6H12V7H11V6ZM11,10H13V11H11V10ZM12,5H13V6H12V5ZM13,4H14V5H13V4ZM13,7H14V8H13V7ZM13,9H14V10H13V9ZM14,8H15V9H14V8Z'
);

/** Play icon */
export const Play = createIcon(
  'Play',
  'M6,4H8V5H9V6H10V7H11V8H12V9H11V10H10V11H9V12H8V13H6V4Z'
);

/** Pause icon */
export const Pause = createIcon('Pause', 'M4,3H7V13H4V3ZM9,3H12V13H9V3Z');

/** Square / Stop icon */
export const Square = createIcon('Square', 'M3,3H13V13H3V3ZM4,4V12H12V4H4Z');

// ============================================================================
// Design Tools
// ============================================================================

/** Palette / Colors icon (using settings-cog as close match) */
export const Palette = createIcon(
  'Palette',
  'M2,7H4V5H3V3H5V4H7V2H9V4H11V3H13V5H12V7H14V9H12V11H13V13H11V12H9V14H7V12H5V13H3V11H4V9H2V7ZM6,7V9H7V10H9V9H10V7H9V6H7V7H6Z'
);

/** Paintbrush icon */
export const Paintbrush = Pencil;

/** Pipette / Eyedropper icon */
export const Pipette = createIcon(
  'Pipette',
  'M11,1H13V2H14V4H13V5H12V6H11V7H10V8H9V9H8V10H7V11H6V12H5V13H4V14H2V13H1V11H2V10H3V9H4V8H5V7H6V6H7V5H8V4H9V3H10V2H11V1Z'
);

/** Wand2 / Magic icon */
export const Wand2 = createIcon(
  'Wand2',
  'M4,7H5V5H6V3H7V2H12V4H11V5H10V6H9V7H12V9H11V10H10V11H9V12H8V13H7V14H6V12H7V10H8V9H4V7Z'
);

/** Sparkles icon (using electric/lightning) */
export const Sparkles = Wand2;

// ============================================================================
// Layout
// ============================================================================

/** Layout icon (using windows) */
export const Layout = createIcon(
  'Layout',
  'M2,3H14V13H2V3ZM3,4V12H7V4H3ZM8,4V7H13V4H8ZM8,8V12H13V8H8Z'
);

/** LayoutGrid icon */
export const LayoutGrid = createIcon(
  'LayoutGrid',
  'M2,2H7V7H2V2ZM2,9H7V14H2V9ZM9,2H14V7H9V2ZM9,9H14V14H9V9Z'
);

/** Grid3X3 icon */
export const Grid3X3 = createIcon(
  'Grid3X3',
  'M2,2H5V5H2V2ZM2,6H5V10H2V6ZM2,11H5V14H2V11ZM6,2H10V5H6V2ZM6,6H10V10H6V6ZM6,11H10V14H6V11ZM11,2H14V5H11V2ZM11,6H14V10H11V6ZM11,11H14V14H11V11Z'
);

/** Columns icon */
export const Columns = createIcon(
  'Columns',
  'M2,2H7V14H2V2ZM9,2H14V14H9V2Z'
);

/** Rows icon */
export const Rows = createIcon('Rows', 'M2,2H14V7H2V2ZM2,9H14V14H2V9Z');

/** AlignLeft icon */
export const AlignLeft = createIcon(
  'AlignLeft',
  'M2,3H14V5H2V3ZM2,7H10V9H2V7ZM2,11H14V13H2V11Z'
);

/** AlignCenter icon */
export const AlignCenter = createIcon(
  'AlignCenter',
  'M2,3H14V5H2V3ZM4,7H12V9H4V7ZM2,11H14V13H2V11Z'
);

/** AlignRight icon */
export const AlignRight = createIcon(
  'AlignRight',
  'M2,3H14V5H2V3ZM6,7H14V9H6V7ZM2,11H14V13H2V11Z'
);

/** AlignJustify icon */
export const AlignJustify = createIcon(
  'AlignJustify',
  'M2,3H14V5H2V3ZM2,7H14V9H2V7ZM2,11H14V13H2V11Z'
);

// ============================================================================
// Typography
// ============================================================================

/** Bold icon */
export const Bold = createIcon(
  'Bold',
  'M3,2H10V3H11V4H12V6H11V7H10V8H11V9H12V11H11V12H10V13H3V2ZM5,4V6H9V5H10V4H5ZM5,8V11H9V10H10V9H9V8H5Z'
);

/** Italic icon */
export const Italic = createIcon(
  'Italic',
  'M7,2H13V4H11V3H10V6H9V10H10V13H11V12H13V14H7V12H9V13H10V10H11V6H10V3H9V4H7V2Z'
);

/** Underline icon */
export const Underline = createIcon(
  'Underline',
  'M3,2H6V9H5V10H6V11H10V10H11V9H10V2H13V9H12V10H11V11H10V12H6V11H5V10H4V9H3V2ZM3,13H13V15H3V13Z'
);

/** Strikethrough icon */
export const Strikethrough = createIcon(
  'Strikethrough',
  'M4,2H12V4H9V7H7V4H4V2ZM2,8H14V9H2V8ZM7,10H9V13H12V15H4V13H7V10Z'
);

// ============================================================================
// Status
// ============================================================================

/** AlertCircle icon */
export const AlertCircle = createIcon(
  'AlertCircle',
  'M5,2H11V3H12V4H13V5H14V11H13V12H12V13H11V14H5V13H4V12H3V11H2V5H3V4H4V3H5V2ZM7,4V9H9V4H7ZM7,10V12H9V10H7Z'
);

/** AlertTriangle / Warning icon */
export const AlertTriangle = createIcon(
  'AlertTriangle',
  'M2,11H3V9H4V7H5V5H6V8H7V10H9V8H10V5H11V7H12V9H13V11H14V13H13V14H3V13H2V11ZM7,11V13H9V11H7ZM6,3H7V2H9V3H10V5H9V4H7V5H6V3Z'
);

/** Info icon */
export const Info = createIcon(
  'Info',
  'M7,2H9V4H7V2ZM6,5H9V12H10V13H6V12H7V6H6V5Z'
);

/** CheckCircle icon */
export const CheckCircle = createIcon(
  'CheckCircle',
  'M5,2H11V3H12V4H13V5H14V11H13V12H12V13H11V14H5V13H4V12H3V11H2V5H3V4H4V3H5V2ZM4,8H6V9H7V10H9V9H10V8H11V7H12V5H10V6H9V7H8V8H7V7H6V6H4V8Z'
);

/** XCircle icon */
export const XCircle = createIcon(
  'XCircle',
  'M5,2H11V3H12V4H13V5H14V11H13V12H12V13H11V14H5V13H4V12H3V11H2V5H3V4H4V3H5V2ZM5,5H6V6H7V7H8V8H9V7H10V6H11V5H10V6H9V7H8V6H7V5H6V4H5V5ZM5,10H6V9H7V8H8V9H9V10H10V11H9V10H8V9H7V10H6V11H5V10Z'
);

// ============================================================================
// Content
// ============================================================================

/** Image icon */
export const Image = createIcon(
  'Image',
  'M2,3H14V13H2V3ZM3,4V10L5,8L7,10L10,7L13,10V4H3ZM5,5V7H7V5H5Z'
);

/** Video icon */
export const Video = createIcon(
  'Video',
  'M1,4H11V5H12V6H13V7H14V9H13V10H12V11H11V12H1V4ZM2,5V11H10V5H2Z'
);

/** Music icon */
export const Music = createIcon(
  'Music',
  'M6,2H14V10H12V11H11V12H10V11H11V10H12V4H8V12H6V13H5V14H4V13H5V12H6V2ZM3,11H5V13H3V11Z'
);

/** Link icon */
export const Link = createIcon(
  'Link',
  'M6,5H8V6H6V5ZM8,6H9V7H8V6ZM9,7H10V9H9V7ZM6,7H7V9H6V7ZM7,9H9V10H7V9ZM9,10H10V11H9V10ZM10,6H12V7H10V6ZM4,9H6V10H4V9ZM6,10H8V11H6V10Z'
);

/** ExternalLink icon */
export const ExternalLink = createIcon(
  'ExternalLink',
  'M3,3H8V5H5V11H11V8H13V13H3V3ZM9,3H13V7H11V5H9V3ZM9,5H10V6H9V5ZM10,6H11V7H10V6Z'
);

// ============================================================================
// Common Actions
// ============================================================================

/** Trash icon */
export const Trash = createIcon(
  'Trash',
  'M2,4H5V3H6V4H9V3H10V4H13V5H2V4ZM3,6H12V13H11V14H4V13H3V6ZM4,7V12H5V7H4ZM6,7V12H7V7H6ZM8,7V12H9V7H8ZM10,7V12H11V7H10ZM6,2H9V3H6V2Z'
);

/** Trash2 (alias for Trash) */
export const Trash2 = Trash;

/** Edit icon (alias for Pencil) */
export const Edit = Pencil;

/** Edit2 (alias for Pencil) */
export const Edit2 = Pencil;

/** Save icon */
export const Save = createIcon(
  'Save',
  'M2,2H11V3H12V4H13V5H14V14H2V2ZM3,3V13H13V6H11V3H3ZM4,4H6V7H10V4H4ZM5,9H11V12H5V9Z'
);

/** Download icon */
export const Download = createIcon(
  'Download',
  'M7,2H9V8H11V9H10V10H9V11H7V10H6V9H5V8H7V2ZM2,11H5V12H11V11H14V14H2V11Z'
);

/** Upload icon */
export const Upload = createIcon(
  'Upload',
  'M7,5H9V11H7V5ZM6,7H7V8H6V7ZM9,7H10V8H9V7ZM5,8H6V9H5V8ZM10,8H11V9H10V8ZM2,11H5V12H11V11H14V14H2V11Z'
);

/** Share icon */
export const Share = createIcon(
  'Share',
  'M10,2H14V6H13V4H11V5H10V6H9V7H7V5H8V4H9V3H10V2ZM2,6H8V8H4V12H12V8H14V14H2V6Z'
);

// ============================================================================
// Misc
// ============================================================================

/** Book icon */
export const Book = createIcon(
  'Book',
  'M2,2H8V3H9V13H8V14H2V2ZM3,3V13H8V4H3ZM7,14H8V13H14V2H8V3H7V14ZM9,4H13V13H9V4Z'
);

/** BookOpen icon */
export const BookOpen = Book;

/** Layers icon */
export const Layers = createIcon(
  'Layers',
  'M8,1H9V2H10V3H11V4H12V5H13V6H8V5H7V4H6V3H5V2H8V1ZM3,6H13V7H12V8H11V9H10V10H9V11H8V10H7V9H6V8H5V7H4V6H3ZM3,10H13V11H12V12H11V13H10V14H6V13H5V12H4V11H3V10Z'
);

/** Component icon */
export const Component = createIcon(
  'Component',
  'M7,1H9V3H11V5H13V7H15V9H13V11H11V13H9V15H7V13H5V11H3V9H1V7H3V5H5V3H7V1ZM8,4V6H6V8H4V10H6V12H8V10H10V8H12V6H10V4H8Z'
);

/** Code icon */
export const Code = createIcon(
  'Code',
  'M4,5H5V6H6V7H5V8H4V9H5V10H6V11H5V10H4V9H3V8V7H4V6H3V5H4ZM10,5H11V6H12V7H11V8H10V9H11V10H12V11H11V10H10V9H9V8V7H10V6H9V5H10ZM6,11H7V12H8V13H9V12H10V13H9V14H8V13H7V12H6V11Z'
);

/** Terminal icon */
export const Terminal = createIcon(
  'Terminal',
  'M2,2H14V14H2V2ZM3,3V13H13V3H3ZM4,5H5V6H6V7H7V8H6V9H5V10H4V9H5V8H4V7H5V6H4V5ZM8,9H12V10H8V9Z'
);

/** Zap / Lightning icon */
export const Zap = createIcon(
  'Zap',
  'M4,7H5V5H6V3H7V2H12V4H11V5H10V6H9V7H12V9H11V10H10V11H9V12H8V13H7V14H6V12H7V10H8V9H4V7Z'
);

/** Globe icon */
export const Globe = createIcon(
  'Globe',
  'M5,2H11V3H12V4H13V5H14V11H13V12H12V13H11V14H5V13H4V12H3V11H2V5H3V4H4V3H5V2ZM6,4H7V6H6V4ZM7,6H9V8H7V6ZM9,4H10V6H9V4ZM9,8H10V10H9V8ZM10,10H12V11H10V10ZM4,10H6V11H4V10Z'
);

/** Search icon */
export const Search = createIcon(
  'Search',
  'M5,2H10V3H11V4H12V9H11V10H10V11H9V12H10V13H11V14H12V15H10V14H9V13H8V12H5V11H4V10H3V9H2V4H3V3H4V2H5ZM4,4V9H5V10H10V9H11V4H10V3H5V4H4Z'
);

/** Filter icon */
export const Filter = createIcon(
  'Filter',
  'M2,3H14V5H13V6H12V7H11V8H10V9H9V14H7V9H6V8H5V7H4V6H3V5H2V3Z'
);

/** SortAsc icon */
export const SortAsc = createIcon(
  'SortAsc',
  'M4,2H6V12H8V13H7V14H5V13H4V12H2V11H4V2ZM9,3H14V5H9V3ZM9,7H13V9H9V7ZM9,11H11V13H9V11Z'
);

/** SortDesc icon */
export const SortDesc = createIcon(
  'SortDesc',
  'M4,2H6V12H8V13H7V14H5V13H4V12H2V11H4V2ZM9,3H11V5H9V3ZM9,7H13V9H9V7ZM9,11H14V13H9V11Z'
);

/** GripVertical icon */
export const GripVertical = createIcon(
  'GripVertical',
  'M5,3H7V5H5V3ZM9,3H11V5H9V3ZM5,7H7V9H5V7ZM9,7H11V9H9V7ZM5,11H7V13H5V11ZM9,11H11V13H9V11Z'
);

/** GripHorizontal icon */
export const GripHorizontal = createIcon(
  'GripHorizontal',
  'M3,5H5V7H3V5ZM7,5H9V7H7V5ZM11,5H13V7H11V5ZM3,9H5V11H3V9ZM7,9H9V11H7V9ZM11,9H13V11H11V9Z'
);

/** Maximize2 / FullScreen icon */
export const Maximize2 = createIcon(
  'Maximize2',
  'M2,2H7V4H4V7H2V2ZM9,2H14V7H12V4H9V2ZM2,9H4V12H7V14H2V9ZM12,9H14V14H9V12H12V9Z'
);

/** Minimize2 icon */
export const Minimize2 = createIcon(
  'Minimize2',
  'M5,2H7V5H4V7H2V4H5V2ZM9,2H11V5H14V7H9V2ZM2,9H4V11H7V14H5V11H2V9ZM9,11H12V9H14V11H11V14H9V11Z'
);

// ============================================================================
// Specific to Flow (additional icons)
// ============================================================================

/** Undo2 icon */
export const Undo2 = createIcon(
  'Undo2',
  'M2,6H3V5H4V4H5V3H7V5H6V6H5V7H11V8H12V10H11V11H5V12H6V13H7V15H5V14H4V13H3V12H2V6ZM5,8V10H10V8H5Z'
);

/** Redo2 icon */
export const Redo2 = createIcon(
  'Redo2',
  'M9,3H11V4H12V5H13V6H14V12H13V13H12V14H11V15H9V13H10V12H11V11H5V10H4V8H5V7H11V6H10V5H9V3ZM6,8V10H11V8H6Z'
);

/** PanelLeft icon */
export const PanelLeft = createIcon(
  'PanelLeft',
  'M2,3H14V13H2V3ZM3,4V12H6V4H3ZM7,4V12H13V4H7Z'
);

/** PanelRight icon */
export const PanelRight = createIcon(
  'PanelRight',
  'M2,3H14V13H2V3ZM3,4V12H9V4H3ZM10,4V12H13V4H10Z'
);

/** PanelTop icon */
export const PanelTop = createIcon(
  'PanelTop',
  'M2,3H14V13H2V3ZM3,4V6H13V4H3ZM3,7V12H13V7H3Z'
);

/** PanelBottom icon */
export const PanelBottom = createIcon(
  'PanelBottom',
  'M2,3H14V13H2V3ZM3,4V9H13V4H3ZM3,10V12H13V10H3Z'
);

/** Combine icon */
export const Combine = createIcon(
  'Combine',
  'M2,2H9V4H4V9H2V2ZM7,7H14V14H7V7ZM9,9V12H12V9H9Z'
);

/** Ungroup icon */
export const Ungroup = createIcon(
  'Ungroup',
  'M2,2H8V8H2V2ZM4,4V6H6V4H4ZM8,8H14V14H8V8ZM10,10V12H12V10H10Z'
);

/** Lock icon */
export const Lock = createIcon(
  'Lock',
  'M5,6H6V4H7V3H9V4H10V6H11V13H5V6ZM7,5V6H9V5H7ZM6,7V12H10V7H6ZM7,8H9V10H7V8Z'
);

/** Unlock icon */
export const Unlock = createIcon(
  'Unlock',
  'M5,6H6V4H7V3H9V4H10V5H9V4H7V6H11V13H5V6ZM6,7V12H10V7H6ZM7,8H9V10H7V8Z'
);

/** Unlink2 / Broken link icon */
export const Unlink2 = createIcon(
  'Unlink2',
  'M4,4H6V6H4V4ZM6,6H8V8H6V6ZM8,8H10V10H8V8ZM10,10H12V12H10V10Z'
);
