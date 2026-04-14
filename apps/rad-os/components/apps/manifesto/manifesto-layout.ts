import type { PreparedTextWithSegments } from '@chenglou/pretext';
import type { ManifestoElement } from './manifesto-data';
import {
  paginateBookLayout,
  type BookLayoutBlock,
  type BookObstacle,
  type BookPage,
  type BookPageEl,
  type BookPaginationResult,
} from '../pretext/primitives/book/book-layout';

const MANIFESTO_COLUMNS = 2 as const;

export type PageEl = BookPageEl;
export type Page = BookPage;
export type PaginationResult = BookPaginationResult;
export type ImageObstacle = BookObstacle;

function toBookLayoutBlock(element: ManifestoElement): BookLayoutBlock {
  switch (element.kind) {
    case 'heading':
      return { kind: 'heading', text: element.text };

    case 'section-title':
      return { kind: 'section-title', text: element.text };

    case 'paragraph':
      return { kind: 'paragraph', text: element.text };

    case 'rule':
      return { kind: 'rule' };
  }
}

export function paginateManifesto(
  elements: ManifestoElement[],
  pageWidth: number,
  pageHeight: number,
  imageObstacles: ImageObstacle[],
  cache: Map<string, PreparedTextWithSegments>,
): PaginationResult {
  return paginateBookLayout({
    blocks: elements.map(toBookLayoutBlock),
    pageWidth,
    pageHeight,
    columns: MANIFESTO_COLUMNS,
    obstacles: imageObstacles,
    cache,
  });
}
