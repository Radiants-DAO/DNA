'use client';

import React from 'react';

// ============================================================================
// ModalShell — shared Header/Body/Footer/Title/Description sub-primitives for
// Dialog, AlertDialog, Sheet, and Drawer.
//
// Each modal file re-exports these under its own namespace (Dialog.Header,
// AlertDialog.Header, Sheet.Header, Drawer.Header) so the public component API
// stays identical for consumers. Previously these 12 functions (Header, Body,
// Footer, Title, Description × 4 files) were byte-identical copies; see
// `archive/brainstorms-ideas-ops-audit-2026-04-25/ops/cleanup-audit/css-overscope/02-modals.md` F4/F5.
//
// Title + Description must render a specific Base UI primitive per modal
// family (BaseDialog.Title, BaseAlertDialog.Title, BaseDrawer.Title), so they
// accept an `as` prop. Header / Body / Footer are plain divs and fully shared.
//
// Note on Body padding: Sheet and Drawer extend the body with
// `flex-1 overflow-auto` so it fills the remaining popup height; Dialog and
// AlertDialog don't. The `scrollable` prop exposes that, defaulting false.
// ============================================================================

// ---------------------------------------------------------------------------
// Shared trigger/close class — was repeated 18+ times across the four modal
// files on Trigger / Close in both `asChild` and non-`asChild` branches.
// (see audit F11)
// ---------------------------------------------------------------------------
export const MODAL_TRIGGER_CLASS = 'cursor-pointer focus-visible:outline-none';

// ---------------------------------------------------------------------------
// Shared section class strings — exported so each modal file can pass them
// through to Base UI primitives (e.g. `BaseDialog.Title className={...}`).
// ---------------------------------------------------------------------------
const HEADER_CLASS = 'px-6 pt-6 pb-4 border-b border-rule';
const HEADER_CLASS_COMPACT = 'px-6 pt-4 pb-4 border-b border-rule'; // Drawer
const BODY_CLASS = 'px-6 py-4';
const BODY_CLASS_SCROLLABLE = 'px-6 py-4 flex-1 overflow-auto';
const FOOTER_CLASS = 'px-6 pb-6 pt-4 border-t border-rule flex justify-end gap-2';
const TITLE_CLASS = 'font-heading text-base uppercase tracking-tight leading-none text-main text-balance';
const DESCRIPTION_CLASS = 'font-sans text-base text-sub mt-2 text-pretty';

function joinClasses(base: string, extra: string): string {
  return extra ? `${base} ${extra}` : base;
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
interface ShellHeaderProps {
  className?: string;
  children: React.ReactNode;
  /** Use reduced top padding (Drawer). Defaults to false (Dialog/Sheet spacing). */
  compact?: boolean;
}

function Header({ className = '', children, compact = false }: ShellHeaderProps): React.ReactNode {
  return (
    <div className={joinClasses(compact ? HEADER_CLASS_COMPACT : HEADER_CLASS, className)}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------
interface ShellBodyProps {
  className?: string;
  children: React.ReactNode;
  /**
   * Grow to fill remaining popup height and scroll overflow internally.
   * Sheet/Drawer pass `true`; Dialog/AlertDialog default to `false`.
   */
  scrollable?: boolean;
}

function Body({ className = '', children, scrollable = false }: ShellBodyProps): React.ReactNode {
  return (
    <div className={joinClasses(scrollable ? BODY_CLASS_SCROLLABLE : BODY_CLASS, className)}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
interface ShellFooterProps {
  className?: string;
  children: React.ReactNode;
}

function Footer({ className = '', children }: ShellFooterProps): React.ReactNode {
  return (
    <div className={joinClasses(FOOTER_CLASS, className)}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Title / Description — accept the Base UI primitive via `as` so Dialog,
// AlertDialog, Sheet, and Drawer all render their correct namespaced element.
// ---------------------------------------------------------------------------

// Minimal component shape we need: accepts className + children and renders
// an element. Every Base UI *.Title / *.Description matches this.
type TitleLikeComponent = React.ComponentType<{
  className?: string;
  children?: React.ReactNode;
}>;

interface ShellTitleProps {
  as: TitleLikeComponent;
  className?: string;
  children: React.ReactNode;
}

function Title({ as: Component, className = '', children }: ShellTitleProps): React.ReactNode {
  return (
    <Component className={joinClasses(TITLE_CLASS, className)}>
      {children}
    </Component>
  );
}

interface ShellDescriptionProps {
  as: TitleLikeComponent;
  className?: string;
  children: React.ReactNode;
}

function Description({ as: Component, className = '', children }: ShellDescriptionProps): React.ReactNode {
  return (
    <Component className={joinClasses(DESCRIPTION_CLASS, className)}>
      {children}
    </Component>
  );
}

// ---------------------------------------------------------------------------
// Namespace export
// ---------------------------------------------------------------------------
export const ModalShell = {
  Header,
  Body,
  Footer,
  Title,
  Description,
};
