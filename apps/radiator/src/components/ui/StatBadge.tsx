interface StatBadgeProps {
  label: string;
  value: string;
}

export function StatBadge({ label, value }: StatBadgeProps) {
  return (
    <div className="bg-depth border border-line pixel-rounded-sm px-3 py-2 flex items-center gap-2">
      <span className="font-joystix text-xs uppercase text-mute">
        {label}
      </span>
      <span className="font-joystix text-xs uppercase text-head">
        {value}
      </span>
    </div>
  );
}
