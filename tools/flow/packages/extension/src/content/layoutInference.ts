import type { LayoutStructure } from '@flow/shared';

/**
 * Infer the layout structure of an element from its computed styles.
 */
export function inferLayoutStructure(element: Element): LayoutStructure {
  const computed = getComputedStyle(element);
  const display = computed.display;

  if (display.includes('grid')) {
    return inferGrid(element, computed);
  }

  if (display.includes('flex')) {
    return inferFlex(computed);
  }

  if (display === 'inline' || display === 'inline-block') {
    return { type: 'inline' };
  }

  if (display === 'none') {
    return { type: 'none' };
  }

  return { type: 'block' };
}

function inferGrid(element: Element, computed: CSSStyleDeclaration): LayoutStructure {
  const templateCols = computed.gridTemplateColumns;
  const templateRows = computed.gridTemplateRows;
  const gap = computed.gap;

  // Infer column count from template
  let inferredColumns: number | undefined;
  if (templateCols && templateCols !== 'none') {
    // Count space-separated values (each is a track)
    inferredColumns = templateCols.split(/\s+/).length;
  }

  // Infer row count from template or children
  let inferredRows: number | undefined;
  if (templateRows && templateRows !== 'none') {
    inferredRows = templateRows.split(/\s+/).length;
  } else if (inferredColumns) {
    const childCount = element.children.length;
    inferredRows = Math.ceil(childCount / inferredColumns);
  }

  return {
    type: 'grid',
    gridTemplateColumns: templateCols !== 'none' ? templateCols : undefined,
    gridTemplateRows: templateRows !== 'none' ? templateRows : undefined,
    gridGap: gap !== 'normal' && gap !== '0px' ? gap : undefined,
    inferredColumns,
    inferredRows,
  };
}

function inferFlex(computed: CSSStyleDeclaration): LayoutStructure {
  return {
    type: 'flex',
    flexDirection: computed.flexDirection,
    flexWrap: computed.flexWrap !== 'nowrap' ? computed.flexWrap : undefined,
    alignItems: computed.alignItems !== 'normal' ? computed.alignItems : undefined,
    justifyContent: computed.justifyContent !== 'normal' ? computed.justifyContent : undefined,
    gap: computed.gap !== 'normal' && computed.gap !== '0px' ? computed.gap : undefined,
  };
}
