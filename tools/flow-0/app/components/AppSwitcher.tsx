import { ThemeSelector } from "./ThemeSelector";

/**
 * AppSwitcher - Now delegates to ThemeSelector which handles both theme + app selection.
 * Kept as re-export for backward compatibility.
 */
export function AppSwitcher({ className }: { className?: string }) {
  return <ThemeSelector />;
}

export default AppSwitcher;
