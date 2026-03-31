'use client';

import { useMemo, useRef, useEffect } from 'react';
import { Icon } from '@rdna/radiants/icons/runtime';
import type { DefaultReactSuggestionItem, SuggestionMenuProps } from '@blocknote/react';

// ============================================================================
// Icon mapping — RDNA icons for default BlockNote block types
// ============================================================================

/** Heading badge rendered as styled text (no icon fits perfectly) */
function HeadingBadge({ level }: { level: number }) {
  return (
    <span className="font-joystix text-accent" style={{ fontSize: 11 }}>
      H{level}
    </span>
  );
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'Heading 1':        <HeadingBadge level={1} />,
  'Heading 2':        <HeadingBadge level={2} />,
  'Heading 3':        <HeadingBadge level={3} />,
  'Paragraph':        <Icon name="cursor-text" />,
  'Bullet List':      <Icon name="list" />,
  'Numbered List':    <Icon name="list" />,
  'Check List':       <Icon name="checkmark" />,
  'Table':            <Icon name="grid-3x3" />,
  'Image':            <Icon name="multiple-images" />,
  'Code Block':       <Icon name="code-window" />,
  'Alert':            <Icon name="comments-blank" />,
};

/**
 * Patch default BlockNote items with RDNA icons.
 * Items not in the map keep their original icon.
 */
export function applyRdnaIcons(items: DefaultReactSuggestionItem[]): DefaultReactSuggestionItem[] {
  return items.map((item) => {
    const icon = ICON_MAP[item.title];
    return icon ? { ...item, icon } : item;
  });
}

// ============================================================================
// Custom RDNA Slash Menu Component
// ============================================================================

export function RdnaSlashMenu({
  items,
  selectedIndex,
  onItemClick,
}: SuggestionMenuProps<DefaultReactSuggestionItem>) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Group items by their group property
  const groups = useMemo(() => {
    const map = new Map<string, DefaultReactSuggestionItem[]>();
    for (const item of items) {
      const group = item.group ?? 'Other';
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(item);
    }
    return map;
  }, [items]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex === undefined) return;
    const el = menuRef.current?.querySelector('[data-selected="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (items.length === 0) {
    return (
      <div className="rdna-slash-menu bg-card border border-line px-4 py-3 text-mute text-sm">
        No matching commands
      </div>
    );
  }

  let runningIdx = 0;

  return (
    <div
      ref={menuRef}
      className="rdna-slash-menu bg-card border border-line overflow-y-auto py-1"
      style={{ maxHeight: 320, minWidth: 220, boxShadow: '0 4px 16px oklch(0 0 0 / 0.18)' }}
    >
      {[...groups.entries()].map(([group, groupItems]) => (
        <div key={group}>
          {/* Group header */}
          <div className="px-3 pt-2 pb-1">
            <span className="font-joystix text-mute" style={{ fontSize: 9, letterSpacing: '0.05em' }}>
              {group}
            </span>
          </div>

          {/* Items */}
          {groupItems.map((item) => {
            const idx = runningIdx++;
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={item.title}
                data-selected={isSelected || undefined}
                className="rdna-slash-item w-full flex items-center gap-3 px-3 py-1.5 text-left transition-colors"
                style={{
                  background: isSelected ? 'oklch(from var(--color-accent) l c h / 0.10)' : undefined,
                  color: isSelected ? 'var(--color-accent)' : undefined,
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onItemClick?.(item)}
              >
                {/* Icon */}
                <span className="w-5 h-5 flex items-center justify-center shrink-0" style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-mute)' }}>
                  {item.icon}
                </span>

                {/* Label + subtext */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate" style={{ fontFamily: 'var(--font-sans)' }}>
                    {item.title}
                  </div>
                  {item.subtext && (
                    <div className="text-mute truncate" style={{ fontSize: 11, fontFamily: 'var(--font-sans)' }}>
                      {item.subtext}
                    </div>
                  )}
                </div>

                {/* Keyboard badge */}
                {item.badge && (
                  <span className="text-mute shrink-0" style={{ fontSize: 10, fontFamily: 'var(--font-pixel-code)' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
