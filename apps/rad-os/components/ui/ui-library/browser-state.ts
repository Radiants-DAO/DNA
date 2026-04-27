'use client';

import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { registry, CATEGORY_LABELS } from '@rdna/radiants/registry';
import type { RegistryEntry, ComponentCategory } from '@rdna/radiants/registry';

const CARD_INTERSECTION_ROOT_MARGIN = '240px 0px';

export interface GroupedCategory {
  category: ComponentCategory;
  label: string;
  entries: RegistryEntry[];
}

function getSearchableText(entry: RegistryEntry): string {
  return [
    entry.name,
    entry.description,
    entry.category,
    ...(entry.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();
}

export function filterRegistryEntries(
  searchQuery: string,
  activeCategory: ComponentCategory | 'all',
): RegistryEntry[] {
  const query = searchQuery.toLowerCase();

  return registry.filter((entry) => {
    if (activeCategory !== 'all' && entry.category !== activeCategory) return false;
    if (!query) return true;
    return getSearchableText(entry).includes(query);
  });
}

export function groupRegistryEntries(entries: RegistryEntry[]): GroupedCategory[] {
  const groups: GroupedCategory[] = [];
  let current: GroupedCategory | null = null;

  for (const entry of entries) {
    if (!current || current.category !== entry.category) {
      current = {
        category: entry.category,
        label: CATEGORY_LABELS[entry.category],
        entries: [],
      };
      groups.push(current);
    }
    current.entries.push(entry);
  }

  return groups;
}

export function useRegistryBrowserEntries(
  searchQuery: string,
  activeCategory: ComponentCategory | 'all',
) {
  const filtered = useMemo(
    () => filterRegistryEntries(searchQuery, activeCategory),
    [searchQuery, activeCategory],
  );
  const grouped = useMemo(() => groupRegistryEntries(filtered), [filtered]);

  return { filtered, grouped };
}

export function useDeferredContent(
  shouldDefer: boolean,
  rootRef: RefObject<HTMLElement | null>,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(() => !shouldDefer);

  useEffect(() => {
    if (!shouldDefer || isReady) return;

    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      const frame = window.requestAnimationFrame(() => {
        setIsReady(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        startTransition(() => {
          setIsReady(true);
        });
        observer.disconnect();
      },
      {
        root: rootRef.current,
        rootMargin: CARD_INTERSECTION_ROOT_MARGIN,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isReady, rootRef, shouldDefer]);

  return { containerRef, isReady };
}
