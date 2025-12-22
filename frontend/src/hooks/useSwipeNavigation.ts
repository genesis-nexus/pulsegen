import { useRef, useCallback, TouchEvent, useState, useEffect } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // minimum swipe distance in pixels (default: 50)
  velocityThreshold?: number; // minimum velocity to trigger swipe (px/ms)
  enabled?: boolean;
}

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
}

/**
 * Custom hook for swipe gesture navigation
 *
 * Usage:
 * ```tsx
 * const swipe = useSwipeNavigation({
 *   onSwipeLeft: () => goToNextPage(),
 *   onSwipeRight: () => goToPrevPage(),
 *   threshold: 50,
 *   enabled: paginationMode !== 'all',
 * });
 *
 * <div
 *   onTouchStart={swipe.onTouchStart}
 *   onTouchMove={swipe.onTouchMove}
 *   onTouchEnd={swipe.onTouchEnd}
 * >
 *   ...
 * </div>
 * ```
 */
export function useSwipeNavigation(config: SwipeConfig): SwipeHandlers {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const isScrolling = useRef<boolean | null>(null);

  const threshold = config.threshold || 50;
  const enabled = config.enabled !== false;

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
    isScrolling.current = null; // Reset scrolling detection
  }, [enabled]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;

    // Detect if user is scrolling vertically
    if (isScrolling.current === null) {
      const deltaX = Math.abs(touchEndX.current - touchStartX.current);
      const deltaY = Math.abs(touchEndY.current - touchStartY.current);

      // If vertical movement is greater, user is scrolling
      isScrolling.current = deltaY > deltaX;
    }
  }, [enabled]);

  const onTouchEnd = useCallback(() => {
    if (!enabled || isScrolling.current) return;

    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = Math.abs(touchStartY.current - touchEndY.current);

    // Only trigger if horizontal movement is dominant and exceeds threshold
    if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        // Swiped left - go to next
        config.onSwipeLeft?.();
      } else {
        // Swiped right - go to previous
        config.onSwipeRight?.();
      }
    }

    // Reset
    isScrolling.current = null;
  }, [enabled, threshold, config]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

// Hook to detect if on mobile device
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Hook to detect touch capability
export function useHasTouch(): boolean {
  const [hasTouch, setHasTouch] = useState(false);

  useEffect(() => {
    setHasTouch(
      'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
    );
  }, []);

  return hasTouch;
}

// Hook to get viewport size
export function useViewportSize(): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
}

export default useSwipeNavigation;
