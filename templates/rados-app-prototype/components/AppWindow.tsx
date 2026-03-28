import type { AppWindowProps } from '../lib/types';

export function AppWindow({
  title,
  children,
  titleBarActions
}: AppWindowProps) {
  return (
    <section className="flex h-full flex-col overflow-hidden pixel-rounded-lg border border-line bg-card shadow-[var(--shadow-floating)]">
      <header className="flex items-center gap-3 border-b border-line bg-depth/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-danger" />
          <span className="h-3 w-3 rounded-full bg-warning" />
          <span className="h-3 w-3 rounded-full bg-success" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-mute">
          {title}
        </span>
        <div className="ml-auto flex items-center gap-2">{titleBarActions}</div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}
