'use client';

export function HoverOverlayRdna() {
  return (
    <div className="flex flex-col gap-3 w-full">
      <span className="font-heading text-xs uppercase tracking-wide text-mute">
        Hover Overlay
      </span>

      {/* Container */}
      <div className="relative h-32 border border-dashed border-rule bg-page pixel-rounded-sm overflow-hidden">
        {/* Target element */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-10 border border-accent/30 bg-accent/5 pixel-rounded-sm" />

        {/* Measurement guide - vertical */}
        <div className="absolute top-14 left-1/2 w-px h-6 border-l border-dashed border-accent/20" />

        {/* Measurement guide - horizontal */}
        <div className="absolute top-9 left-6 w-6 h-px border-t border-dashed border-accent/20" />
        <div className="absolute top-9 right-6 w-6 h-px border-t border-dashed border-accent/20" />

        {/* Info card */}
        <div className="absolute bottom-2 left-2 right-2 bg-card pixel-rounded-sm border border-line p-2 flex flex-col gap-0.5">
          <span className="font-mono text-xs text-main">
            div.card-wrapper
          </span>
          <span className="font-mono text-xs text-mute">
            420 &times; 280 &middot; 3 children
          </span>
        </div>
      </div>
    </div>
  );
}
