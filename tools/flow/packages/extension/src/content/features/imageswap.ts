/**
 * Get the target images from a selection.
 */
export function getTargetImages(
  selected: HTMLImageElement[]
): HTMLImageElement[] {
  return selected;
}

/**
 * Swap the src of an image element.
 */
export function swapImageSrc(
  img: HTMLImageElement,
  newSrc: string
): { oldSrc: string; newSrc: string } {
  const oldSrc = img.src;
  img.src = newSrc;
  return { oldSrc, newSrc };
}
