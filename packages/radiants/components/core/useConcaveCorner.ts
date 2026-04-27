'use client';

import { useMemo } from 'react';
import { concave, type ConcaveCornerConfig, type ConcaveCornerProps } from '@rdna/pixel';
import { useCornerShape } from './useCornerShape';

export type UseConcaveCornerConfig = ConcaveCornerConfig;

export function useConcaveCorner(config: UseConcaveCornerConfig): ConcaveCornerProps {
  const cornerShape = useCornerShape();

  return useMemo(
    () =>
      concave({
        ...config,
        themeShape: config.themeShape ?? cornerShape,
      }),
    [config.corner, config.radiusPx, config.shape, config.themeShape, cornerShape],
  );
}
