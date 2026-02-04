/**
 * Penetrate shadow DOM boundaries to find the deepest element at point.
 * Pattern from VisBug: recursively checks shadowRoot.elementFromPoint.
 */
export function deepElementFromPoint(
  x: number,
  y: number,
  elementFromPoint: (x: number, y: number) => Element | null = (x, y) =>
    document.elementFromPoint(x, y)
): Element | null {
  const el = elementFromPoint(x, y);

  const crawl = (node: Element | null): Element | null => {
    if (!node) return null;
    const shadow = (node as HTMLElement).shadowRoot;
    if (!shadow) return node;
    const candidate = shadow.elementFromPoint(x, y);
    if (!candidate || candidate === node) return node;
    return crawl(candidate as Element);
  };

  return crawl(el);
}
