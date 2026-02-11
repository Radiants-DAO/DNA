/**
 * LeftTabBar - Unified vertical icon tab bar for the DevTools panel
 *
 * 6 tabs: Components, Assets, Variables, Designer, Mutations, Prompt
 * Click to select a tab (fills main content area), click again to collapse.
 */

import { useCallback } from "react";
import { useAppStore } from "../../stores/appStore";
import { PaintbrushIcon, EditIcon, PromptIcon } from "./RightPanel";

export type TabId =
  | "components"
  | "assets"
  | "variables"
  | "accessibility"
  | "designer"
  | "mutations"
  | "prompt"
  | "feedback";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: "components", label: "Components", icon: <GridIcon /> },
  { id: "assets", label: "Assets", icon: <ImageIcon /> },
  { id: "variables", label: "Variables", icon: <DropletIcon /> },
  { id: "accessibility", label: "Accessibility", icon: <AccessibilityIcon /> },
  { id: "designer", label: "Designer", icon: <PaintbrushIcon /> },
  { id: "mutations", label: "Mutations", icon: <EditIcon /> },
  { id: "prompt", label: "Prompt", icon: <PromptIcon /> },
  { id: "feedback", label: "Feedback", icon: <ChatIcon /> },
];

interface LeftTabBarProps {
  activeTab: TabId | null;
  onTabChange: (tab: TabId | null) => void;
  theme?: "dark" | "light";
}

export function LeftTabBar({ activeTab, onTabChange, theme = "dark" }: LeftTabBarProps) {
  const mutationDiffs = useAppStore((s) => s.mutationDiffs);
  const comments = useAppStore((s) => s.comments);
  const isLight = theme === "light";

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = TABS.findIndex((t) => t.id === activeTab);
      let nextIndex: number | null = null;

      if (e.key === "ArrowDown") {
        nextIndex = currentIndex < TABS.length - 1 ? currentIndex + 1 : 0;
      } else if (e.key === "ArrowUp") {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : TABS.length - 1;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        onTabChange(TABS[nextIndex].id);
        const btn = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(
          `[data-tab-id="${TABS[nextIndex].id}"]`
        );
        btn?.focus();
      }
    },
    [activeTab, onTabChange]
  );

  return (
    <div
      className={`w-11 shrink-0 flex flex-col items-center py-2 gap-1 border-r ${
        isLight
          ? "bg-neutral-100 border-neutral-300"
          : "bg-neutral-900 border-neutral-800"
      }`}
      data-devflow-id="left-tab-bar"
      role="tablist"
      aria-label="Panel tabs"
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const badge =
          tab.id === "mutations" ? mutationDiffs.length
          : tab.id === "feedback" ? comments.length
          : undefined;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            data-tab-id={tab.id}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(isActive ? null : tab.id)}
            className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
              isActive
                ? "bg-blue-600 text-white"
                : isLight
                  ? "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200"
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800"
            }`}
            title={tab.label}
          >
            {tab.icon}
            {badge !== undefined && badge > 0 && (
              <span
                className={`absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 text-[9px] font-bold rounded-full flex items-center justify-center ${
                  isActive ? "bg-white/20 text-white" : "bg-blue-500 text-white"
                }`}
              >
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Tab-specific icons ──

function GridIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function AccessibilityIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6v4" />
      <path d="m8 10 4 4 4-4" />
      <path d="m8 20 4-6 4 6" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default LeftTabBar;
