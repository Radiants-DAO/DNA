'use client';

import React, { useState } from 'react';
import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { Tooltip } from '../../readouts/Tooltip/Tooltip';

// =============================================================================
// Section — Collapsible panel section with rule-ornament header
//
// Paper ref: 02 — Section Header
// Rule ornaments flank the title. Optional trailing controls (badge, collapse).
// No Base UI dependency — uses data-[open] for CSS.
// =============================================================================

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  /** Optional count badge shown after the trailing rule */
  count?: number;
  /** Inline controls rendered between the rule and collapse label */
  headerControls?: React.ReactNode;
  /** Footer label text (e.g. "Show CSS") — renders a bottom ornament row */
  footer?: string;
  /** Surface treatment.
   *  - `none` (default): transparent, inherits the parent panel bg.
   *  - `inset`: pure-black LCD panel bg — use when stacked inside a
   *    1px-gap ControlPanel to produce a bezel-strip look. */
  chrome?: 'none' | 'inset';
  /** Keep section contents mounted while collapsed. Useful for expensive controls. */
  keepMounted?: boolean;
  /** Keep contents searchable by browser find-in-page while collapsed. */
  hiddenUntilFound?: boolean;
  /** Show the text collapse affordance in the header. Disable in narrow rails. */
  showCollapseLabel?: boolean;
  /** Show the compact chevron affordance when showCollapseLabel is disabled. */
  showCollapseIcon?: boolean;
  /** Icon displayed instead of the title while the section is collapsed. */
  collapsedIcon?: React.ReactNode;
  collapsedTooltip?: React.ReactNode;
  simpleHeader?: boolean;
  headerClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({
  title,
  defaultOpen = true,
  count,
  headerControls,
  footer,
  chrome = 'none',
  keepMounted = false,
  hiddenUntilFound = false,
  showCollapseLabel = true,
  showCollapseIcon = true,
  collapsedIcon,
  collapsedTooltip,
  simpleHeader = false,
  headerClassName = '',
  titleClassName = '',
  contentClassName = '',
  children,
  className = '',
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const titleContent = !open && collapsedIcon ? (
    collapsedTooltip ? (
      <Tooltip content={collapsedTooltip} side="right">
        <span className="flex h-full items-center justify-center">
          {collapsedIcon}
        </span>
      </Tooltip>
    ) : (
      collapsedIcon
    )
  ) : (
    title
  );

  return (
    <BaseCollapsible.Root
      open={open}
      onOpenChange={setOpen}
      data-rdna="ctrl-section"
      data-open={open || undefined}
      data-chrome={chrome}
      className={[
        'flex flex-col',
        chrome === 'inset' ? 'bg-pure-black px-1' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <BaseCollapsible.Trigger
        nativeButton={false}
        render={(props) => (
          <div
            {...props}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              // Ignore clicks that originate inside headerControls — those are
              // the caller's interactive elements (e.g. add/delete ActionButtons).
              if (
                headerControls &&
                (e.target as HTMLElement).closest('[data-section-header-controls]')
              ) {
                return;
              }
              props.onClick?.(e);
            }}
            className={[
              'flex items-center h-6 w-full text-left shrink-0 cursor-pointer outline-none',
              !open && collapsedIcon ? 'h-auto justify-center' : '',
              'focus-visible:ring-2 focus-visible:ring-ctrl-glow focus-visible:ring-offset-1',
              'group',
              headerClassName,
            ].join(' ')}
          >
            {!simpleHeader && (
              <div
                className="shrink-0"
                style={{
                  width: 4,
                  height: 'round(50%, 1px)',
                  borderLeft: '1px solid var(--color-ctrl-border-inactive)',
                  borderTop: '1px solid var(--color-ctrl-border-inactive)',
                }}
              />
            )}

            {/* Title — cream text with canonical active glow */}
            <span
              className={[
                'self-stretch flex items-center leading-4 uppercase',
                !open && collapsedIcon
                  ? 'h-6 w-6 shrink-0 justify-center'
                  : simpleHeader
                    ? 'w-full justify-center text-center'
                    : 'shrink-0',
                titleClassName,
              ].filter(Boolean).join(' ')}
              style={{
                color: 'var(--color-main)',
                textShadow: 'var(--ctrl-text-glow-active)',
              }}
            >
              {titleContent}
            </span>

            {!simpleHeader && (
              <div
                className="flex-1 relative"
                style={{
                  height: 'round(50%, 1px)',
                  borderTop: '1px solid var(--color-ctrl-border-inactive)',
                }}
              />
            )}
            {simpleHeader && <div className="flex-1" />}

            {/* Count badge */}
            {count != null && (
              <span className="font-mono text-ctrl-label text-[0.5rem] tracking-wider shrink-0 ml-1 mr-1">
                {count} found
              </span>
            )}

            {/* Header controls slot + short rules on both sides */}
            {headerControls && (
              <>
                {!simpleHeader && (
                  <div
                    className="shrink-0 relative"
                    style={{
                      width: 12,
                      height: 'round(50%, 1px)',
                      borderTop: '1px solid var(--color-ctrl-border-inactive)',
                    }}
                  />
                )}
                <div data-section-header-controls>{headerControls}</div>
                {!simpleHeader && (
                  <div
                    className="shrink-0 relative"
                    style={{
                      width: 12,
                      height: 'round(50%, 1px)',
                      borderTop: '1px solid var(--color-ctrl-border-inactive)',
                    }}
                  />
                )}
              </>
            )}

            {/* Collapse/Expand label */}
            {showCollapseLabel && (
              <span
                style={{ fontSize: 8, lineHeight: '10px' }}
                className="uppercase shrink-0 group-hover:text-ctrl-text-active transition-colors duration-fast"
              >
                {open ? 'Collapse' : 'Expand'}
              </span>
            )}
            {!showCollapseLabel && showCollapseIcon && (
              <span
                aria-hidden
                className="flex h-full shrink-0 items-center px-1 text-xs font-bold text-ctrl-label group-hover:text-ctrl-text-active"
              >
                {open ? '⌄' : '›'}
              </span>
            )}

            {!simpleHeader && (
              <div
                className="shrink-0"
                style={{
                  width: 4,
                  height: 'round(50%, 1px)',
                  borderRight: '1px solid var(--color-ctrl-border-inactive)',
                  borderTop: '1px solid var(--color-ctrl-border-inactive)',
                }}
              />
            )}
          </div>
        )}
      />

      <BaseCollapsible.Panel
        keepMounted={keepMounted}
        hiddenUntilFound={hiddenUntilFound}
        className={[
          'flex flex-col gap-[--ctrl-cell-gap] py-1',
          contentClassName,
        ].filter(Boolean).join(' ')}
      >
          {children}
      </BaseCollapsible.Panel>

      {/* Footer ornament */}
      {footer && (
        <div className="flex items-start gap-1 h-6 shrink-0">
          {/* Small left corner ⌐ flipped bottom */}
          <div
            className="shrink-0"
            style={{
              width: 4,
              height: 'round(50%, 1px)',
              borderBottom: '1px solid var(--color-ctrl-border-inactive)',
              borderLeft: '1px solid var(--color-ctrl-border-inactive)',
            }}
          />
          {/* Left rule */}
          <div
            className="flex-1"
            style={{
              height: 'round(50%, 1px)',
              borderBottom: '1px solid var(--color-ctrl-border-inactive)',
            }}
          />

          {/* Centered label */}
          <span
            style={{ fontSize: 8, lineHeight: '10px' }}
            className="uppercase"
          >
            {footer}
          </span>

          {/* Right rule */}
          <div
            className="flex-1"
            style={{
              height: 'round(50%, 1px)',
              borderBottom: '1px solid var(--color-ctrl-border-inactive)',
            }}
          />
          {/* Small right corner ¬ flipped bottom */}
          <div
            className="shrink-0"
            style={{
              width: 4,
              height: 'round(50%, 1px)',
              borderBottom: '1px solid var(--color-ctrl-border-inactive)',
              borderRight: '1px solid var(--color-ctrl-border-inactive)',
            }}
          />
        </div>
      )}
    </BaseCollapsible.Root>
  );
}
