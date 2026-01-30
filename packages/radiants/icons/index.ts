/**
 * Radiants Icon System
 *
 * Two types of icons:
 * 1. Inline React Components (CoreIcons) - pre-rendered SVGs, no network requests
 * 2. Dynamic Icon loader - loads SVGs at runtime from assets folder
 *
 * Usage:
 *   // Recommended: Use inline components (CoreIcons)
 *   import { X, Check, MessageSquare } from '@rdna/radiants/icons';
 *   <X size={16} className="text-red-500" />
 *
 *   // Dynamic loader (for custom icons or full icon set)
 *   import { Icon } from '@rdna/radiants/icons';
 *   <Icon name="custom-icon" size={24} />
 *
 *   // Brand/Desktop icons (pixel-art specials)
 *   import { RadMarkIcon, TreeIcon } from '@rdna/radiants/icons';
 *   <RadMarkIcon size={32} />
 */

// Types
export { type IconProps, ICON_SIZE, type IconSize } from './types';

// Dynamic SVG loader
export { Icon } from './Icon';

// Static inline icon components (recommended for performance)
export {
  // Navigation & Actions
  X,
  Check,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  RotateCcw,

  // Editor Modes
  MousePointer2,
  Type,
  Pencil,
  Hand,

  // Comments & Feedback
  MessageSquare,
  MessageCircle,
  HelpCircle,
  CircleHelp,

  // Clipboard & Copy
  Copy,
  ClipboardCopy,
  Clipboard,
  ClipboardCheck,
  CopiedIcon,

  // Files & Folders
  File,
  FileText,
  Folder,
  FolderOpen,
  FolderTree,

  // UI Elements
  Menu,
  MoreHorizontal,
  MoreVertical,
  Settings,
  Settings2,
  Sliders,
  SlidersHorizontal,

  // View Modes
  Eye,
  EyeOff,
  Play,
  Pause,
  Square,

  // Design Tools
  Palette,
  Paintbrush,
  Pipette,
  Wand2,
  Sparkles,

  // Layout
  Layout,
  LayoutGrid,
  Grid3X3,
  Columns,
  Rows,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,

  // Typography
  Bold,
  Italic,
  Underline,
  Strikethrough,

  // Status
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,

  // Content
  Image,
  Video,
  Music,
  Link,
  ExternalLink,

  // Common Actions
  Trash,
  Trash2,
  Edit,
  Edit2,
  Save,
  Download,
  Upload,
  Share,

  // Misc
  Book,
  BookOpen,
  Layers,
  Component,
  Code,
  Terminal,
  Zap,
  Globe,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  GripVertical,
  GripHorizontal,
  Maximize2,
  Minimize2,

  // Specific to Flow
  Undo2,
  Redo2,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  Combine,
  Ungroup,
  Lock,
  Unlock,
  Unlink2,
} from './CoreIcons';

// Brand/Desktop pixel-art icons
export {
  RadMarkIcon,
  TreeIcon,
  DarkModeIcon,
  TwitterIcon,
  DiscordIcon,
  RobotIcon,
  ColorSwatchIcon,
  FontAaIcon,
} from './DesktopIcons';
