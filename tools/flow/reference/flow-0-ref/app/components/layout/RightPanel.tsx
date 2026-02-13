/**
 * RightPanel - Horizontal floating bar with inline expanding panels
 *
 * Design:
 * - Horizontal bar in top-right corner with text labels: "Feedback" | "Designer"
 * - Panels expand BELOW the bar using CSS anchor positioning
 * - Smooth animations using @starting-style
 * - Only one panel expanded at a time
 *
 * Tabs:
 * 1. Feedback - Comment list, filters, copy/clear actions
 * 2. Designer - CSS property sections with collapsible sections
 */

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  SECTION_CONFIGS,
  SECTION_COMPONENTS,
  type SectionId,
} from "../designer/sections";
import { useAppStore } from "../../stores/appStore";
import type { Feedback, FeedbackType, StyleEdit } from "../../stores/types";
import { X, Check, Copy, Trash2, MessageCircle, Paintbrush, Clipboard, Undo2 } from "../ui/icons";
import { useFileWrite, type DiffEntry } from "../../hooks/useFileWrite";

// =============================================================================
// Types
// =============================================================================

interface CollapsibleSectionProps {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onRef?: (el: HTMLDivElement | null) => void;
}

type RightPanelTab = "feedback" | "designer" | "clipboard";
type FilterTab = "all" | FeedbackType;

// =============================================================================
// Constants
// =============================================================================

const PANEL_WIDTH = 320;

// =============================================================================
// Tab Configuration
// =============================================================================

interface TabConfig {
  id: RightPanelTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: "feedback", label: "Feedback", icon: <MessageCircle size={14} /> },
  { id: "designer", label: "Designer", icon: <Paintbrush size={14} /> },
  { id: "clipboard", label: "Clipboard", icon: <Clipboard size={14} /> },
];

// =============================================================================
// Text Tab Button Component
// =============================================================================

interface TextTabButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

function TextTabButton({ icon, label, active, onClick, badge }: TextTabButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-150 text-xs font-medium
        ${active
          ? "bg-accent text-white"
          : "text-text-muted hover:text-text hover:bg-white/10"
        }
      `}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`
          ml-0.5 min-w-[16px] h-4 px-1 text-[10px] font-bold rounded-full flex items-center justify-center
          ${active ? "bg-white/20 text-white" : "bg-[#95BAD2] text-white"}
        `}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

// =============================================================================
// CollapsibleSection Component
// =============================================================================

function CollapsibleSection({
  id,
  title,
  icon,
  children,
  isOpen,
  onToggle,
  onRef,
}: CollapsibleSectionProps) {
  return (
    <div ref={onRef} className="border-b border-white/5" data-section={id}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-text-muted">{icon}</span>
          <span className="text-xs font-medium text-text uppercase tracking-wider">
            {title}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-text-muted transition-transform duration-200 ${
            isOpen ? "" : "-rotate-90"
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}

// =============================================================================
// Section Icons
// =============================================================================

const SECTION_ICONS: Record<SectionId, React.ReactNode> = {
  layout: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  ),
  spacing: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  ),
  size: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 3H3v18" />
      <path d="M21 3v18" />
    </svg>
  ),
  position: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  typography: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  backgrounds: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  borders: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  boxShadows: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M19 9v10a2 2 0 0 1-2 2H7" strokeOpacity="0.5" />
    </svg>
  ),
  effects: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
};

// =============================================================================
// FeedbackFilterTab Component
// =============================================================================

interface FeedbackFilterTabProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: "sky" | "sunset";
}

function FeedbackFilterTab({ active, onClick, label, count, color }: FeedbackFilterTabProps) {
  const activeColors = {
    sky: "bg-[#95BAD2]/20 text-[#95BAD2] border-[#95BAD2]",
    sunset: "bg-[#FCC383]/20 text-[#FCC383] border-[#FCC383]",
  };

  const activeClass = color
    ? activeColors[color]
    : "bg-white/10 text-text border-white/20";

  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-[10px] rounded border transition-colors flex items-center gap-1 ${
        active
          ? activeClass
          : "border-transparent text-text-muted hover:text-text hover:bg-white/5"
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`px-1 rounded text-[9px] font-medium ${
          active ? "bg-white/20" : "bg-white/10"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// =============================================================================
// FeedbackItem Component
// =============================================================================

interface FeedbackItemProps {
  comment: Feedback;
  index: number;
  isHighlighted: boolean;
  onJump: () => void;
  onRemove: () => void;
}

function FeedbackItem({ comment, index, isHighlighted, onJump, onRemove }: FeedbackItemProps) {
  const isQuestion = comment.type === "question";
  const badgeColor = isQuestion ? "bg-[#FCC383]" : "bg-[#95BAD2]";
  const highlightColor = isQuestion
    ? "ring-1 ring-[#FCC383] bg-[#FCC383]/20"
    : "ring-1 ring-[#95BAD2] bg-[#95BAD2]/20";

  return (
    <div
      onClick={onJump}
      className={`group rounded-lg p-2 cursor-pointer transition-all text-xs ${
        isHighlighted ? highlightColor : "bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-4 h-4 ${badgeColor} text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0`}
          >
            {isQuestion ? "?" : index + 1}
          </span>
          <span className="font-medium text-text truncate">
            {comment.devflowId
              ? `[DevFlow] ${comment.componentName}`
              : comment.componentName}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-0.5 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          title="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <p className="text-text mt-1 pl-5 line-clamp-2">
        {isQuestion ? "Q: " : ""}
        {comment.content}
      </p>

      {comment.devflowId ? (
        <p className="text-[#FCC383]/70 mt-1 pl-5 font-mono truncate text-[10px]">
          devflow:{comment.devflowId}
        </p>
      ) : comment.source ? (
        <p className="text-text-muted mt-1 pl-5 font-mono truncate text-[10px]">
          {comment.source.relativePath}:{comment.source.line}
        </p>
      ) : null}
    </div>
  );
}

// =============================================================================
// FeedbackPanelContent Component
// =============================================================================

function FeedbackPanelContent() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [copied, setCopied] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Store selectors
  const comments = useAppStore((s) => s.comments);
  const removeComment = useAppStore((s) => s.removeComment);
  const clearComments = useAppStore((s) => s.clearComments);
  const copyCommentsToClipboard = useAppStore((s) => s.copyCommentsToClipboard);

  // Filter comments based on active filter
  const filteredComments = useMemo(() => {
    if (activeFilter === "all") return comments;
    return comments.filter((c) => c.type === activeFilter);
  }, [comments, activeFilter]);

  // Counts for filter tabs
  const commentCount = comments.filter((c) => c.type === "comment").length;
  const questionCount = comments.filter((c) => c.type === "question").length;

  // Jump to and highlight an element
  const jumpToElement = useCallback((comment: Feedback) => {
    let element: Element | null = document.querySelector(
      `[data-radflow-id="${comment.elementSelector}"]`
    );

    if (!element) {
      try {
        element = document.querySelector(comment.elementSelector);
      } catch {
        // Invalid selector
      }
    }

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      setHighlightedId(comment.id);
      setTimeout(() => setHighlightedId(null), 2000);

      const rect = element.getBoundingClientRect();
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: rgba(149, 186, 210, 0.3);
        border: 2px solid rgb(149, 186, 210);
        border-radius: 4px;
        pointer-events: none;
        z-index: 9999;
        animation: flash-fade 1.5s ease-out forwards;
      `;

      if (!document.getElementById("comment-flash-styles")) {
        const style = document.createElement("style");
        style.id = "comment-flash-styles";
        style.textContent = `
          @keyframes flash-fade {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.02); }
            100% { opacity: 0; transform: scale(1); }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(overlay);
      setTimeout(() => overlay.remove(), 1500);
    }
  }, []);

  const handleCopy = async () => {
    await copyCommentsToClipboard(activeFilter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs & actions header */}
      {comments.length > 0 && (
        <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex gap-1">
            <FeedbackFilterTab
              active={activeFilter === "all"}
              onClick={() => setActiveFilter("all")}
              label="All"
              count={comments.length}
            />
            <FeedbackFilterTab
              active={activeFilter === "comment"}
              onClick={() => setActiveFilter("comment")}
              label="Comments"
              count={commentCount}
              color="sky"
            />
            <FeedbackFilterTab
              active={activeFilter === "question"}
              onClick={() => setActiveFilter("question")}
              label="Questions"
              count={questionCount}
              color="sunset"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1 text-text-muted hover:text-text hover:bg-white/5 rounded transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={clearComments}
              className="p-1 text-text-muted hover:text-red-400 hover:bg-white/5 rounded transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="flex-1 overflow-auto">
        {filteredComments.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/5 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-xs text-text-muted">
              {comments.length === 0
                ? "Click elements to add feedback"
                : `No ${activeFilter === "comment" ? "comments" : "questions"}`}
            </p>
            <p className="text-[10px] text-text-muted mt-1">
              Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px]">C</kbd> for comments,{" "}
              <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px]">Q</kbd> for questions
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredComments.map((comment, index) => (
              <FeedbackItem
                key={comment.id}
                comment={comment}
                index={index}
                isHighlighted={highlightedId === comment.id}
                onJump={() => jumpToElement(comment)}
                onRemove={() => removeComment(comment.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Copy button footer */}
      {comments.length > 0 && (
        <div className="px-3 py-2 border-t border-white/5 shrink-0">
          <button
            onClick={handleCopy}
            className="w-full py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs rounded-md transition-colors flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// DesignerPanelContent Component
// =============================================================================

function DesignerPanelContent() {
  const [selectedState, setSelectedState] = useState<string>("default");
  const sections = useMemo(() => SECTION_CONFIGS, []);

  // Track open state for each section
  const [openSections, setOpenSections] = useState<Set<SectionId>>(() =>
    new Set(sections.filter((s) => s.defaultOpen).map((s) => s.id))
  );

  // Refs for scrolling to sections
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLDivElement | null>>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Toggle a section open/closed
  const toggleSection = useCallback((section: SectionId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  // Expand all sections
  const expandAllSections = useCallback(() => {
    setOpenSections(new Set(sections.map((s) => s.id)));
  }, [sections]);

  // Collapse all sections
  const collapseAllSections = useCallback(() => {
    setOpenSections(new Set());
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb & State Selector */}
      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="text-xs text-text-muted font-mono truncate flex-1">
          <span className="hover:text-primary cursor-pointer transition-colors">div</span>
          <span className="mx-1 text-text-muted/50">{">"}</span>
          <span className="hover:text-primary cursor-pointer transition-colors">section</span>
          <span className="mx-1 text-text-muted/50">{">"}</span>
          <span className="text-text">button</span>
        </div>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="bg-background/50 border border-white/8 rounded-md px-2 py-1 text-[10px] text-text ml-2"
        >
          <option value="default">Default</option>
          <option value="hover">:hover</option>
          <option value="focus">:focus</option>
          <option value="active">:active</option>
        </select>
      </div>

      {/* Section controls */}
      <div className="px-3 py-1.5 border-b border-white/5 flex items-center gap-1 shrink-0">
        <button
          onClick={expandAllSections}
          className="text-[10px] text-text-muted hover:text-text px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
        >
          Expand All
        </button>
        <span className="text-text-muted/50 text-[10px]">|</span>
        <button
          onClick={collapseAllSections}
          className="text-[10px] text-text-muted hover:text-text px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
        >
          Collapse All
        </button>
      </div>

      {/* Scrollable content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        {sections.map((section) => {
          const SectionComponent = SECTION_COMPONENTS[section.id];
          return (
            <CollapsibleSection
              key={section.id}
              id={section.id}
              title={section.title}
              icon={SECTION_ICONS[section.id]}
              isOpen={openSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
              onRef={(el) => { sectionRefs.current[section.id] = el; }}
            >
              {SectionComponent ? <SectionComponent /> : null}
            </CollapsibleSection>
          );
        })}
      </div>

      {/* CSS Output Footer */}
      <div className="border-t border-white/5 p-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">CSS Output</span>
        </div>
        <div className="bg-background/50 rounded-md p-2 font-mono text-[11px] text-text-muted max-h-20 overflow-auto">
          <pre className="whitespace-pre-wrap">{`.button {
  display: flex;
  padding: 8px 16px;
  background: var(--primary);
}`}</pre>
        </div>
        <button className="mt-2 w-full py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs rounded-md transition-colors flex items-center justify-center gap-1.5">
          <Copy className="w-3 h-3" />
          Copy to Clipboard
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// ClipboardPanelContent Component
// =============================================================================

interface DiffPreviewModalProps {
  diffs: DiffEntry[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isWriting: boolean;
}

/**
 * Modal to show diff preview before writing.
 */
function DiffPreviewModal({
  diffs,
  isOpen,
  onClose,
  onConfirm,
  isWriting,
}: DiffPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-semibold text-text">Review Changes</h2>
          <p className="text-sm text-text-muted mt-1">
            {diffs.length} change{diffs.length !== 1 ? "s" : ""} will be applied
          </p>
        </div>

        {/* Diff List */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {diffs.map((diff, idx) => (
            <div key={idx} className="bg-black/20 rounded-lg overflow-hidden">
              {/* File header */}
              <div className="px-3 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm text-text-muted font-mono">
                  {diff.relativePath}:{diff.line}
                </span>
                <span className="text-xs text-primary">{diff.property}</span>
              </div>
              {/* Diff content */}
              <div className="p-3 space-y-2 font-mono text-sm">
                <div className="flex">
                  <span className="text-red-400 w-6 flex-shrink-0">-</span>
                  <span className="text-red-300 break-all">{diff.oldLine}</span>
                </div>
                <div className="flex">
                  <span className="text-green-400 w-6 flex-shrink-0">+</span>
                  <span className="text-green-300 break-all">{diff.newLine}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isWriting}
            className="px-4 py-2 text-sm text-text-muted hover:text-text hover:bg-white/5 rounded transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isWriting}
            className="px-4 py-2 text-sm bg-primary hover:bg-primary-hover text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isWriting && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isWriting ? "Writing..." : "Apply Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditItemProps {
  edit: StyleEdit;
  onRemove: (id: string) => void;
}

/**
 * Single edit item in the list.
 */
function EditItem({ edit, onRemove }: EditItemProps) {
  return (
    <div className="flex items-start gap-3 p-2 bg-white/5 rounded-lg group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-text truncate">
            {edit.componentName}
          </span>
          <span className="text-[10px] text-text-muted">-</span>
          <span className="text-[10px] text-primary">{edit.property}</span>
        </div>
        <div className="text-[10px] text-text-muted font-mono truncate">
          {edit.source.relativePath}:{edit.source.line}
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[10px]">
          <span className="text-red-400 line-through">{edit.oldValue}</span>
          <span className="text-text-muted">-&gt;</span>
          <span className="text-green-400">{edit.newValue}</span>
        </div>
      </div>
      <button
        onClick={() => onRemove(edit.id)}
        className="p-1 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Remove edit"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function ClipboardPanelContent() {
  const [showDiffPreview, setShowDiffPreview] = useState(false);
  const [diffs, setDiffs] = useState<DiffEntry[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Store state
  const pendingStyleEdits = useAppStore((s) => s.pendingStyleEdits);
  const removeStyleEdit = useAppStore((s) => s.removeStyleEdit);
  const undoLastStyleEdit = useAppStore((s) => s.undoLastStyleEdit);
  const clearAllStyleEdits = useAppStore((s) => s.clearAllStyleEdits);

  // Get project root from workspace
  const workspace = useAppStore((s) => s.workspace);
  const projectRoot = workspace?.root || "";

  // File write hook
  const {
    previewEdits,
    writeEdits,
    isWriting,
    isPreviewing,
    lastBackupPath,
    lastError,
  } = useFileWrite(projectRoot);

  // Group edits by file for display
  const editsByFile = useMemo(() => {
    const grouped = new Map<string, StyleEdit[]>();
    for (const edit of pendingStyleEdits) {
      const key = edit.source.relativePath;
      const existing = grouped.get(key) || [];
      grouped.set(key, [...existing, edit]);
    }
    return grouped;
  }, [pendingStyleEdits]);

  // Handle save button click
  const handleSaveClick = useCallback(async () => {
    setPreviewError(null);
    const result = await previewEdits(pendingStyleEdits);

    if (result.success) {
      setDiffs(result.diffs);
      setShowDiffPreview(true);
    } else {
      setPreviewError(result.error || "Failed to generate preview");
    }
  }, [previewEdits, pendingStyleEdits]);

  // Handle confirm write
  const handleConfirmWrite = useCallback(async () => {
    const result = await writeEdits(pendingStyleEdits);

    if (result.success) {
      setShowDiffPreview(false);
      clearAllStyleEdits();
    }
  }, [writeEdits, pendingStyleEdits, clearAllStyleEdits]);

  // Handle undo
  const handleUndo = useCallback(() => {
    undoLastStyleEdit();
  }, [undoLastStyleEdit]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    if (pendingStyleEdits.length > 0) {
      clearAllStyleEdits();
    }
  }, [clearAllStyleEdits, pendingStyleEdits.length]);

  const editCount = pendingStyleEdits.length;
  const fileCount = editsByFile.size;

  return (
    <div className="flex flex-col h-full">
      {/* Header with count and actions */}
      {editCount > 0 && (
        <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-text-muted">
            {editCount} edit{editCount !== 1 ? "s" : ""} in {fileCount} file{fileCount !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              className="p-1 text-text-muted hover:text-text hover:bg-white/5 rounded transition-colors"
              title="Undo last edit"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClearAll}
              className="p-1 text-text-muted hover:text-red-400 hover:bg-white/5 rounded transition-colors"
              title="Clear all edits"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Edit List */}
      <div className="flex-1 overflow-auto">
        {editCount === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/5 flex items-center justify-center">
              <Clipboard className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-xs text-text-muted">
              No pending edits
            </p>
            <p className="text-[10px] text-text-muted mt-1">
              Style changes will appear here
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {Array.from(editsByFile.entries()).map(([filePath, edits]) => (
              <div key={filePath}>
                <div className="text-[10px] text-text-muted font-mono mb-1.5 truncate px-1">
                  {filePath}
                </div>
                <div className="space-y-1.5">
                  {edits.map((edit) => (
                    <EditItem
                      key={edit.id}
                      edit={edit}
                      onRemove={removeStyleEdit}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {(previewError || lastError) && (
        <div className="px-3 py-2 bg-red-500/10 border-t border-red-500/20 shrink-0">
          <p className="text-[10px] text-red-400">{previewError || lastError}</p>
        </div>
      )}

      {/* Footer with Save Button */}
      {editCount > 0 && (
        <div className="px-3 py-2 border-t border-white/5 shrink-0">
          <button
            onClick={handleSaveClick}
            disabled={isPreviewing || isWriting || !projectRoot}
            className="w-full py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isPreviewing && (
              <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            )}
            {isPreviewing ? "Generating..." : "Review & Save"}
          </button>
          {lastBackupPath && (
            <p className="text-[9px] text-text-muted mt-1.5 text-center truncate">
              Backup: {lastBackupPath.split("/").pop()}
            </p>
          )}
          {!projectRoot && (
            <p className="text-[9px] text-amber-400 mt-1.5 text-center">
              No project connected
            </p>
          )}
        </div>
      )}

      {/* Diff Preview Modal */}
      <DiffPreviewModal
        diffs={diffs}
        isOpen={showDiffPreview}
        onClose={() => setShowDiffPreview(false)}
        onConfirm={handleConfirmWrite}
        isWriting={isWriting}
      />
    </div>
  );
}

// =============================================================================
// CSS Styles for anchor positioning and @starting-style animations
// =============================================================================

const panelStyles = `
  /* Anchor positioning for the bar */
  .right-panel-bar {
    anchor-name: --right-panel-bar;
  }

  /* Panel positioning anchored to bar */
  .right-panel-content {
    position-anchor: --right-panel-bar;
    top: anchor(bottom);
    right: anchor(right);

    /* Animation properties */
    opacity: 1;
    transform: translateY(0);
    transition: opacity 150ms ease-out, transform 150ms ease-out;
  }

  /* Entry animation using @starting-style */
  @starting-style {
    .right-panel-content {
      opacity: 0;
      transform: translateY(-8px);
    }
  }
`;

// =============================================================================
// RightPanel Component - Horizontal Bar + Inline Expanding Panels
// =============================================================================

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<RightPanelTab | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Store selectors
  const comments = useAppStore((s) => s.comments);
  const pendingStyleEdits = useAppStore((s) => s.pendingStyleEdits);

  // Global panel state - when activePanel is "feedback", switch to feedback tab
  const activePanel = useAppStore((s) => s.activePanel);
  const setActivePanel = useAppStore((s) => s.setActivePanel);

  // Inject styles for anchor positioning
  useEffect(() => {
    const styleId = "right-panel-anchor-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = panelStyles;
      document.head.appendChild(style);
    }
    return () => {
      const style = document.getElementById(styleId);
      if (style) style.remove();
    };
  }, []);

  // Sync with global activePanel state (from ModeBarDrawer)
  useEffect(() => {
    if (activePanel === "feedback") {
      setActiveTab("feedback");
    }
  }, [activePanel]);

  // Toggle tab - clicking same tab closes panel, different tab switches
  const toggleTab = useCallback((tab: RightPanelTab) => {
    if (activeTab === tab) {
      setActiveTab(null);
      // Clear feedback panel state when closing
      if (tab === "feedback") {
        setActivePanel(null);
      }
    } else {
      setActiveTab(tab);
      // Set feedback panel state when opening feedback tab
      if (tab === "feedback") {
        setActivePanel("feedback");
      } else if (activePanel === "feedback") {
        setActivePanel(null);
      }
    }
  }, [activeTab, activePanel, setActivePanel]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking on the bar or panel itself
      if (target.closest('[data-devflow-id="floating-right-bar"]') ||
          target.closest('[data-devflow-id^="floating-right-panel-"]') ||
          target.closest('[data-devflow-id="mode-bar-drawer"]')) {
        return;
      }
      // Close panel if clicking outside
      if (activeTab) {
        setActiveTab(null);
        if (activePanel === "feedback") {
          setActivePanel(null);
        }
      }
    };

    // Only add listener if a panel is open
    if (activeTab) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [activeTab, activePanel, setActivePanel]);

  // Calculate panel max height based on bar position (8px from top + bar height ~40px + gap 8px)
  const panelMaxHeight = `calc(100dvh - 64px)`;

  return (
    <>
      {/* Floating Horizontal Bar - Fixed Top-Right */}
      <div
        className="fixed top-2 right-2 z-30 right-panel-bar"
        data-devflow-id="floating-right-bar"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={barRef}
          className="flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-lg px-1.5 py-1 shadow-lg border border-white/10"
        >
          {/* Tab Text Buttons */}
          {TABS.map((tab) => {
            let badge: number | undefined;
            if (tab.id === "feedback") badge = comments.length;
            if (tab.id === "clipboard") badge = pendingStyleEdits.length;
            return (
              <TextTabButton
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                active={activeTab === tab.id}
                onClick={() => toggleTab(tab.id)}
                badge={badge}
              />
            );
          })}
        </div>
      </div>

      {/* Floating Panel - Expands BELOW the bar */}
      {activeTab && (
        <div
          className="fixed top-12 right-2 z-35 right-panel-content"
          data-devflow-id={`floating-right-panel-${activeTab}`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 overflow-hidden flex flex-col"
            style={{
              width: PANEL_WIDTH,
              height: 'fit-content',
              maxHeight: panelMaxHeight,
            }}
          >
            {/* Panel Header */}
            <div className="h-10 px-3 flex items-center justify-between border-b border-white/10 shrink-0">
              <span className="text-xs font-medium text-text uppercase tracking-wider">
                {activeTab}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab(null);
                  if (activePanel === "feedback") {
                    setActivePanel(null);
                  }
                }}
                className="text-text-muted hover:text-text text-xs hover:bg-white/5 px-2 py-1 rounded transition-colors"
              >
                Close
              </button>
            </div>

            {/* Panel Content - scrollable */}
            <div className="flex-1 overflow-auto">
              {activeTab === "feedback" && <FeedbackPanelContent />}
              {activeTab === "designer" && <DesignerPanelContent />}
              {activeTab === "clipboard" && <ClipboardPanelContent />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RightPanel;
