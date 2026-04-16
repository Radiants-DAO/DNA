'use client';

// =============================================================================
// PanelTitle — Top-level panel heading with trailing rule
//
// Paper ref: 01 — Page Title
// Large monospace text in cream with glow, followed by a right-angle rule ornament.
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
      <div className="flex items-end gap-2 h-6 shrink-0">
        <h2
          className="font-mono text-lg leading-6 uppercase tracking-wider shrink-0"
          style={{
            color: 'var(--color-main)',
            textShadow:
              'var(--color-ctrl-glow) 0 0 0.5px, var(--color-ctrl-glow) 0 0 3px, var(--color-main) 0 0 10px',
          }}
        >
          {title}
        </h2>
        {/* Right-angle rule ornament */}
        <div
          className="relative"
          style={{
            width: '100%',
            height: 'round(50%, 1px)',
            borderTop: '1px solid var(--color-ctrl-border-active)',
            borderRight: '1px solid var(--color-ctrl-border-active)',
          }}
        />
      </div>

      {subtitle && (
        <span className="font-mono text-ctrl-label text-[0.5rem] uppercase tracking-wider">
          {subtitle}
        </span>
      )}
    </div>
  );
}
