'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@rdna/radiants/icons/runtime';

// =============================================================================
// LayerRow — Flat layer-list row with inline action buttons
//
// Sibling to LayerTreeRow. LayerTreeRow is hierarchical (expand/collapse,
// depth, optional tag) — this one is a flat action-bearing list item shaped
// for image-editor layer panels (visibility toggle, reorder, delete).
//
// Cell chrome matches PropertyRow / ButtonStrip — dark cell background,
// 1px borders, gold glow when selected.
// =============================================================================

interface LayerRowProps {
  label: string;
  selected?: boolean;
  visible?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  canDelete?: boolean;
  onSelect?: () => void;
  onToggleVisible?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  /**
   * If provided, double-clicking the name cell enters rename mode and the new
   * label is committed on Enter or blur (Escape cancels). Empty/whitespace
   * labels are ignored.
   */
  onRename?: (nextLabel: string) => void;
  /** Border treatment. `flush` is for 1px-gap cell groups inside rails. */
  chrome?: 'bordered' | 'flush';
  actionSize?: 'sm' | 'md' | 'xl';
  /**
   * Optional leading slot (e.g. a drag handle or checkbox). Renders before
   * the label cell. Visibility toggle and reorder controls are positioned
   * trailing.
   */
  leading?: ReactNode;
  className?: string;
}

const CELL_BASE =
  'inline-flex items-center justify-center shrink-0 font-mono text-[0.5rem] leading-none outline-none transition-colors duration-fast focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ctrl-glow';

const ACTION_SIZE_CLASSES: Record<NonNullable<LayerRowProps['actionSize']>, string> = {
  sm: 'size-5',
  md: 'size-7',
  xl: 'size-10 text-xs',
};

interface ActionCellProps {
  ariaLabel: string;
  onClick?: () => void;
  enabled: boolean;
  borderRight?: boolean;
  /** If provided, render as a switch with aria-checked instead of a button. */
  switchChecked?: boolean;
  active?: boolean;
  chrome?: 'bordered' | 'flush';
  actionSize?: NonNullable<LayerRowProps['actionSize']>;
  children: ReactNode;
}

function ActionCell({
  ariaLabel,
  onClick,
  enabled,
  borderRight = false,
  switchChecked,
  active = false,
  chrome = 'bordered',
  actionSize = 'sm',
  children,
}: ActionCellProps) {
  const isSwitch = switchChecked !== undefined;
  const isFlush = chrome === 'flush';

  return (
    <button
      type="button"
      role={isSwitch ? 'switch' : undefined}
      aria-checked={isSwitch ? switchChecked : undefined}
      aria-label={ariaLabel}
      disabled={!enabled}
      onClick={onClick}
      className={[
        CELL_BASE,
        'group relative',
        ACTION_SIZE_CLASSES[actionSize],
        isFlush && 'bg-ctrl-cell-bg',
        !isFlush && borderRight && 'border-r border-ctrl-border-inactive',
        active ? 'bg-ink text-flip' : 'text-main',
        !enabled && 'opacity-[--ctrl-disabled-opacity] pointer-events-none',
      ].filter(Boolean).join(' ')}
    >
      {!active && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden group-hover:block"
          style={{
            backgroundColor: 'var(--color-ctrl-label)',
            WebkitMaskImage: 'var(--pat-diagonal)',
            maskImage: 'var(--pat-diagonal)',
            WebkitMaskSize: '8px 8px',
            maskSize: '8px 8px',
            WebkitMaskRepeat: 'repeat',
            maskRepeat: 'repeat',
          }}
        />
      )}
      <span className="relative inline-flex items-center justify-center">
        {children}
      </span>
    </button>
  );
}

export function LayerRow({
  label,
  selected = false,
  visible = true,
  canMoveUp = true,
  canMoveDown = true,
  canDelete = true,
  onSelect,
  onToggleVisible,
  onMoveUp,
  onMoveDown,
  onDelete,
  onRename,
  chrome = 'bordered',
  actionSize = 'sm',
  leading,
  className = '',
}: LayerRowProps) {
  const isFlush = chrome === 'flush';
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) setDraftLabel(label);
  }, [label, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitRename = () => {
    const trimmed = draftLabel.trim();
    if (trimmed && trimmed !== label) onRename?.(trimmed);
    setIsEditing(false);
  };
  const cancelRename = () => {
    setDraftLabel(label);
    setIsEditing(false);
  };

  return (
    <div
      data-rdna="ctrl-layer-row"
      data-selected={selected || undefined}
      data-chrome={chrome}
      className={[
        'flex items-stretch',
          isFlush
          ? actionSize === 'xl'
            ? 'min-h-10 max-h-10 gap-px bg-ink border-0'
            : actionSize === 'md'
              ? 'min-h-7 max-h-7 gap-px bg-ink border-0'
            : 'min-h-5 max-h-5 gap-px bg-ink border-0'
          : 'min-h-[--ctrl-row-height] bg-ctrl-cell-bg border border-ctrl-border-inactive',
        className,
      ].filter(Boolean).join(' ')}
    >
      {leading && (
        <span
          className={[
            'flex items-center justify-center shrink-0 px-1 text-main',
            isFlush ? 'bg-ctrl-cell-bg border-0' : 'border-r border-ctrl-border-inactive',
          ].filter(Boolean).join(' ')}
        >
          {leading}
        </span>
      )}

      {/* Name cell — primary click target for selection; double-click renames. */}
      {isEditing ? (
        <div
          className={[
            'relative flex-1 flex items-center px-1.5 py-1 min-w-0',
            selected ? 'bg-ink text-flip' : 'bg-ctrl-cell-bg text-main',
            'font-mono uppercase tracking-wider text-[0.625rem]',
            !visible && 'opacity-[--ctrl-disabled-opacity]',
          ].filter(Boolean).join(' ')}
        >
          <input
            ref={inputRef}
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitRename();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelRename();
              }
            }}
            aria-label={`Rename ${label}`}
            className="relative w-full bg-transparent border-0 outline-none font-mono uppercase tracking-wider text-[0.625rem] text-inherit"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          onDoubleClick={onRename ? () => setIsEditing(true) : undefined}
          aria-pressed={selected}
          className={[
            'group relative flex-1 flex items-center px-1.5 py-1 min-w-0 text-left',
            selected ? 'bg-ink text-flip' : 'bg-ctrl-cell-bg text-main',
            'font-mono uppercase tracking-wider text-[0.625rem]',
            'outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ctrl-glow',
            'transition-colors duration-fast',
            !visible && 'opacity-[--ctrl-disabled-opacity]',
          ].filter(Boolean).join(' ')}
        >
          {!selected && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden group-hover:block"
              style={{
                backgroundColor: 'var(--color-ctrl-label)',
                WebkitMaskImage: 'var(--pat-diagonal)',
                maskImage: 'var(--pat-diagonal)',
                WebkitMaskSize: '8px 8px',
                maskSize: '8px 8px',
                WebkitMaskRepeat: 'repeat',
                maskRepeat: 'repeat',
              }}
            />
          )}
          <span className="relative truncate">{label}</span>
        </button>
      )}

      {/* Trailing action cells */}
      <div
        className={[
          'flex items-stretch shrink-0',
          isFlush ? 'gap-px bg-ink' : 'border-l border-ctrl-border-inactive',
        ].filter(Boolean).join(' ')}
        role="toolbar"
        aria-label={`${label} actions`}
      >
        {onMoveUp && (
          <ActionCell
            ariaLabel={`Move ${label} up`}
            onClick={onMoveUp}
            enabled={canMoveUp}
            borderRight
            chrome={chrome}
            actionSize={actionSize}
          >
            <Icon name="arrow-up-thin" size={16} />
          </ActionCell>
        )}
        {onMoveDown && (
          <ActionCell
            ariaLabel={`Move ${label} down`}
            onClick={onMoveDown}
            enabled={canMoveDown}
            borderRight
            chrome={chrome}
            actionSize={actionSize}
          >
            <Icon name="arrow-down-thin" size={16} />
          </ActionCell>
        )}
        {onToggleVisible && (
          <ActionCell
            ariaLabel={visible ? `Hide ${label}` : `Show ${label}`}
            onClick={onToggleVisible}
            enabled
            borderRight
            switchChecked={visible}
            active={visible}
            chrome={chrome}
            actionSize={actionSize}
          >
            <Icon name={visible ? 'eye' : 'eye-hidden'} size={16} />
          </ActionCell>
        )}
        {onDelete && (
          <ActionCell
            ariaLabel={`Delete ${label}`}
            onClick={onDelete}
            enabled={canDelete}
            chrome={chrome}
            actionSize={actionSize}
          >
            <Icon name="trash" size={16} />
          </ActionCell>
        )}
      </div>
    </div>
  );
}
