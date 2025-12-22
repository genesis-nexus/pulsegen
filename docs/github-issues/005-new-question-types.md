# Implement Additional Question Types for Feature Parity

## Priority: P1 - High
## Labels: `feature`, `survey-builder`, `phase-1`, `question-types`
## Estimated Effort: Large (implement incrementally)

---

## Summary

Implement 11 additional question types to achieve feature parity with LimeSurvey. This issue covers all missing question types that are essential for academic research, market research, and enterprise surveys.

---

## Background & Motivation

LimeSurvey offers 28+ question types while PulseGen currently has 17. The missing types are frequently used in:
- Academic research (semantic differential, equation)
- Market research (image select, geo location)
- Complex surveys (array dual scale, multiple numerical)
- Technical surveys (hidden input, boilerplate)

---

## Missing Question Types

### Tier 1: High Priority (Most Requested)

#### 1. Image Select
**Use Case**: Visual product selection, preference testing, accessibility
**Example**: "Which logo design do you prefer?" with image options

```typescript
interface ImageSelectQuestion {
  type: 'IMAGE_SELECT';
  settings: {
    selectionMode: 'single' | 'multiple';
    columns: 2 | 3 | 4 | 'auto';
    imageSize: 'small' | 'medium' | 'large';
    showLabels: boolean;
    showCaptions: boolean;
  };
  options: Array<{
    id: string;
    imageUrl: string;
    label?: string;
    caption?: string;
  }>;
}
```

#### 2. Semantic Differential
**Use Case**: Measure attitudes on bipolar scales, brand perception research
**Example**: Rate the product on scales from "Cheap - Expensive", "Ugly - Beautiful"

```typescript
interface SemanticDifferentialQuestion {
  type: 'SEMANTIC_DIFFERENTIAL';
  settings: {
    scalePoints: 5 | 7 | 9; // Usually odd number
    showMiddleLabel: boolean;
    middleLabel?: string; // e.g., "Neutral"
  };
  scales: Array<{
    id: string;
    leftLabel: string;  // e.g., "Cheap"
    rightLabel: string; // e.g., "Expensive"
  }>;
}
```

#### 3. Geo Location / Map
**Use Case**: Location-based surveys, store locators, delivery preferences
**Example**: "Select your home location on the map"

```typescript
interface GeoLocationQuestion {
  type: 'GEO_LOCATION';
  settings: {
    mapProvider: 'google' | 'openstreetmap' | 'mapbox';
    defaultCenter: { lat: number; lng: number };
    defaultZoom: number;
    selectionMode: 'point' | 'area' | 'address';
    showSearchBox: boolean;
    restrictToCountry?: string; // ISO country code
  };
}
```

#### 4. Multiple Numerical Input
**Use Case**: Budget allocation, time distribution, multi-part numeric data
**Example**: "How many hours do you spend on each activity per week?"

```typescript
interface MultipleNumericalQuestion {
  type: 'MULTIPLE_NUMERICAL';
  settings: {
    min?: number;
    max?: number;
    step?: number;
    sumValidation?: {
      enabled: boolean;
      target: number; // e.g., must sum to 100
      allowance: number; // e.g., +/- 1
    };
    showSum: boolean;
    prefix?: string; // e.g., "$"
    suffix?: string; // e.g., "hrs"
  };
  fields: Array<{
    id: string;
    label: string;
    defaultValue?: number;
  }>;
}
```

### Tier 2: Medium Priority

#### 5. Array Dual Scale
**Use Case**: Importance-satisfaction analysis, expectation-reality comparison
**Example**: For each feature, rate both "Importance" and "Satisfaction"

```typescript
interface ArrayDualScaleQuestion {
  type: 'ARRAY_DUAL_SCALE';
  settings: {
    scale1Label: string; // e.g., "Importance"
    scale2Label: string; // e.g., "Satisfaction"
    scale1Options: Array<{ value: number; label: string }>;
    scale2Options: Array<{ value: number; label: string }>;
    naOption?: { enabled: boolean; label: string };
  };
  rows: Array<{
    id: string;
    text: string;
  }>;
}
```

#### 6. Equation / Calculated Field
**Use Case**: Dynamic calculations, scoring, conditional display based on math
**Example**: Display calculated BMI based on height and weight inputs

```typescript
interface EquationQuestion {
  type: 'EQUATION';
  settings: {
    formula: string; // e.g., "{Q1} * {Q2} / 100"
    precision: number; // decimal places
    displayMode: 'visible' | 'hidden' | 'readonly';
    formatAs: 'number' | 'currency' | 'percentage';
    currencyCode?: string;
  };
  // References other questions by their ID
  variables: Array<{
    name: string;
    questionId: string;
  }>;
}
```

#### 7. Boilerplate / Text Display
**Use Case**: Instructions, legal text, information blocks, section headers
**Example**: Display consent form text between questions

```typescript
interface BoilerplateQuestion {
  type: 'BOILERPLATE';
  settings: {
    contentType: 'text' | 'html' | 'markdown';
    alignment: 'left' | 'center' | 'right';
    style: 'normal' | 'info' | 'warning' | 'success' | 'error';
    showBorder: boolean;
    backgroundColor?: string;
  };
  content: string; // The text/HTML/markdown content
}
```

#### 8. Hidden Input
**Use Case**: Store metadata, URL parameters, tracking IDs, calculated values
**Example**: Capture UTM parameters from URL for analytics

```typescript
interface HiddenInputQuestion {
  type: 'HIDDEN';
  settings: {
    valueSource: 'static' | 'url_param' | 'expression' | 'javascript';
    staticValue?: string;
    urlParamName?: string;
    expression?: string; // Reference other question values
    jsFunction?: string; // JavaScript code to execute
  };
}
```

### Tier 3: Nice to Have

#### 9. Gender
**Use Case**: Demographics with inclusive options
**Example**: Standard gender question with configurable options

```typescript
interface GenderQuestion {
  type: 'GENDER';
  settings: {
    displayStyle: 'radio' | 'dropdown';
    includeNonBinary: boolean;
    includePreferNotToSay: boolean;
    allowSelfDescribe: boolean;
  };
}
```

#### 10. Language Switcher
**Use Case**: Allow respondent to change survey language mid-survey
**Depends on**: Issue #001 (i18n Framework)

```typescript
interface LanguageSwitcherQuestion {
  type: 'LANGUAGE_SWITCHER';
  settings: {
    displayStyle: 'dropdown' | 'flags' | 'buttons';
    showNativeNames: boolean;
  };
  // Available languages defined at survey level
}
```

#### 11. Signature
**Use Case**: Legal agreements, consent forms, contracts
**Example**: Digital signature capture for consent

```typescript
interface SignatureQuestion {
  type: 'SIGNATURE';
  settings: {
    canvasWidth: number;
    canvasHeight: number;
    strokeColor: string;
    strokeWidth: number;
    backgroundColor: string;
    showClearButton: boolean;
    showTypedOption: boolean; // Allow typing name as alternative
  };
}
```

---

## Technical Implementation

### 1. Database Schema Updates

**Add to `backend/prisma/schema.prisma`:**

```prisma
enum QuestionType {
  // Existing types...
  MULTIPLE_CHOICE
  CHECKBOXES
  DROPDOWN
  RATING_SCALE
  MATRIX
  RANKING
  SHORT_TEXT
  LONG_TEXT
  EMAIL
  NUMBER
  DATE
  TIME
  FILE_UPLOAD
  SLIDER
  YES_NO
  NPS
  LIKERT_SCALE

  // New types
  IMAGE_SELECT
  SEMANTIC_DIFFERENTIAL
  GEO_LOCATION
  MULTIPLE_NUMERICAL
  ARRAY_DUAL_SCALE
  EQUATION
  BOILERPLATE
  HIDDEN
  GENDER
  LANGUAGE_SWITCHER
  SIGNATURE
}
```

### 2. Question Type Registry

**File: `backend/src/services/questionTypes/index.ts`**

```typescript
import { QuestionType } from '@prisma/client';

export interface QuestionTypeDefinition {
  type: QuestionType;
  name: string;
  description: string;
  category: 'basic' | 'choice' | 'matrix' | 'specialized' | 'display' | 'hidden';
  icon: string;
  hasOptions: boolean;
  hasRows: boolean;
  defaultSettings: Record<string, any>;
  validateAnswer: (answer: any, settings: any) => { valid: boolean; error?: string };
  formatAnswer: (answer: any, settings: any) => string;
}

export const questionTypeRegistry: Record<QuestionType, QuestionTypeDefinition> = {
  IMAGE_SELECT: {
    type: 'IMAGE_SELECT',
    name: 'Image Select',
    description: 'Select from image options',
    category: 'choice',
    icon: 'image',
    hasOptions: true,
    hasRows: false,
    defaultSettings: {
      selectionMode: 'single',
      columns: 3,
      imageSize: 'medium',
      showLabels: true,
      showCaptions: false,
    },
    validateAnswer: (answer, settings) => {
      if (!answer) return { valid: false, error: 'Selection required' };
      if (settings.selectionMode === 'single' && Array.isArray(answer)) {
        return { valid: false, error: 'Only one selection allowed' };
      }
      return { valid: true };
    },
    formatAnswer: (answer, settings) => {
      if (Array.isArray(answer)) return answer.join(', ');
      return String(answer);
    },
  },
  // ... definitions for other types
};
```

### 3. Frontend Question Components

**File: `frontend/src/components/questions/ImageSelectQuestion.tsx`**

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ImageOption {
  id: string;
  imageUrl: string;
  label?: string;
  caption?: string;
}

interface ImageSelectQuestionProps {
  question: {
    id: string;
    settings: {
      selectionMode: 'single' | 'multiple';
      columns: 2 | 3 | 4 | 'auto';
      imageSize: 'small' | 'medium' | 'large';
      showLabels: boolean;
      showCaptions: boolean;
    };
    options: ImageOption[];
  };
  value: string | string[];
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
}

export function ImageSelectQuestion({
  question,
  value,
  onChange,
  disabled,
}: ImageSelectQuestionProps) {
  const { settings, options } = question;
  const selectedIds = Array.isArray(value) ? value : value ? [value] : [];

  const handleSelect = (optionId: string) => {
    if (disabled) return;

    if (settings.selectionMode === 'single') {
      onChange(optionId);
    } else {
      const newSelection = selectedIds.includes(optionId)
        ? selectedIds.filter(id => id !== optionId)
        : [...selectedIds, optionId];
      onChange(newSelection);
    }
  };

  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-36 h-36',
    large: 'w-48 h-48',
  };

  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    auto: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', columnClasses[settings.columns])}>
      {options.map((option) => {
        const isSelected = selectedIds.includes(option.id);

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            disabled={disabled}
            className={cn(
              'relative flex flex-col items-center p-3 border-2 rounded-lg transition-all',
              isSelected
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-gray-200 hover:border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            <img
              src={option.imageUrl}
              alt={option.label || ''}
              className={cn(
                'object-cover rounded-md',
                sizeClasses[settings.imageSize]
              )}
            />

            {settings.showLabels && option.label && (
              <span className="mt-2 font-medium text-sm text-center">
                {option.label}
              </span>
            )}

            {settings.showCaptions && option.caption && (
              <span className="mt-1 text-xs text-gray-500 text-center">
                {option.caption}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

**File: `frontend/src/components/questions/SemanticDifferentialQuestion.tsx`**

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface SemanticScale {
  id: string;
  leftLabel: string;
  rightLabel: string;
}

interface SemanticDifferentialQuestionProps {
  question: {
    id: string;
    settings: {
      scalePoints: 5 | 7 | 9;
      showMiddleLabel: boolean;
      middleLabel?: string;
    };
    scales: SemanticScale[];
  };
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
  disabled?: boolean;
}

export function SemanticDifferentialQuestion({
  question,
  value = {},
  onChange,
  disabled,
}: SemanticDifferentialQuestionProps) {
  const { settings, scales } = question;
  const points = Array.from({ length: settings.scalePoints }, (_, i) => i + 1);
  const middlePoint = Math.ceil(settings.scalePoints / 2);

  const handleChange = (scaleId: string, point: number) => {
    if (disabled) return;
    onChange({ ...value, [scaleId]: point });
  };

  return (
    <div className="space-y-6">
      {/* Scale header */}
      <div className="flex items-center">
        <div className="w-32" /> {/* Spacer for left label */}
        <div className="flex-1 flex justify-between px-2">
          {points.map((point) => (
            <div key={point} className="w-8 text-center text-xs text-gray-500">
              {settings.showMiddleLabel && point === middlePoint
                ? settings.middleLabel || point
                : point}
            </div>
          ))}
        </div>
        <div className="w-32" /> {/* Spacer for right label */}
      </div>

      {/* Scale rows */}
      {scales.map((scale) => (
        <div key={scale.id} className="flex items-center">
          <div className="w-32 pr-4 text-right text-sm font-medium">
            {scale.leftLabel}
          </div>

          <div className="flex-1 flex justify-between items-center bg-gray-50 rounded-lg p-2">
            {points.map((point) => (
              <button
                key={point}
                type="button"
                onClick={() => handleChange(scale.id, point)}
                disabled={disabled}
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-all',
                  value[scale.id] === point
                    ? 'border-primary bg-primary'
                    : 'border-gray-300 bg-white hover:border-gray-400',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                aria-label={`${scale.leftLabel} to ${scale.rightLabel}: ${point}`}
              />
            ))}
          </div>

          <div className="w-32 pl-4 text-left text-sm font-medium">
            {scale.rightLabel}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**File: `frontend/src/components/questions/GeoLocationQuestion.tsx`**

```typescript
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';

interface GeoLocationQuestionProps {
  question: {
    id: string;
    settings: {
      mapProvider: 'openstreetmap';
      defaultCenter: { lat: number; lng: number };
      defaultZoom: number;
      selectionMode: 'point' | 'address';
      showSearchBox: boolean;
    };
  };
  value: { lat: number; lng: number; address?: string } | null;
  onChange: (value: { lat: number; lng: number; address?: string }) => void;
  disabled?: boolean;
}

export function GeoLocationQuestion({
  question,
  value,
  onChange,
  disabled,
}: GeoLocationQuestionProps) {
  const { settings } = question;
  const mapRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Use Leaflet for OpenStreetMap (dynamic import to avoid SSR issues)
  useEffect(() => {
    if (!mapRef.current) return;

    // Dynamically load Leaflet
    const loadMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      const map = L.map(mapRef.current!).setView(
        [settings.defaultCenter.lat, settings.defaultCenter.lng],
        settings.defaultZoom
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      let marker: L.Marker | null = null;

      if (value) {
        marker = L.marker([value.lat, value.lng]).addTo(map);
      }

      if (!disabled) {
        map.on('click', async (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;

          if (marker) {
            marker.setLatLng([lat, lng]);
          } else {
            marker = L.marker([lat, lng]).addTo(map);
          }

          // Reverse geocode
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            onChange({ lat, lng, address: data.display_name });
          } catch {
            onChange({ lat, lng });
          }
        });
      }

      return () => map.remove();
    };

    loadMap();
  }, [settings, disabled]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const results = await response.json();

      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        onChange({
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          address: display_name,
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {settings.showSearchBox && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a location..."
              disabled={disabled}
              className="w-full pl-10 pr-4 py-2 border rounded-md"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={disabled || isSearching}
            className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      )}

      <div
        ref={mapRef}
        className="w-full h-80 rounded-lg border bg-gray-100"
      />

      {value && (
        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-md">
          <MapPin className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">
              {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
            </p>
            {value.address && (
              <p className="text-sm text-gray-600 mt-1">{value.address}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4. Survey Builder Integration

**File: `frontend/src/components/surveyBuilder/QuestionTypePicker.tsx`**

```typescript
import React from 'react';
import {
  Image, GitBranch, MapPin, Calculator, Hash, FileText,
  EyeOff, User, Languages, PenTool
} from 'lucide-react';

const questionTypeCategories = [
  {
    name: 'Basic Input',
    types: ['SHORT_TEXT', 'LONG_TEXT', 'EMAIL', 'NUMBER', 'DATE', 'TIME'],
  },
  {
    name: 'Choice',
    types: ['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN', 'YES_NO', 'IMAGE_SELECT'],
  },
  {
    name: 'Scale & Rating',
    types: ['RATING_SCALE', 'NPS', 'LIKERT_SCALE', 'SLIDER', 'SEMANTIC_DIFFERENTIAL'],
  },
  {
    name: 'Matrix & Grid',
    types: ['MATRIX', 'RANKING', 'ARRAY_DUAL_SCALE', 'MULTIPLE_NUMERICAL'],
  },
  {
    name: 'Specialized',
    types: ['FILE_UPLOAD', 'GEO_LOCATION', 'SIGNATURE', 'GENDER', 'LANGUAGE_SWITCHER'],
  },
  {
    name: 'Display & Logic',
    types: ['BOILERPLATE', 'HIDDEN', 'EQUATION'],
  },
];

const typeIcons: Record<string, React.ComponentType> = {
  IMAGE_SELECT: Image,
  SEMANTIC_DIFFERENTIAL: GitBranch,
  GEO_LOCATION: MapPin,
  EQUATION: Calculator,
  MULTIPLE_NUMERICAL: Hash,
  BOILERPLATE: FileText,
  HIDDEN: EyeOff,
  GENDER: User,
  LANGUAGE_SWITCHER: Languages,
  SIGNATURE: PenTool,
};

// ... rest of component
```

---

## Implementation Order

### Sprint 1: Core Visual Types
1. **Image Select** - High demand, visual impact
2. **Boilerplate** - Simple, enables better survey design
3. **Hidden Input** - Technical necessity

### Sprint 2: Research Types
4. **Semantic Differential** - Academic/research essential
5. **Multiple Numerical** - Common business use case
6. **Array Dual Scale** - Important for satisfaction surveys

### Sprint 3: Specialized Types
7. **Equation** - Enables dynamic surveys
8. **Geo Location** - Growing demand for location data
9. **Gender** - Simple, inclusive demographics

### Sprint 4: Advanced Types
10. **Signature** - Legal/compliance requirement
11. **Language Switcher** - After i18n is complete

---

## Acceptance Criteria

For each question type:
- [ ] Database schema supports the type
- [ ] Question type renders correctly in survey builder
- [ ] Settings panel for type-specific configuration
- [ ] Question renders correctly to respondents
- [ ] Answer validation works correctly
- [ ] Answer storage in correct format
- [ ] Answer displays in analytics
- [ ] Export includes answer data
- [ ] Works on mobile devices
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Unit tests for validation
- [ ] Preview in builder works

---

## Files to Create/Modify

### New Files (per question type)
- `frontend/src/components/questions/{Type}Question.tsx`
- `frontend/src/components/surveyBuilder/{Type}Settings.tsx`
- `backend/src/services/questionTypes/{type}.ts`

### Modified Files
- `backend/prisma/schema.prisma` - Add types to enum
- `frontend/src/components/surveyBuilder/QuestionTypePicker.tsx`
- `frontend/src/components/survey/QuestionRenderer.tsx`
- `backend/src/services/analyticsService.ts` - Handle new types
- `backend/src/services/exportService.ts` - Export new types

---

## Dependencies

- Issue #001 (i18n) for Language Switcher question type
- May need additional npm packages:
  - `leaflet` for Geo Location
  - `signature_pad` for Signature

---

## Related Issues

- Issue #001 (i18n Framework) - Required for Language Switcher
- Issue #006 (Quotas) - Uses question values for quota logic
