import '@testing-library/jest-dom/vitest';

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
