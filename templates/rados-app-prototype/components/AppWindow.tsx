import type { AppWindowProps } from '../lib/types';

export function AppWindow({ title, children }: AppWindowProps) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_18px_80px_rgba(0,0,0,0.45)]">
      <header className="flex items-center gap-3 border-b border-line bg-panel/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-400/80" />
          <span className="h-3 w-3 rounded-full bg-amber-300/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-main/80">
          {title}
        </span>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
