'use client';

import React, { useState } from 'react';
import { usePreferencesStore } from '@/store';
import { Divider, Button, Tooltip } from '@rdna/radiants/components/core';
import { Icon } from '@/components/icons';
import { StartMenu } from './StartMenu';

// ============================================================================
// Start Button Component (exported for use in Desktop dock)
// ============================================================================

export function StartButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Tooltip content="Start" position="top">
        <Button
          variant="primary"
          size="md"
          iconOnly={true}
          icon={<Icon name="menu" size={20} />}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Start"
        />
      </Tooltip>

      <StartMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

// ============================================================================
// Utility Bar Component (exported for top of screen)
// ============================================================================

export function UtilityBar({ className = '' }: { className?: string }) {
  const { darkMode, toggleDarkMode } = usePreferencesStore();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Tooltip content="Twitter" position="bottom">
        <Button
          variant="primary"
          size="md"
          iconOnly={true}
          icon={<Icon name="twitter" size={20} />}
          onClick={() => window.open('https://twitter.com/radiants', '_blank', 'noopener,noreferrer')}
          aria-label="Twitter"
        />
      </Tooltip>

      <Tooltip content="Discord" position="bottom">
        <Button
          variant="primary"
          size="md"
          iconOnly={true}
          icon={<Icon name="discord" size={20} />}
          onClick={() => window.open('https://discord.gg/radiants', '_blank', 'noopener,noreferrer')}
          aria-label="Discord"
        />
      </Tooltip>

      <Tooltip content={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} position="bottom">
        <Button
          variant={darkMode ? 'secondary' : 'primary'}
          size="md"
          iconOnly={true}
          icon={<Icon name="radiants-logo" size={20} />}
          onClick={toggleDarkMode}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        />
      </Tooltip>
    </div>
  );
}

export default StartButton;
