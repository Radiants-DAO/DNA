interface StatBadgeProps {
  label: string;
  value: string;
}

export function StatBadge({ label, value }: StatBadgeProps) {
  return (
    <div className="bg-surface-muted border border-edge-primary rounded-sm px-3 py-2 flex items-center gap-2">
      <span className="font-joystix text-xs uppercase text-content-muted">
        {label}
      </span>
      <span className="font-joystix text-xs uppercase text-content-heading">
        {value}
      </span>
    </div>
  );
}
