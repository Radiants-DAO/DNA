'use client';

import { createContext, use } from 'react';

interface CompoundContextOptions {
  errorMessage?: string;
}

export function createCompoundContext<T>(
  componentName: string,
  options: CompoundContextOptions = {},
) {
  const Context = createContext<T | null>(null);
  Context.displayName = `${componentName}Context`;

  function useCompoundContext() {
    const context = use(Context);
    if (context === null) {
      throw new Error(
        options.errorMessage ?? `${componentName} components must be used within ${componentName}.Provider`,
      );
    }
    return context;
  }

  return {
    Context,
    useCompoundContext,
  };
}
