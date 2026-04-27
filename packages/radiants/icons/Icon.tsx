'use client';

import { memo, useEffect, useState, type ComponentType } from 'react';

import { getIconImporter, resolveIconRequest } from './resolve-icon';
import type { IconProps, IconSet } from './types';

type LoadedIcon = ComponentType<IconProps>;

function renderPlaceholder(size: number, className: string, ariaLabel?: string) {
  return (
    <span
      className={className}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
      }}
    />
  );
}

function IconComponent({
  name,
  size: sizeProp,
  large = false,
  className = '',
  'aria-label': ariaLabel,
}: IconProps) {
  const size = sizeProp ?? (large ? 24 : 16);
  const [LoadedIcon, setLoadedIcon] = useState<LoadedIcon | null>(null);

  const requestedSet: IconSet = size >= 20 ? 24 : 16;
  const { resolvedName, resolvedSet } = resolveIconRequest(name, requestedSet);

  useEffect(() => {
    let cancelled = false;

    setLoadedIcon(null);

    const importer = getIconImporter(resolvedName, resolvedSet);

    if (!importer) {
      setLoadedIcon(null);
      return;
    }

    importer()
      .then((module) => {
        if (cancelled) return;
        if (typeof module.default !== 'function') {
          throw new Error(`Icon module missing default export: ${resolvedName}`);
        }
        setLoadedIcon(() => module.default as LoadedIcon);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(
          `Failed to load icon: ${name} (resolved: ${resolvedName}, set: ${resolvedSet}px)`,
          err,
        );
        setLoadedIcon(null);
      });

    return () => {
      cancelled = true;
    };
  }, [name, resolvedName, resolvedSet]);

  if (!LoadedIcon) {
    return renderPlaceholder(size, className, ariaLabel);
  }

  return (
    <LoadedIcon
      name={resolvedName}
      size={size}
      className={className}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      focusable={ariaLabel ? undefined : false}
    />
  );
}

export const Icon = memo(IconComponent);
Icon.displayName = 'Icon';
