'use client';

import { Button } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons';
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
          // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:modal-backdrop-requires-true-black-overlay owner:rad-os expires:2026-12-31 issue:DNA-999
          className="absolute inset-0 bg-pure-black/40 z-10"
          onClick={onClose}
        />
      )}

      {/* Sheet */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-card border-t border-rule rounded-t-2xl transition-transform duration-200 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full bg-rule" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-rule">
          <span className="font-joystix text-sm text-main tracking-wider">SETTINGS</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-mute hover:text-main transition-colors"
          >
            <Icon name="close" size={14} />
          </Button>
        </div>

        {/* Settings rows */}
        <div className="px-5 py-4 space-y-1 pb-8">
          <p className="mb-3">
            Display
          </p>

          {/* Dark mode row */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Icon
                name={darkMode ? 'lightbulb2' : 'lightbulb'}
                size={16}
                className="text-accent"
              />
              <span className="font-mono text-sm text-main">Dark mode</span>
            </div>

            {/* Toggle switch */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              aria-pressed={darkMode}
              aria-label="Toggle dark mode"
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                darkMode ? 'bg-accent' : 'bg-rule'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-page shadow transition-transform duration-200 ${
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
