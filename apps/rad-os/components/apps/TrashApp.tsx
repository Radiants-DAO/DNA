'use client';

import React, { Suspense } from 'react';
import { Button, Card, CardBody, Badge } from '@rdna/radiants/components/core';
import { Icon } from '@rdna/radiants/icons';
import { WindowContent } from '@/components/Rad_os';
import { type AppProps, getTrashedAppConfigs } from '@/lib/constants';
import { useWindowsStore } from '@/store';

export function TrashApp({ windowId }: AppProps) {
  const { openWindow } = useWindowsStore();
  const trashedApps = getTrashedAppConfigs();
  const isEmpty = trashedApps.length === 0;

  return (
    <WindowContent padding="md">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-sub">
          <Icon name="trash" size={48} className="opacity-40" />
          <p className="font-mondwest text-sm">Trash is empty</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-sub font-mondwest px-1">
            {trashedApps.length} {trashedApps.length === 1 ? 'app' : 'apps'} in trash
          </p>
          {trashedApps.map((app) => (
            <Card key={app.id} className="group">
              <CardBody className="flex items-center gap-3 py-2 px-3">
                <span className="shrink-0 opacity-60">{app.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mondwest text-sm text-main truncate">
                      {app.title}
                    </span>
                    {app.trashedDate && (
                      <Badge variant="default" className="text-xs shrink-0">
                        {app.trashedDate}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  mode="ghost"
                  onClick={() => openWindow(app.id, app.defaultSize)}
                >
                  Open
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </WindowContent>
  );
}

export default TrashApp;
