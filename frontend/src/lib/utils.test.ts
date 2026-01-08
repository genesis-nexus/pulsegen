import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (classNames utility)', () => {
  describe('basic functionality', () => {
    it('joins multiple class names', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('handles single class name', () => {
      const result = cn('single-class');
      expect(result).toBe('single-class');
    });

    it('returns empty string for no arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });
  });

  describe('falsy value handling', () => {
    it('filters out undefined values', () => {
      const result = cn('class1', undefined, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('filters out null values', () => {
      const result = cn('class1', null, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('filters out false values', () => {
      const result = cn('class1', false, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('filters out empty strings', () => {
      const result = cn('class1', '', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('handles all falsy values together', () => {
      const result = cn(undefined, null, false, '', 'actual-class');
      expect(result).toBe('actual-class');
    });
  });

  describe('conditional class names', () => {
    it('works with conditional expressions', () => {
      const isActive = true;
      const isDisabled = false;

      const result = cn(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled'
      );

      expect(result).toBe('base-class active');
    });

    it('handles ternary expressions', () => {
      const variant = 'primary';

      const result = cn(
        'button',
        variant === 'primary' ? 'btn-primary' : 'btn-secondary'
      );

      expect(result).toBe('button btn-primary');
    });
  });

  describe('real-world usage patterns', () => {
    it('handles Tailwind CSS class composition', () => {
      const result = cn(
        'flex',
        'items-center',
        'justify-between',
        'p-4',
        'bg-white',
        'dark:bg-gray-800'
      );

      expect(result).toBe('flex items-center justify-between p-4 bg-white dark:bg-gray-800');
    });

    it('handles component variant pattern', () => {
      const variant: string = 'destructive';
      const size: string = 'lg';

      const result = cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        variant === 'destructive' && 'btn-destructive',
        size === 'sm' && 'btn-sm',
        size === 'lg' && 'btn-lg'
      );

      expect(result).toBe('btn btn-destructive btn-lg');
    });

    it('handles state-based styling', () => {
      const isLoading = true;
      const hasError = false;
      const isSuccess = false;

      const result = cn(
        'input',
        isLoading && 'opacity-50 cursor-wait',
        hasError && 'border-red-500',
        isSuccess && 'border-green-500'
      );

      expect(result).toBe('input opacity-50 cursor-wait');
    });
  });

  describe('edge cases', () => {
    it('handles classes with special characters', () => {
      const result = cn('hover:bg-blue-500', 'focus:ring-2', 'md:flex');
      expect(result).toBe('hover:bg-blue-500 focus:ring-2 md:flex');
    });

    it('preserves whitespace within class names', () => {
      // Single spaces between words are preserved as part of the join
      const result = cn('class-one', 'class-two');
      expect(result).toBe('class-one class-two');
    });

    it('handles very long class lists', () => {
      const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      const result = cn(...classes);
      expect(result.split(' ').length).toBe(100);
    });
  });
});
