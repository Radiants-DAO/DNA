import '@testing-library/jest-dom/vitest';
import type React from 'react';
import { vi } from 'vitest';

type MockNextImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  src: string | { src?: string };
};

vi.mock('next/image', async () => {
  const ReactRuntime = await import('react');

  return {
    default({
      src,
      alt,
      fill: _fill,
      priority: _priority,
      unoptimized: _unoptimized,
      ...props
    }: MockNextImageProps) {
      return ReactRuntime.createElement('img', {
        ...props,
        src: typeof src === 'string' ? src : src.src ?? '',
        alt: alt ?? '',
      });
    },
  };
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: () =>
    ({
      font: '',
      measureText(text: string) {
        return { width: text.length * 8 };
      },
    }) as CanvasRenderingContext2D,
});

if (!('fonts' in document)) {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: {
      ready: Promise.resolve(),
    },
  });
}
