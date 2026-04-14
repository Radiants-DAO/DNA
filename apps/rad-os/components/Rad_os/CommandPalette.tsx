'use client';

import { useEffect, useState } from 'react';
import { Command as Cmdk } from 'cmdk';
import { APP_CATALOG } from '@/lib/apps';
import { useWindowManager } from '@/hooks/useWindowManager';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { openWindow } = useWindowManager();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleSelect(appId: string) {
    openWindow(appId);
    setOpen(false);
  }

  return (
    <Cmdk.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Launch app"
      overlayClassName="cmdk-overlay"
      contentClassName="cmdk-content"
    >
      <Cmdk.Input
        placeholder="Launch an app..."
        className="cmdk-input"
      />
      <Cmdk.List className="cmdk-list">
        <Cmdk.Empty className="cmdk-empty">No apps found.</Cmdk.Empty>
        <Cmdk.Group heading="Apps">
          {APP_CATALOG.map((app) => (
            <Cmdk.Item
              key={app.id}
              value={app.launcherTitle ?? app.windowTitle}
              onSelect={() => handleSelect(app.id)}
              className="cmdk-item"
            >
              <span className="cmdk-item-icon">{app.launcherIcon ?? app.windowIcon}</span>
              <span>{app.launcherTitle ?? app.windowTitle}</span>
            </Cmdk.Item>
          ))}
        </Cmdk.Group>
      </Cmdk.List>
    </Cmdk.Dialog>
  );
}
