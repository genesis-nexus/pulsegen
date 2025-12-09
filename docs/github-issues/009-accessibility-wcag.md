# Implement WCAG 2.1 AA Accessibility Compliance

## Priority: P1 - High
## Labels: `feature`, `accessibility`, `phase-2`, `compliance`
## Estimated Effort: Large

---

## Summary

Audit and implement WCAG 2.1 Level AA accessibility compliance throughout PulseGen. This is required for government contracts, public sector organizations, and legal compliance in many jurisdictions.

---

## Background & Motivation

LimeSurvey claims WCAG 2.0 compliance. Modern accessibility requirements demand:
- Government and public sector: Legal requirement
- Education: Required for federally funded institutions
- Healthcare: Often required by regulations
- Enterprise: Increasingly part of procurement requirements

Non-compliance can result in:
- Legal liability (ADA lawsuits, accessibility complaints)
- Lost contracts with government/enterprise
- Exclusion of users with disabilities

---

## Requirements

### WCAG 2.1 AA Principles

#### 1. Perceivable
- Text alternatives for non-text content
- Captions for multimedia
- Content adaptable to different presentations
- Sufficient color contrast (4.5:1 for normal text, 3:1 for large)
- Text resizable up to 200%
- No loss of information at 320px width

#### 2. Operable
- Full keyboard accessibility
- No keyboard traps
- Sufficient time to complete tasks
- No seizure-inducing content
- Skip navigation links
- Clear focus indicators
- Meaningful link text

#### 3. Understandable
- Readable and predictable content
- Clear error identification
- Labels and instructions
- Consistent navigation
- Error prevention for legal/financial data

#### 4. Robust
- Valid HTML
- Proper ARIA usage
- Compatible with assistive technologies

---

## Technical Implementation

### 1. Accessibility Audit Checklist

**Survey Builder**
- [ ] All form controls have visible labels
- [ ] Drag-and-drop has keyboard alternative
- [ ] Color is not only indicator of state
- [ ] Focus order is logical
- [ ] Error messages are announced
- [ ] Required fields marked accessibly

**Survey Taking**
- [ ] Questions read correctly by screen readers
- [ ] Progress communicated accessibly
- [ ] Form validation is accessible
- [ ] Skip links available
- [ ] High contrast mode supported
- [ ] Works with 200% zoom

**Dashboard/Analytics**
- [ ] Charts have text alternatives
- [ ] Tables have proper headers
- [ ] Data accessible without mouse
- [ ] Color contrast in visualizations

### 2. Component Updates

**File: `frontend/src/components/ui/AccessibleButton.tsx`**

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText,
    icon,
    iconPosition = 'left',
    children,
    className,
    disabled,
    ...props
  }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium rounded-md
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variants = {
      primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
      ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    // Ensure minimum touch target size (44x44px for WCAG)
    const minTouchTarget = size === 'sm' ? 'min-h-[44px] min-w-[44px]' : '';

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], minTouchTarget, className)}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="sr-only">{loadingText || 'Loading'}</span>
            <svg
              className="animate-spin h-4 w-4 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span aria-live="polite">{loadingText || 'Loading...'}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="mr-2" aria-hidden="true">{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="ml-2" aria-hidden="true">{icon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
```

**File: `frontend/src/components/ui/AccessibleInput.tsx`**

```typescript
import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
  hideLabel?: boolean;
}

export const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, description, error, hideLabel = false, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-gray-700',
            hideLabel && 'sr-only'
          )}
        >
          {label}
          {props.required && (
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          )}
        </label>

        {description && (
          <p id={descriptionId} className="text-sm text-gray-500">
            {description}
          </p>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full px-3 py-2 border rounded-md shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300',
            className
          )}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-required={props.required}
          {...props}
        />

        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            <span className="sr-only">Error: </span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';
```

**File: `frontend/src/components/survey/AccessibleQuestion.tsx`**

```typescript
import React from 'react';
import { Question } from '@/types';

interface AccessibleQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function AccessibleQuestion({
  question,
  questionNumber,
  totalQuestions,
  value,
  onChange,
  error,
}: AccessibleQuestionProps) {
  const questionId = `question-${question.id}`;
  const errorId = error ? `${questionId}-error` : undefined;
  const descriptionId = question.description ? `${questionId}-description` : undefined;

  return (
    <fieldset
      className="border-0 p-0 m-0"
      aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
    >
      <legend className="text-lg font-medium mb-2">
        <span className="sr-only">
          Question {questionNumber} of {totalQuestions}:
        </span>
        {question.text}
        {question.isRequired && (
          <>
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </>
        )}
      </legend>

      {question.description && (
        <p id={descriptionId} className="text-sm text-gray-600 mb-4">
          {question.description}
        </p>
      )}

      {/* Question type specific rendering with proper ARIA */}
      {renderQuestionType(question, value, onChange, questionId)}

      {error && (
        <div
          id={errorId}
          className="mt-2 text-sm text-red-600"
          role="alert"
          aria-live="assertive"
        >
          <span className="sr-only">Error: </span>
          {error}
        </div>
      )}
    </fieldset>
  );
}

function renderQuestionType(
  question: Question,
  value: any,
  onChange: (value: any) => void,
  questionId: string
) {
  switch (question.type) {
    case 'MULTIPLE_CHOICE':
      return (
        <div role="radiogroup" aria-labelledby={questionId}>
          {question.options?.map((option, index) => (
            <div key={option.id} className="flex items-center mb-2">
              <input
                type="radio"
                id={`${questionId}-option-${index}`}
                name={questionId}
                value={option.id}
                checked={value === option.id}
                onChange={() => onChange(option.id)}
                className="h-4 w-4 text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2"
              />
              <label
                htmlFor={`${questionId}-option-${index}`}
                className="ml-3 text-gray-700"
              >
                {option.text}
              </label>
            </div>
          ))}
        </div>
      );

    case 'RATING_SCALE':
      const min = question.settings?.min || 1;
      const max = question.settings?.max || 5;
      return (
        <div role="group" aria-label={`Rating scale from ${min} to ${max}`}>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onChange(num)}
                className={cn(
                  'w-12 h-12 rounded-full border-2 font-medium',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  value === num
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                )}
                aria-pressed={value === num}
                aria-label={`Rate ${num} out of ${max}`}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2" aria-hidden="true">
            <span>{question.settings?.minLabel || min}</span>
            <span>{question.settings?.maxLabel || max}</span>
          </div>
        </div>
      );

    // Add more question types with proper accessibility...

    default:
      return null;
  }
}
```

### 3. Skip Navigation

**File: `frontend/src/components/layout/SkipLinks.tsx`**

```typescript
export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-0 focus-within:left-0 focus-within:z-50 focus-within:bg-white focus-within:p-4">
      <a
        href="#main-content"
        className="focus:outline-none focus:ring-2 focus:ring-primary focus:underline"
      >
        Skip to main content
      </a>
      <a
        href="#main-navigation"
        className="ml-4 focus:outline-none focus:ring-2 focus:ring-primary focus:underline"
      >
        Skip to navigation
      </a>
    </div>
  );
}
```

### 4. Focus Management

**File: `frontend/src/hooks/useFocusManagement.ts`**

```typescript
import { useEffect, useRef } from 'react';

/**
 * Manages focus for page transitions and dynamic content
 */
export function useFocusManagement(shouldFocus: boolean) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        elementRef.current?.focus();
      }, 100);
    }
  }, [shouldFocus]);

  return elementRef;
}

/**
 * Announces messages to screen readers
 */
export function useScreenReaderAnnouncement() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return announce;
}
```

### 5. Color Contrast Utilities

**File: `frontend/src/lib/accessibility.ts`**

```typescript
/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG requirements
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);

  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
```

### 6. High Contrast Theme

**File: `frontend/src/styles/high-contrast.css`**

```css
/* High Contrast Mode */
@media (prefers-contrast: high) {
  :root {
    --color-primary: #0000EE;
    --color-primary-foreground: #FFFFFF;
    --color-background: #FFFFFF;
    --color-foreground: #000000;
    --color-border: #000000;
    --color-muted: #767676;
    --color-error: #CC0000;
    --color-success: #008800;
  }

  /* Increase border widths */
  button, input, select, textarea {
    border-width: 2px !important;
  }

  /* Ensure focus indicators are highly visible */
  *:focus {
    outline: 3px solid #000000 !important;
    outline-offset: 2px !important;
  }

  /* Remove background images and gradients */
  * {
    background-image: none !important;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Testing Requirements

### Automated Testing
- [ ] axe-core integration in Jest tests
- [ ] Lighthouse accessibility audits in CI
- [ ] ESLint jsx-a11y plugin enabled

### Manual Testing
- [ ] Screen reader testing (NVDA, VoiceOver, JAWS)
- [ ] Keyboard-only navigation
- [ ] Zoom to 200%
- [ ] High contrast mode
- [ ] Reduced motion mode

### User Testing
- [ ] Test with actual users with disabilities
- [ ] Document feedback and fixes

---

## Acceptance Criteria

- [ ] All interactive elements keyboard accessible
- [ ] Focus visible on all interactive elements
- [ ] Skip links present and functional
- [ ] All images have alt text
- [ ] Form fields have visible labels
- [ ] Error messages announced by screen readers
- [ ] Color contrast meets 4.5:1 (normal) / 3:1 (large)
- [ ] No content loss at 200% zoom
- [ ] Works at 320px viewport width
- [ ] ARIA landmarks properly defined
- [ ] Heading hierarchy correct
- [ ] Tables have proper headers
- [ ] Passes automated axe-core tests
- [ ] Passes Lighthouse accessibility audit (90+)
- [ ] VPAT documentation created

---

## Files to Create/Modify

### New Files
- `frontend/src/components/ui/AccessibleButton.tsx`
- `frontend/src/components/ui/AccessibleInput.tsx`
- `frontend/src/components/ui/AccessibleSelect.tsx`
- `frontend/src/components/layout/SkipLinks.tsx`
- `frontend/src/hooks/useFocusManagement.ts`
- `frontend/src/lib/accessibility.ts`
- `frontend/src/styles/high-contrast.css`
- `docs/VPAT.md` (Accessibility conformance report)

### Modified Files
- All component files - Add proper ARIA attributes
- `frontend/src/App.tsx` - Add skip links
- `frontend/tailwind.config.js` - Add focus ring utilities
- `frontend/.eslintrc` - Add jsx-a11y plugin
- `frontend/package.json` - Add testing dependencies

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)
- [axe-core](https://github.com/dequelabs/axe-core)
