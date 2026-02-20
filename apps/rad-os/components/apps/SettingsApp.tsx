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
    invertMode,
    toggleInvertMode,
  } = usePreferencesStore();

  return (
    <WindowContent>
      <div className="max-w-[28rem] mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-joystix text-lg text-primary mb-1">Settings</h1>
          <p className="font-mondwest text-sm text-primary/60">
            Customize your RadOS experience
          </p>
        </div>

        {/* Audio Settings */}
        <section>
          <h2 className="font-joystix text-xs text-primary/60 uppercase mb-3">
            Audio
          </h2>
          <Card className="p-4">
            <div className="space-y-4">
              {/* Volume Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mondwest text-sm text-primary">
                    Volume
                  </label>
                  <span className="font-mono text-xs text-primary/60">
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
          <h2 className="font-joystix text-xs text-primary/60 uppercase mb-3">
            Accessibility
          </h2>
          <Card className="p-4">
            <div className="space-y-4">
              {/* Reduce Motion */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mondwest text-sm text-primary">
                    Reduce Motion
                  </p>
                  <p className="font-mondwest text-xs text-primary/60">
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
          <h2 className="font-joystix text-xs text-primary/60 uppercase mb-3">
            Display
          </h2>
          <Card className="p-4">
            <div className="space-y-4">
              {/* Invert Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mondwest text-sm text-primary">
                    Invert Mode
                  </p>
                  <p className="font-mondwest text-xs text-primary/60">
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
          <p className="font-mono text-xs text-primary/40">
            Settings are saved automatically
          </p>
        </div>
      </div>
    </WindowContent>
  );
}

export default SettingsApp;
