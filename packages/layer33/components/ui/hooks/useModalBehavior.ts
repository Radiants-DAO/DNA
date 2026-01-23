import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook to handle escape key press to close modals/overlays
 * @param isActive - Whether the modal is currently open
 * @param onEscape - Callback to close the modal
 */
export function useEscapeKey(isActive: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isActive, onEscape]);
}

/**
 * Hook to detect clicks outside of specified element(s)
 * @param isActive - Whether to listen for clicks
 * @param refs - Array of refs to elements that should NOT trigger the callback
 * @param onClickOutside - Callback when clicking outside all refs
 */
export function useClickOutside(
  isActive: boolean,
  refs: RefObject<HTMLElement | null>[],
  onClickOutside: () => void
): void {
  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = (e: MouseEvent) => {
      const clickedOutsideAll = refs.every(
        (ref) => ref.current && !ref.current.contains(e.target as Node)
      );
      if (clickedOutsideAll) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActive, refs, onClickOutside]);
}

/**
 * Hook to prevent body scroll when modal is open
 * @param isActive - Whether to lock body scroll
 */
export function useLockBodyScroll(isActive: boolean): void {
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isActive]);
}

/**
 * Hook to trap focus within a container element
 * @param isActive - Whether the focus trap is active
 * @param containerRef - Ref to the container element
 */
export function useFocusTrap(
  isActive: boolean,
  containerRef: RefObject<HTMLElement | null>
): void {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusableElements = () =>
      Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));

    // Focus the first focusable element or the container itself
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      container.setAttribute('tabindex', '-1');
      container.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the previously focused element
      previousActiveElement.current?.focus();
    };
  }, [isActive, containerRef]);
}
