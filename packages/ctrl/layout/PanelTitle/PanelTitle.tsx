'use client';

// =============================================================================
// PanelTitle — Top-level panel heading with trailing rule
//
// Paper ref: 01 — Page Title
// Large monospace text in gold with glow, followed by a gold rule line.
// =============================================================================

interface PanelTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PanelTitle({
  title,
  subtitle,
  className = '',
}: PanelTitleProps) {
  return (
    <div
      data-rdna="ctrl-panel-title"
      className={['flex flex-col gap-0.5', className].filter(Boolean).join(' ')}
    >
      <div className="flex items-center gap-3">
        <h2
          className="font-mono text-base text-ctrl-text-active uppercase tracking-wider shrink-0"
          style={{ textShadow: '0 0 10px var(--glow-sun-yellow), 0 0 20px var(--glow-sun-yellow-subtle)' }}
        >
          {title}
        </h2>
        {/* Trailing gold rule */}
        <span className="flex-1 h-px bg-ctrl-border-active" />
      </div>

      {subtitle && (
        <span className="font-mono text-ctrl-label text-[0.5rem] uppercase tracking-wider">
          {subtitle}
        </span>
      )}
    </div>
  );
}
