'use client';

import React from 'react';
import { Card, Switch, Slider, Divider } from '@rdna/radiants/components/core';
import { WindowContent } from '@/components/Rad_os';
import { usePreferencesStore } from '@/store';
import { AppProps } from '@/lib/constants';

// ============================================================================
// Component
// ============================================================================

export function SettingsApp({ windowId }: AppProps) {
  const {
    volume,
    setVolume,
    reduceMotion,
    toggleReduceMotion,
    darkMode,
    toggleDarkMode,
    invertMode,
    toggleInvertMode,
  } = usePreferencesStore();

  return (
    <WindowContent>
      <div className="max-w-[28rem] mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-1">Settings</h1>
          <p>
            Customize your RadOS experience
          </p>
        </div>

        {/* Audio Settings */}
        <section>
          <h2 className="mb-3">
            Audio
          </h2>
          <Card className="p-4">
            <div className="space-y-4">
              {/* Volume Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label>
                    Volume
                  </label>
                  <span className="font-mono text-xs text-content-muted">
                    {volume}%
                  </span>
                </div>
                <Slider
                  value={volume}
                  onChange={setVolume}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </Card>
        </section>

        <Divider />

        {/* Accessibility Settings */}
        <section>
          <h2 className="mb-3">
            Accessibility
          </h2>
          <Card className="p-4">
            <div className="space-y-4">
              {/* Reduce Motion */}
              <div className="flex items-center justify-between">
                <div>
                  <p>
                    Reduce Motion
                  </p>
                  <p>
                    Disable animations and WebGL effects
                  </p>
                </div>
                <Switch
                  checked={reduceMotion}
                  onChange={toggleReduceMotion}
                />
              </div>
            </div>
          </Card>
        </section>

        <Divider />

        {/* Display Settings */}
        <section>
          <h2 className="mb-3">
            Display
          </h2>
          <Card className="p-4">
            <div className="space-y-4">
              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <p>
                    Dark Mode
                  </p>
                  <p>
                    Switch to the dark theme
                  </p>
                </div>
                <Switch
                  checked={darkMode}
                  onChange={toggleDarkMode}
                />
              </div>

              {/* Invert Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <p>
                    Invert Mode
                  </p>
                  <p>
                    Invert colors (also triggered by Konami code)
                  </p>
                </div>
                <Switch
                  checked={invertMode}
                  onChange={toggleInvertMode}
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <div className="pt-4 text-center">
          <p>
            Settings are saved automatically
          </p>
        </div>
      </div>
    </WindowContent>
  );
}

export default SettingsApp;
