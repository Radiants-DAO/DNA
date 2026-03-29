'use client';

import { Desktop } from '../components/Desktop';
import { ToastProvider } from '@rdna/radiants/components/core';

export default function Page() {
  return (
    <ToastProvider>
      <Desktop />
    </ToastProvider>
  );
}
