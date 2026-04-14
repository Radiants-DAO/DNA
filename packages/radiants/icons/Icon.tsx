'use client';

import { memo, useEffect, useState, type ComponentType } from 'react';

import { getIconImporter, resolveIconRequest } from './resolve-icon';
import type { IconProps as SvgIconProps, IconSet } from './types';

interface IconProps {
  /** Icon name (filename without .svg extension) */
  name: string;
  /** Render size in CSS pixels. Generated assets come from the 16px or 24px sets. */
  size?: number;
  /** When true, renders at 24px (1.5rem) using the 24px icon set. Default: 16px (1rem). */
  large?: boolean;
  /** Additional CSS classes for styling (use text-* for color) */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** Optional asset host/path override. Non-default values use fetched SVG compatibility loading. */
  basePath?: string;
}

type LoadedIcon = ComponentType<SvgIconProps>;
const DEFAULT_ICON_BASE_PATH = '/assets/icons';

function normalizeBasePath(basePath: string): string {
  return basePath.replace(/\/+$/, '') || DEFAULT_ICON_BASE_PATH;
}

function buildIconAssetUrl(basePath: string, name: string, iconSet: IconSet): string {
  return `${normalizeBasePath(basePath)}/${iconSet}px/${name}.svg`;
}

function decorateFetchedSvg(svg: string, className: string): string {
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
    return svg;
  }

  const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const element = parsed.querySelector('svg');

  if (!element) {
    return svg;
  }

  element.setAttribute('width', '100%');
  element.setAttribute('height', '100%');
  element.setAttribute('focusable', 'false');
  element.setAttribute('aria-hidden', 'true');

  if (className) {
    element.setAttribute('class', className);
  } else {
    element.removeAttribute('class');
  }

  return new XMLSerializer().serializeToString(element);
}

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

/**
 * Dynamic Icon component.
 *
 * The public API stays name-based. Default loading resolves through generated
 * import maps, while non-default `basePath` values retain the fetched SVG
 * compatibility path.
 */
function IconComponent({
  name,
  size: sizeProp,
  large = false,
  className = '',
  'aria-label': ariaLabel,
  basePath = DEFAULT_ICON_BASE_PATH,
}: IconProps) {
  const size = sizeProp ?? (large ? 24 : 16);
  const [LoadedIcon, setLoadedIcon] = useState<LoadedIcon | null>(null);
  const [fetchedSvg, setFetchedSvg] = useState<string | null>(null);

  const requestedSet: IconSet = size >= 20 ? 24 : 16;
  const { resolvedName, resolvedSet } = resolveIconRequest(name, requestedSet);
  const normalizedBasePath = normalizeBasePath(basePath);
  const shouldFetchFromBasePath = normalizedBasePath !== DEFAULT_ICON_BASE_PATH;

  useEffect(() => {
    let cancelled = false;

    setLoadedIcon(null);
    setFetchedSvg(null);

    if (shouldFetchFromBasePath) {
      fetch(buildIconAssetUrl(normalizedBasePath, resolvedName, resolvedSet))
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.text();
        })
        .then((svg) => {
          if (cancelled) return;
          setFetchedSvg(svg);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error(
            `Failed to fetch icon: ${name} (resolved: ${resolvedName}, set: ${resolvedSet}px, basePath: ${normalizedBasePath})`,
            err,
          );
          setFetchedSvg(null);
        });

      return () => {
        cancelled = true;
      };
    }

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
  }, [name, normalizedBasePath, resolvedName, resolvedSet, shouldFetchFromBasePath]);

  if (shouldFetchFromBasePath) {
    if (!fetchedSvg) {
      return renderPlaceholder(size, className, ariaLabel);
    }

    return (
      <span
        aria-label={ariaLabel}
        aria-hidden={!ariaLabel}
        style={{
          width: size,
          height: size,
          display: 'inline-block',
          lineHeight: 0,
        }}
        dangerouslySetInnerHTML={{ __html: decorateFetchedSvg(fetchedSvg, className) }}
      />
    );
  }

  if (!LoadedIcon) {
    return renderPlaceholder(size, className, ariaLabel);
  }

  return (
    <LoadedIcon
      size={size}
      className={className}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      focusable={ariaLabel ? undefined : false}
    />
  );
}

export const Icon = memo(IconComponent);
