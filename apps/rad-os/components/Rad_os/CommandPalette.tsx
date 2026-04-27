'use client';

import { useEffect, useState } from 'react';
import { Command as Cmdk } from 'cmdk';
import {
  APP_CATALOG,
  START_MENU_CATEGORIES,
  START_MENU_LINKS,
} from '@/lib/apps';
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
      className="cmdk-shell"
    >
      <div className="cmdk-surface pixel-rounded-6 pixel-shadow-floating bg-page">
        <Cmdk.Input
          placeholder="LAUNCH AN APP..."
          className="cmdk-input"
        />
        <Cmdk.List className="cmdk-list">
          <Cmdk.Empty className="cmdk-empty">No apps found.</Cmdk.Empty>
          {START_MENU_CATEGORIES.filter((c) => c.id !== 'links').map((cat) => {
            const apps = APP_CATALOG.filter((app) => app.category === cat.id);
            if (!apps.length) return null;
            return (
              <Cmdk.Group key={cat.id} heading={cat.label}>
                {apps.map((app) => (
                  <Cmdk.Item
                    key={app.id}
                    value={app.launcherTitle ?? app.windowTitle}
                    onSelect={() => handleSelect(app.id)}
                    className="cmdk-item"
                  >
                    <span className="cmdk-item-icon">
                      {app.launcherIcon ?? app.windowIcon}
                    </span>
                    <span className="cmdk-item-label">
                      {app.launcherTitle ?? app.windowTitle}
                    </span>
                  </Cmdk.Item>
                ))}
              </Cmdk.Group>
            );
          })}
          <Cmdk.Group heading="Links">
            {START_MENU_LINKS.map((link) => (
              <Cmdk.Item
                key={link.id}
                value={link.label}
                onSelect={() => {
                  window.open(link.href, '_blank', 'noopener,noreferrer');
                  setOpen(false);
                }}
                className="cmdk-item"
              >
                <span className="cmdk-item-icon">{link.icon}</span>
                <span className="cmdk-item-label">{link.label}</span>
              </Cmdk.Item>
            ))}
          </Cmdk.Group>
        </Cmdk.List>
      </div>
    </Cmdk.Dialog>
  );
}
