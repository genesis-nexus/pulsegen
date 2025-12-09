# Implement Survey Progress Bar Component

## Priority: P1 - High
## Labels: `feature`, `ux`, `phase-1`, `survey-respondent`
## Estimated Effort: Small

---

## Summary

Add a configurable progress indicator to surveys so respondents can see how far along they are in completing a survey. This improves user experience and reduces abandonment rates on longer surveys.

---

## Background & Motivation

LimeSurvey provides progress indicators as a standard feature. Research shows that progress bars can:
- Reduce survey abandonment by up to 20%
- Set clear expectations for respondents
- Improve completion rates for long surveys

Currently, PulseGen surveys have no progress indication, which can frustrate respondents on multi-page surveys.

---

## Requirements

### Functional Requirements

1. **Progress Bar Display**
   - Show progress as percentage and/or question count
   - Display at top or bottom of survey (configurable)
   - Animate smoothly on page transitions
   - Support different visual styles

2. **Configuration Options** (per survey)
   - Enable/disable progress bar
   - Position: top, bottom, or both
   - Display format: percentage, question count, or both
   - Style: bar, steps, or minimal

3. **Progress Calculation**
   - Based on pages completed (for multi-page surveys)
   - Based on questions answered (for single-page)
   - Account for conditional questions (adjust total dynamically)

### Visual Designs

```
Style 1: Bar (Default)
┌────────────────────────────────────────────┐
│ ████████████████░░░░░░░░░░░░  50% Complete │
└────────────────────────────────────────────┘

Style 2: Steps
┌────────────────────────────────────────────┐
│ ● ● ● ○ ○ ○   Page 3 of 6                  │
└────────────────────────────────────────────┘

Style 3: Minimal
┌────────────────────────────────────────────┐
│ Question 5 of 10                           │
└────────────────────────────────────────────┘

Style 4: Combined
┌────────────────────────────────────────────┐
│ ████████████████░░░░░░░░░░░░               │
│ Page 3 of 6 • Question 5 of 10 • 50%       │
└────────────────────────────────────────────┘
```

---

## Technical Implementation

### 1. Database Schema Changes

**Add to Survey model in `backend/prisma/schema.prisma`:**

```prisma
model Survey {
  // ... existing fields

  // Progress bar settings (store as JSON or separate fields)
  showProgressBar     Boolean @default(true)
  progressBarPosition String  @default("top") // "top", "bottom", "both"
  progressBarStyle    String  @default("bar") // "bar", "steps", "minimal", "combined"
  progressBarFormat   String  @default("percentage") // "percentage", "count", "both"
}
```

### 2. React Components

**File: `frontend/src/components/survey/ProgressBar.tsx`**

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentPage: number;
  totalPages: number;
  currentQuestion: number;
  totalQuestions: number;
  style: 'bar' | 'steps' | 'minimal' | 'combined';
  format: 'percentage' | 'count' | 'both';
  position: 'top' | 'bottom';
  className?: string;
}

export function ProgressBar({
  currentPage,
  totalPages,
  currentQuestion,
  totalQuestions,
  style,
  format,
  position,
  className,
}: ProgressBarProps) {
  const percentage = Math.round((currentQuestion / totalQuestions) * 100);
  const pagePercentage = Math.round((currentPage / totalPages) * 100);

  const renderBar = () => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <div
        className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );

  const renderSteps = () => (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => (
        <div
          key={i}
          className={cn(
            'w-3 h-3 rounded-full transition-colors duration-300',
            i < currentPage ? 'bg-primary' : 'bg-gray-300'
          )}
        />
      ))}
    </div>
  );

  const renderLabel = () => {
    if (format === 'percentage') {
      return <span>{percentage}% complete</span>;
    }
    if (format === 'count') {
      return <span>Question {currentQuestion} of {totalQuestions}</span>;
    }
    return (
      <span>
        Page {currentPage} of {totalPages} • Question {currentQuestion} of {totalQuestions} • {percentage}%
      </span>
    );
  };

  if (style === 'minimal') {
    return (
      <div className={cn('text-sm text-gray-600', className)}>
        {renderLabel()}
      </div>
    );
  }

  if (style === 'steps') {
    return (
      <div className={cn('flex items-center justify-between gap-4', className)}>
        {renderSteps()}
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
      </div>
    );
  }

  if (style === 'combined') {
    return (
      <div className={cn('space-y-2', className)}>
        {renderBar()}
        <div className="text-sm text-gray-600 text-center">
          {renderLabel()}
        </div>
      </div>
    );
  }

  // Default: bar style
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex-1">{renderBar()}</div>
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {format === 'percentage' ? `${percentage}%` : `${currentQuestion}/${totalQuestions}`}
      </span>
    </div>
  );
}
```

**File: `frontend/src/components/survey/SurveyProgressWrapper.tsx`**

```typescript
import React from 'react';
import { ProgressBar } from './ProgressBar';
import { Survey } from '@/types';

interface SurveyProgressWrapperProps {
  survey: Survey;
  currentPage: number;
  totalPages: number;
  currentQuestion: number;
  totalQuestions: number;
  children: React.ReactNode;
}

export function SurveyProgressWrapper({
  survey,
  currentPage,
  totalPages,
  currentQuestion,
  totalQuestions,
  children,
}: SurveyProgressWrapperProps) {
  if (!survey.showProgressBar) {
    return <>{children}</>;
  }

  const progressProps = {
    currentPage,
    totalPages,
    currentQuestion,
    totalQuestions,
    style: survey.progressBarStyle as 'bar' | 'steps' | 'minimal' | 'combined',
    format: survey.progressBarFormat as 'percentage' | 'count' | 'both',
  };

  return (
    <div className="flex flex-col min-h-screen">
      {(survey.progressBarPosition === 'top' || survey.progressBarPosition === 'both') && (
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3">
          <ProgressBar {...progressProps} position="top" />
        </div>
      )}

      <div className="flex-1">
        {children}
      </div>

      {(survey.progressBarPosition === 'bottom' || survey.progressBarPosition === 'both') && (
        <div className="sticky bottom-0 z-10 bg-white border-t px-4 py-3">
          <ProgressBar {...progressProps} position="bottom" />
        </div>
      )}
    </div>
  );
}
```

### 3. Survey Builder Settings

**Add to survey settings form in survey builder:**

```typescript
// In SurveySettingsForm.tsx or similar

<div className="space-y-4">
  <h3 className="font-medium">Progress Bar</h3>

  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={settings.showProgressBar}
      onChange={(e) => updateSetting('showProgressBar', e.target.checked)}
    />
    <span>Show progress bar to respondents</span>
  </label>

  {settings.showProgressBar && (
    <>
      <div>
        <label className="block text-sm font-medium mb-1">Position</label>
        <select
          value={settings.progressBarPosition}
          onChange={(e) => updateSetting('progressBarPosition', e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        >
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
          <option value="both">Both</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Style</label>
        <select
          value={settings.progressBarStyle}
          onChange={(e) => updateSetting('progressBarStyle', e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        >
          <option value="bar">Progress Bar</option>
          <option value="steps">Step Indicators</option>
          <option value="minimal">Minimal (Text Only)</option>
          <option value="combined">Combined</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Display Format</label>
        <select
          value={settings.progressBarFormat}
          onChange={(e) => updateSetting('progressBarFormat', e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        >
          <option value="percentage">Percentage</option>
          <option value="count">Question Count</option>
          <option value="both">Both</option>
        </select>
      </div>
    </>
  )}
</div>
```

### 4. Integration with Survey Taking Page

**Modify the survey taking page to track progress:**

```typescript
// In SurveyTakePage.tsx or similar

const [surveyState, setSurveyState] = useState({
  currentPageIndex: 0,
  answeredQuestions: new Set<string>(),
});

// Calculate progress
const totalPages = survey.pages.length;
const currentPage = surveyState.currentPageIndex + 1;
const totalQuestions = survey.pages.flatMap(p => p.questions).length;
const currentQuestion = surveyState.answeredQuestions.size;

// For conditional questions, filter out hidden ones
const visibleQuestions = survey.pages
  .flatMap(p => p.questions)
  .filter(q => isQuestionVisible(q, answers));
const adjustedTotal = visibleQuestions.length;
```

---

## Acceptance Criteria

- [ ] Progress bar component renders correctly in all 4 styles
- [ ] Progress bar can be positioned at top, bottom, or both
- [ ] Progress updates smoothly on navigation
- [ ] Survey creators can enable/disable progress bar
- [ ] Survey creators can configure style and format
- [ ] Settings are persisted in database
- [ ] Progress accounts for conditional/hidden questions
- [ ] Works correctly on mobile devices
- [ ] Animations are smooth (60fps)
- [ ] Accessible (ARIA labels for screen readers)
- [ ] Unit tests for ProgressBar component
- [ ] Preview in survey builder shows progress bar

---

## Files to Create/Modify

### New Files
- `frontend/src/components/survey/ProgressBar.tsx`
- `frontend/src/components/survey/SurveyProgressWrapper.tsx`
- `frontend/src/components/survey/__tests__/ProgressBar.test.tsx`

### Modified Files
- `backend/prisma/schema.prisma` - Add progress bar fields to Survey
- `frontend/src/pages/SurveyTake.tsx` - Integrate progress wrapper
- `frontend/src/pages/SurveyBuilder.tsx` - Add progress bar settings
- `frontend/src/types/index.ts` - Add progress bar types

---

## Dependencies

- None

---

## Related Issues

- Will be enhanced by Issue #001 (i18n) for translated labels
