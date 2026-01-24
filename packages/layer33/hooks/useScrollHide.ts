'use client';

import { useState, useEffect, useRef } from 'react';

interface UseScrollHideOptions {
  /** Scroll distance threshold in pixels before nav starts hiding (default: 100) */
  threshold?: number;
}

interface UseScrollHideReturn {
  /** Transform translateY percentage (0 to -100) */
  translateY: number;
  /** Opacity value (0 to 1) */
  opacity: number;
  /** Whether nav is currently hidden */
  isHidden: boolean;
}

/**
 * Hook that tracks scroll direction and calculates transform/opacity values
 * for hiding/showing navigation based on scroll behavior.
 * 
 * - Scrolling down: nav slides out and fades based on distance scrolled
 * - Scrolling up: nav immediately slides back in
 */
export function useScrollHide(options?: UseScrollHideOptions): UseScrollHideReturn {
  const { threshold = 100 } = options || {};
  
  // Initialize state with window values (will be 0 in SSR, updated in effect)
  const [scrollY, setScrollY] = useState(() => 
    typeof window !== 'undefined' ? window.scrollY : 0
  );
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [directionChangeScrollY, setDirectionChangeScrollY] = useState(() =>
    typeof window !== 'undefined' ? window.scrollY : 0
  );
  const lastScrollY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const newDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
      
      // Track when direction changes
      setScrollDirection((prevDirection) => {
        if (newDirection !== prevDirection) {
          setDirectionChangeScrollY(currentScrollY);
          return newDirection;
        }
        return prevDirection;
      });
      
      setScrollY(currentScrollY);
      lastScrollY.current = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate transform and opacity based on scroll direction and distance
  let translateY = 0;
  let opacity = 1;

  if (scrollDirection === 'down') {
    // Scrolling down: slide out based on distance scrolled since direction change
    const scrollDistance = scrollY - directionChangeScrollY;
    const progress = Math.min(scrollDistance / threshold, 1);
    translateY = progress * -100; // 0 to -100%
    opacity = Math.max(1 - progress, 0); // 1 to 0
  } else {
    // Scrolling up: always show (immediately slide back in)
    translateY = 0;
    opacity = 1;
  }

  const isHidden = opacity === 0;

  return {
    translateY,
    opacity,
    isHidden,
  };
}
