'use client';

import { WebGLSun } from './WebGLSun';
import { Watermark } from './Watermark';

interface DesktopProps {
  children: React.ReactNode;
}

export function Desktop({ children }: DesktopProps) {
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <WebGLSun />
      </div>

      {/* Watermark — visible around/behind the window */}
      <Watermark />

      {/* App window layer */}
      <div className="relative z-[100] flex items-center justify-center w-full h-full p-8 pb-16">
        {children}
      </div>
    </div>
  );
}
