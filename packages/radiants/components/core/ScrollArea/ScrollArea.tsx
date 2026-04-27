'use client';

import React from 'react';

type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

interface ScrollAreaRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  orientation?: ScrollAreaOrientation;
}

const overflowByOrientation: Record<ScrollAreaOrientation, string> = {
  vertical: 'overflow-y-auto overflow-x-hidden',
  horizontal: 'overflow-x-auto overflow-y-hidden',
  both: 'overflow-auto',
};

function Root({
  children,
  className = '',
  style,
  orientation = 'vertical',
  ...props
}: ScrollAreaRootProps): React.ReactNode {
  return (
    <div
      data-rdna="scrollarea"
      className={`relative ${overflowByOrientation[orientation]} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

interface ViewportProps {
  children: React.ReactNode;
  className?: string;
}

function Viewport({ children, className = '' }: ViewportProps): React.ReactNode {
  return (
    <div data-rdna="scrollarea-viewport" className={`h-full ${className}`.trim()}>
      {children}
    </div>
  );
}

export const ScrollArea = {
  Root,
  Viewport,
};
