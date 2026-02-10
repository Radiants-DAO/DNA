import { Search, X } from "./icons";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  loading?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  onSubmit,
  loading = false,
}: SearchInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500">
        {loading ? (
          <span className="animate-spin">
            <Search className="w-3 h-3" />
          </span>
        ) : (
          <Search className="w-3 h-3" />
        )}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onSubmit ? handleKeyDown : undefined}
        placeholder={placeholder}
        className="w-full pl-7 pr-8 py-1.5 text-xs text-neutral-200 bg-neutral-800 border border-neutral-700 rounded outline-none focus:border-blue-500/50 placeholder:text-neutral-500/50"
        aria-label={placeholder}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
