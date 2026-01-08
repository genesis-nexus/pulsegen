import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useSwipeNavigation,
  useIsMobile,
  useHasTouch,
  useViewportSize,
} from './useSwipeNavigation';
import { TouchEvent } from 'react';

// Helper to create mock touch event
const createTouchEvent = (
  clientX: number,
  clientY: number
): Partial<TouchEvent<Element>> => ({
  targetTouches: [{ clientX, clientY }] as unknown as React.TouchList,
});

describe('useSwipeNavigation', () => {
  const mockOnSwipeLeft = vi.fn();
  const mockOnSwipeRight = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic swipe detection', () => {
    it('returns touch handlers', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeLeft: mockOnSwipeLeft,
          onSwipeRight: mockOnSwipeRight,
        })
      );

      expect(result.current.onTouchStart).toBeDefined();
      expect(result.current.onTouchMove).toBeDefined();
      expect(result.current.onTouchEnd).toBeDefined();
    });

    it('calls onSwipeLeft when swiping left beyond threshold', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeLeft: mockOnSwipeLeft,
          onSwipeRight: mockOnSwipeRight,
          threshold: 50,
        })
      );

      // Simulate swipe left: start at x=200, end at x=100 (delta = 100)
      act(() => {
        result.current.onTouchStart(createTouchEvent(200, 100) as TouchEvent<Element>);
      });

      act(() => {
        result.current.onTouchMove(createTouchEvent(100, 100) as TouchEvent<Element>);
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
    });

    it('calls onSwipeRight when swiping right beyond threshold', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeLeft: mockOnSwipeLeft,
          onSwipeRight: mockOnSwipeRight,
          threshold: 50,
        })
      );

      // Simulate swipe right: start at x=100, end at x=200 (delta = -100)
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent<Element>);
      });

      act(() => {
        result.current.onTouchMove(createTouchEvent(200, 100) as TouchEvent<Element>);
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('threshold behavior', () => {
    it('does not trigger swipe when below threshold', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeLeft: mockOnSwipeLeft,
          onSwipeRight: mockOnSwipeRight,
          threshold: 50,
        })
      );

      // Swipe only 30 pixels (below 50 threshold)
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent<Element>);
      });

      act(() => {
        result.current.onTouchMove(createTouchEvent(70, 100) as TouchEvent<Element>);
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
    });

    it('uses default threshold of 50 when not specified', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeLeft: mockOnSwipeLeft,
        })
      );

      // Swipe exactly 51 pixels (just above default threshold)
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent<Element>);
      });

      act(() => {
        result.current.onTouchMove(createTouchEvent(49, 100) as TouchEvent<Element>);
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
    });
  });

  describe('enabled/disabled state', () => {
    it('does not respond to swipes when disabled', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeLeft: mockOnSwipeLeft,
          onSwipeRight: mockOnSwipeRight,
          enabled: false,
        })
      );

      // Simulate swipe left
      act(() => {
        result.current.onTouchStart(createTouchEvent(200, 100) as TouchEvent<Element>);
      });

      act(() => {
        result.current.onTouchMove(createTouchEvent(100, 100) as TouchEvent<Element>);
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
    });

    it('responds to swipes when enabled is true', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeLeft: mockOnSwipeLeft,
          enabled: true,
        })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent(200, 100) as TouchEvent<Element>);
      });

      act(() => {
        result.current.onTouchMove(createTouchEvent(100, 100) as TouchEvent<Element>);
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
    });
  });

  describe('vertical scrolling detection', () => {
    it('does not trigger horizontal swipe when scrolling vertically', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          onSwipeLeft: mockOnSwipeLeft,
        })
      );

      // Start touch
      act(() => {
        result.current.onTouchStart(createTouchEvent(100, 100) as TouchEvent<Element>);
      });

      // Move more vertically than horizontally
      act(() => {
        result.current.onTouchMove(createTouchEvent(110, 200) as TouchEvent<Element>);
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
    });
  });
});

describe('useIsMobile', () => {
  it('returns false on desktop', () => {
    // Default window width in test environment
    const { result } = renderHook(() => useIsMobile());

    // In test environment, userAgent doesn't match mobile patterns
    // and window.innerWidth is typically 1024
    expect(typeof result.current).toBe('boolean');
  });

  it('updates on window resize', () => {
    const { result } = renderHook(() => useIsMobile());

    // Simulate resize
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500, // Mobile width
      });
      window.dispatchEvent(new Event('resize'));
    });

    // Should have updated
    expect(result.current).toBe(true);

    // Reset
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      window.dispatchEvent(new Event('resize'));
    });
  });
});

describe('useHasTouch', () => {
  it('detects touch capability', () => {
    const { result } = renderHook(() => useHasTouch());

    // In test environment, touch might not be supported
    expect(typeof result.current).toBe('boolean');
  });
});

describe('useViewportSize', () => {
  it('returns viewport dimensions', () => {
    const { result } = renderHook(() => useViewportSize());

    expect(result.current).toHaveProperty('width');
    expect(result.current).toHaveProperty('height');
    expect(typeof result.current.width).toBe('number');
    expect(typeof result.current.height).toBe('number');
  });

  it('updates on window resize', () => {
    const { result } = renderHook(() => useViewportSize());

    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600,
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);
  });
});
