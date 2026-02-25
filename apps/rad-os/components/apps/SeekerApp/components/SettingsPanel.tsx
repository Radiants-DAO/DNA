'use client';

import { Icon } from '@/components/icons';
import { usePreferencesStore } from '@/store';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { darkMode, toggleDarkMode } = usePreferencesStore();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="absolute inset-0 bg-pure-black/40 z-10"
          onClick={onClose}
        />
      )}

      {/* Sheet */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-surface-elevated border-t border-edge-muted rounded-t-2xl transition-transform duration-200 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full bg-edge-muted" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-edge-muted">
          <span className="font-joystix text-xs text-content-primary tracking-wider">SETTINGS</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-content-muted hover:text-content-primary transition-colors"
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        {/* Settings rows */}
        <div className="px-5 py-4 space-y-1 pb-8">
          <p className="font-mono text-[10px] text-content-muted uppercase tracking-widest mb-3">
            Display
          </p>

          {/* Dark mode row */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Icon
                name={darkMode ? 'lightbulb2' : 'lightbulb'}
                size={16}
                className="text-action-primary"
              />
              <span className="font-mono text-sm text-content-primary">Dark mode</span>
            </div>

            {/* Toggle switch */}
            <button
              onClick={toggleDarkMode}
              aria-pressed={darkMode}
              aria-label="Toggle dark mode"
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                darkMode ? 'bg-action-primary' : 'bg-edge-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface-primary shadow transition-transform duration-200 ${
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
