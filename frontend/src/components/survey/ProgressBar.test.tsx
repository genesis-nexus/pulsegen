import { describe, it, expect } from 'vitest';
import { render, screen } from '../../tests/test-utils';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 3,
    currentQuestion: 5,
    totalQuestions: 10,
    style: 'bar' as const,
    format: 'percentage' as const,
    position: 'top' as const,
  };

  describe('rendering', () => {
    it('renders with bar style', () => {
      render(<ProgressBar {...defaultProps} />);

      // Should show percentage
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('renders with steps style', () => {
      render(<ProgressBar {...defaultProps} style="steps" />);

      // Should show page progress text
      expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
    });

    it('renders with minimal style', () => {
      render(<ProgressBar {...defaultProps} style="minimal" />);

      // Should show percentage with "complete"
      expect(screen.getByText(/50%/)).toBeInTheDocument();
      expect(screen.getByText(/complete/i)).toBeInTheDocument();
    });

    it('renders with combined style', () => {
      render(<ProgressBar {...defaultProps} style="combined" />);

      // Should show both bar and label
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });
  });

  describe('format options', () => {
    it('shows percentage format', () => {
      render(<ProgressBar {...defaultProps} format="percentage" />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('shows count format', () => {
      render(<ProgressBar {...defaultProps} format="count" />);

      expect(screen.getByText('5/10')).toBeInTheDocument();
    });

    it('shows both format in minimal style', () => {
      render(<ProgressBar {...defaultProps} style="minimal" format="both" />);

      // Should show page, question, and percentage
      expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });
  });

  describe('progress calculation', () => {
    it('calculates 0% correctly', () => {
      render(
        <ProgressBar
          {...defaultProps}
          currentQuestion={0}
          totalQuestions={10}
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('calculates 100% correctly', () => {
      render(
        <ProgressBar
          {...defaultProps}
          currentQuestion={10}
          totalQuestions={10}
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('rounds percentage correctly', () => {
      render(
        <ProgressBar
          {...defaultProps}
          currentQuestion={1}
          totalQuestions={3}
        />
      );

      // 1/3 = 33.33... should round to 33%
      expect(screen.getByText('33%')).toBeInTheDocument();
    });
  });

  describe('steps visualization', () => {
    it('renders correct number of step indicators', () => {
      const { container } = render(
        <ProgressBar {...defaultProps} style="steps" totalPages={5} />
      );

      // Should have 5 step dots
      const dots = container.querySelectorAll('.rounded-full');
      expect(dots.length).toBe(5);
    });
  });

  describe('accessibility', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ProgressBar {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('edge cases', () => {
    it('handles zero total questions', () => {
      render(
        <ProgressBar
          {...defaultProps}
          currentQuestion={0}
          totalQuestions={0}
        />
      );

      // Should show 0% and not crash
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles single page survey', () => {
      render(
        <ProgressBar
          {...defaultProps}
          style="steps"
          currentPage={1}
          totalPages={1}
        />
      );

      expect(screen.getByText(/Page 1 of 1/i)).toBeInTheDocument();
    });
  });
});
