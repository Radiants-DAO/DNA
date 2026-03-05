import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

/**
 * Simple test render helper for radiants components.
 * Extend with providers as needed.
 */
export function renderComponent(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { ...options });
}
