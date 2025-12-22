# Question Pagination Feature - Implementation Guide

## Summary
Added configurable question pagination to surveys, allowing survey creators to choose how questions are displayed:
- **All questions at once** (default)
- **One question per page**
- **Custom number of questions per page**

## Database Schema Changes
✅ **Completed** - Added to `Survey` model in `schema.prisma`:
```prisma
paginationMode        String   @default("all") // "all", "single", "custom"
questionsPerPage      Int      @default(1)     // Used when paginationMode is "custom"
```

## Backend Changes
✅ **Completed** - Schema pushed to database with `npx prisma db push`

## Frontend Changes

### 1. Types (✅ Completed)
**File:** `frontend/src/types/index.ts`
```typescript
export interface Survey {
  // ... existing fields
  paginationMode?: 'all' | 'single' | 'custom';
  questionsPerPage?: number;
}
```

### 2. Survey Builder UI (✅ Completed)
**File:** `frontend/src/components/survey/workspace/PropertyInspector.tsx`
- Added "Question Pagination" section to Survey Settings
- Dropdown to select pagination mode:
  - All questions at once
  - One question per page
  - Custom questions per page
- Number input for custom questions per page (shows when "custom" is selected)
- Dynamic helper text

**File:** `frontend/src/pages/surveys/SurveyBuilder.tsx`
- Added state: `paginationMode` and `questionsPerPage`
- Initialize from survey data when loading
- Include in `handleSave` when saving survey
- Pass to `PropertyInspector` component

### 3. Survey Taking Experience (⚠️ Requires Implementation)
**File:** `frontend/src/pages/public/SurveyTake.tsx`

#### Required Changes:

**A. Add State**
```typescript
const [currentPage, setCurrentPage] = useState(1);  // ✅ Already added
```

**B. Calculate Pagination**
```typescript
// Calculate which questions to show based on pagination mode
const getVisibleQuestions = () => {
  if (!survey || !survey.questions) return [];
  
  const { paginationMode = 'all', questionsPerPage = 1 } = survey;
  
  if (paginationMode === 'all') {
    return survey.questions; // Show all questions
  }
  
  if (paginationMode === 'single') {
    // Show one question at a time
    const startIndex = currentPage - 1;
    return survey.questions.slice(startIndex, startIndex + 1);
  }
  
  if (paginationMode === 'custom') {
    // Show N questions per page
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    return survey.questions.slice(startIndex, endIndex);
  }
  
  return survey.questions;
};

const visibleQuestions = getVisibleQuestions();
const totalPages = calculateTotalPages();

function calculateTotalPages() {
  if (!survey || !survey.questions) return 1;
  
  const { paginationMode = 'all', questionsPerPage = 1 } = survey;
  
  if (paginationMode === 'all') return 1;
  if (paginationMode === 'single') return survey.questions.length;
  if (paginationMode === 'custom') {
    return Math.ceil(survey.questions.length / questionsPerPage);
  }
  
  return 1;
}
```

**C. Add Navigation Buttons**
```typescript
const canGoNext = () => {
  // Check if all visible required questions are answered
  const requiredQuestions = visibleQuestions.filter(q => q.isRequired);
  return requiredQuestions.every(q => answers[q.id] !== undefined && answers[q.id] !== '');
};

const handleNext = () => {
  if (currentPage < totalPages) {
    setCurrentPage(currentPage + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const handlePrevious = () => {
  if (currentPage > 1) {
    setCurrentPage(currentPage - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
```

**D. Update Render Logic**
Replace `survey.questions.map(...)` with `visibleQuestions.map(...)`

**E. Add Navigation UI**
```tsx
{/* Navigation Buttons */}
{totalPages > 1 && (
  <div className="flex justify-between items-center mt-8 pt-6 border-t">
    <button
      type="button"
      onClick={handlePrevious}
      disabled={currentPage === 1}
      className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      ← Previous
    </button>
    
    <span className="text-sm text-gray-600">
      Page {currentPage} of {totalPages}
    </span>
    
    {currentPage < totalPages ? (
      <button
        type="button"
        onClick={handleNext}
        disabled={!canGoNext()}
        className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        title={!canGoNext() ? 'Please answer all required questions' : ''}
      >
        Next →
      </button>
    ) : (
      <button
        type="submit"
        disabled={!canSubmit()}
        className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Survey
      </button>
    )}
  </div>
)}

{/* Submit button for single-page surveys */}
{totalPages === 1 && (
  <button
    type="submit"
    disabled={!canSubmit()}
    className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-8"
  >
    Submit Survey
  </button>
)}
```

**F. Update Progress Wrapper**
```tsx
<SurveyProgressWrapper
  survey={survey}
  currentPage={currentPage}
  totalPages={totalPages}
  currentQuestion={visibleQuestions.findIndex(q => !answers[q.id]) + ((currentPage - 1) * questionsPerPage)}
  totalQuestions={survey.questions.length}
>
```

## Testing Checklist
- [ ] Create a survey and set pagination to "All questions at once"
- [ ] Test that all questions appear on one page
- [ ] Change pagination to "One question per page"
- [ ] Verify only one question shows per page with Next/Previous buttons
- [ ] Change to "Custom" with 3 questions per page
- [ ] Verify 3 questions show per page
- [ ] Test Next button is disabled if required questions aren't answered
- [ ] Test Previous button works correctly
- [ ] Verify page counter shows correct page numbers
- [ ] Test survey submission works from any pagination mode
- [ ] Verify progress bar updates correctly with pagination

## User Experience Notes
1. **Required Questions**: On paginated surveys, users can only proceed to the next page if all required questions on the current page are answered
2. **Auto-save**: Works across all pagination modes
3. **Progress Bar**: Shows overall progress across all questions, not just current page
4. **Smooth Transitions**: Page transitions scroll to top smoothly

## Benefits
- **Improved UX** for long surveys (reduces cognitive load)
- **Mobile-friendly**: Easier to complete on small screens
- **Flexibility**: Survey creators can choose best format for their content
- **Better engagement**: Users less likely to abandon shorter "pages"
