/**
 * Move an element left or right among its siblings.
 */
export function moveElement(el: HTMLElement, direction: 'left' | 'right'): void {
  if (!el.parentElement) return;

  if (direction === 'left' && el.previousElementSibling) {
    el.parentElement.insertBefore(el, el.previousElementSibling);
  }

  if (direction === 'right' && el.nextElementSibling) {
    el.parentElement.insertBefore(el, el.nextElementSibling.nextSibling);
  }
}
