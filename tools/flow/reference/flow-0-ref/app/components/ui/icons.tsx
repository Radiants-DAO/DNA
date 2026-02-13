/**
 * Centralized icon exports using @rdna/radiants pixel-art icons
 * DNA spec: Radiants icons (16x16 pixel-art grid)
 *
 * All Flow components should import icons from this file
 * to ensure consistency with the radiants design system.
 *
 * Icons use currentColor and accept size/className props.
 */

// Re-export from radiants icons
export {
  // Types
  type IconProps,
  ICON_SIZE,
  type IconSize,

  // Dynamic icon loader (for runtime loading from assets)
  Icon,

  // Navigation & Actions
  X,
  Check,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  RotateCcw,

  // Editor Modes
  MousePointer2,
  Type,
  Hand,
  Pencil,

  // Comments & Feedback
  MessageSquare,
  MessageCircle,
  HelpCircle,
  CircleHelp,

  // Clipboard & Copy
  Clipboard,
  ClipboardCopy,
  ClipboardCheck,
  Copy,

  // Files & Folders
  File,
  FileText,
  Folder,
  FolderTree,
  FolderOpen,

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

  // Brand/Desktop icons
  RadMarkIcon,
  TreeIcon,
  DarkModeIcon,
  RobotIcon,
  ColorSwatchIcon,
  FontAaIcon,
} from "@rdna/radiants/icons";

// Icons not available in radiants - use lucide fallback
// These can be replaced with radiants versions when created
export {
  ArrowLeft,
  ArrowRight,
  Move,
  Eraser,
  RotateCw,
} from "lucide-react";

// Re-export lucide type for backward compatibility
export type { LucideIcon } from "lucide-react";
