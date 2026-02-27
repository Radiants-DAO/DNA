'use client';

import { Desktop } from '@/components/shell/Desktop';
import { AppWindow } from '@/components/shell/AppWindow';
import { Taskbar } from '@/components/shell/Taskbar';
import { RadiatorApp } from '@/components/RadiatorApp';

export default function Home() {
  return (
    <Desktop>
      <AppWindow>
        <RadiatorApp />
      </AppWindow>
      <Taskbar />
    </Desktop>
  );
}
