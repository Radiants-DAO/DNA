/**
 * StatusBar - Bottom status bar showing file path, save status, and error count
 */

interface StatusBarProps {
  filePath?: string;
  lastSaved?: Date | null;
  errorCount?: number;
}

export function StatusBar({
  filePath = "",
  lastSaved = null,
  errorCount = 0,
}: StatusBarProps) {
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return "Not saved";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  return (
    <div className="h-6 bg-surface/80 border-t border-white/5 flex items-center justify-between px-4 text-xs" data-devflow-id="status-bar">
      {/* Left - File path */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted font-mono">{filePath || "No file open"}</span>
      </div>

      {/* Right - Save status and errors */}
      <div className="flex items-center gap-4">
        <span className="text-text-muted">
          Last saved: {formatLastSaved(lastSaved)}
        </span>
        <span
          className={`${
            errorCount === 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {errorCount} error{errorCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

export default StatusBar;
