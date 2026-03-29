'use client';

import type { AppProps } from '@/lib/apps';
import { ControlSurfaceLab } from '@/components/apps/control-surface-lab';

export function ControlSurfaceLabApp({ windowId: _windowId }: AppProps) {
  return <ControlSurfaceLab />;
}

export default ControlSurfaceLabApp;
