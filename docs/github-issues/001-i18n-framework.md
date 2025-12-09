# [CRITICAL] Implement Internationalization (i18n) Framework

## Priority: P0 - Critical
## Labels: `feature`, `i18n`, `phase-1`, `critical`, `infrastructure`
## Estimated Effort: Large

---

## Summary

Implement a comprehensive internationalization (i18n) framework to support multiple languages throughout PulseGen. This is critical for competing with LimeSurvey which supports 80+ languages. The framework should support both the admin interface and survey respondent interface.

---

## Background & Motivation

LimeSurvey, our primary open-source competitor, supports 80+ languages with 116 interface translations. PulseGen currently only supports English, which:
- Excludes global markets (especially Europe, Asia, Latin America)
- Blocks enterprise customers with multinational teams
- Prevents academic researchers from conducting multilingual studies
- Limits our addressable market by ~70%

---

## Requirements

### Functional Requirements

1. **Admin Interface Localization**
   - All UI text, labels, buttons, and messages must be translatable
   - Language switcher in user settings and header
   - Persist user's language preference in database
   - Support for at least 10 initial languages

2. **Survey Builder Localization**
   - Survey creators can define surveys in multiple languages
   - Each survey can have a "base language" and multiple translations
   - Question text, options, descriptions all translatable
   - Welcome/thank you messages per language

3. **Survey Respondent Interface**
   - Auto-detect respondent's browser language
   - Manual language switcher on survey
   - All survey UI elements (buttons, progress, validation messages) translated
   - RTL (Right-to-Left) support for Arabic, Hebrew, etc.

4. **Initial Language Support**
   - English (en) - Base language
   - Spanish (es)
   - French (fr)
   - German (de)
   - Portuguese (pt)
   - Chinese Simplified (zh-CN)
   - Japanese (ja)
   - Arabic (ar) - RTL
   - Russian (ru)
   - Hindi (hi)

### Technical Requirements

1. **Frontend i18n Library**: Use `react-i18next` with `i18next`
2. **Translation File Format**: JSON namespace files
3. **Lazy Loading**: Load language files on-demand
4. **Interpolation**: Support dynamic values in translations
5. **Pluralization**: Handle plural forms correctly per language
6. **Date/Time/Number Formatting**: Use `Intl` API or date-fns locales

---

## Technical Implementation

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install i18next react-i18next i18next-http-backend i18next-browser-languagedetector
```

### 2. Create i18n Configuration

**File: `frontend/src/lib/i18n.ts`**

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

export const supportedLanguages = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
  { code: 'pt', name: 'Português', dir: 'ltr' },
  { code: 'zh-CN', name: '简体中文', dir: 'ltr' },
  { code: 'ja', name: '日本語', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'ru', name: 'Русский', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', dir: 'ltr' },
] as const;

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: supportedLanguages.map(l => l.code),
    ns: ['common', 'survey', 'auth', 'dashboard', 'analytics', 'settings'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

### 3. Translation File Structure

```
frontend/public/locales/
├── en/
│   ├── common.json      # Common UI elements
│   ├── survey.json      # Survey builder & taking
│   ├── auth.json        # Login, register, password
│   ├── dashboard.json   # Dashboard page
│   ├── analytics.json   # Analytics & reports
│   └── settings.json    # Settings pages
├── es/
│   ├── common.json
│   └── ...
├── fr/
│   └── ...
└── ... (other languages)
```

### 4. Example Translation Files

**`frontend/public/locales/en/common.json`**
```json
{
  "app": {
    "name": "PulseGen",
    "tagline": "AI-Powered Survey Platform"
  },
  "nav": {
    "dashboard": "Dashboard",
    "surveys": "Surveys",
    "analytics": "Analytics",
    "settings": "Settings",
    "logout": "Log out"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "submit": "Submit",
    "next": "Next",
    "previous": "Previous",
    "finish": "Finish"
  },
  "status": {
    "loading": "Loading...",
    "saving": "Saving...",
    "success": "Success!",
    "error": "An error occurred"
  },
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email",
    "minLength": "Must be at least {{min}} characters",
    "maxLength": "Must be no more than {{max}} characters"
  },
  "pagination": {
    "showing": "Showing {{from}} to {{to}} of {{total}} results",
    "previous": "Previous",
    "next": "Next"
  }
}
```

**`frontend/public/locales/en/survey.json`**
```json
{
  "builder": {
    "title": "Survey Builder",
    "addQuestion": "Add Question",
    "addPage": "Add Page",
    "preview": "Preview",
    "publish": "Publish",
    "saveDraft": "Save Draft"
  },
  "questionTypes": {
    "multipleChoice": "Multiple Choice",
    "checkboxes": "Checkboxes",
    "dropdown": "Dropdown",
    "shortText": "Short Text",
    "longText": "Long Text",
    "rating": "Rating Scale",
    "nps": "Net Promoter Score",
    "matrix": "Matrix",
    "ranking": "Ranking",
    "date": "Date",
    "time": "Time",
    "fileUpload": "File Upload",
    "slider": "Slider"
  },
  "respondent": {
    "welcome": "Welcome",
    "thankYou": "Thank you for completing this survey!",
    "progress": "Question {{current}} of {{total}}",
    "required": "* Required",
    "submitSurvey": "Submit Survey"
  }
}
```

### 5. Database Schema Changes

**Add to `backend/prisma/schema.prisma`:**

```prisma
// Add to User model
model User {
  // ... existing fields
  preferredLanguage String @default("en")
}

// Add new model for survey translations
model SurveyTranslation {
  id          String   @id @default(cuid())
  surveyId    String
  survey      Survey   @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  language    String   // ISO language code
  title       String
  description String?
  welcomeText String?
  thankYouText String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([surveyId, language])
  @@index([surveyId])
}

model QuestionTranslation {
  id          String   @id @default(cuid())
  questionId  String
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  language    String
  text        String
  description String?
  placeholder String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([questionId, language])
  @@index([questionId])
}

model QuestionOptionTranslation {
  id        String         @id @default(cuid())
  optionId  String
  option    QuestionOption @relation(fields: [optionId], references: [id], onDelete: Cascade)
  language  String
  text      String
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  @@unique([optionId, language])
  @@index([optionId])
}

// Add to Survey model
model Survey {
  // ... existing fields
  baseLanguage   String              @default("en")
  translations   SurveyTranslation[]
}
```

### 6. Backend API Endpoints

**File: `backend/src/routes/i18nRoutes.ts`**

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get available languages
router.get('/languages', (req, res) => {
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
    { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', dir: 'ltr' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  ];
  res.json(languages);
});

// Update user language preference
router.put('/user/language', authenticate, async (req, res) => {
  const { language } = req.body;
  const userId = req.user.id;

  await prisma.user.update({
    where: { id: userId },
    data: { preferredLanguage: language }
  });

  res.json({ success: true });
});

// Survey translation endpoints
router.post('/surveys/:surveyId/translations', authenticate, async (req, res) => {
  // Add translation for a survey
});

router.get('/surveys/:surveyId/translations', async (req, res) => {
  // Get all translations for a survey
});

router.put('/surveys/:surveyId/translations/:language', authenticate, async (req, res) => {
  // Update translation for specific language
});

export default router;
```

### 7. React Components

**File: `frontend/src/components/LanguageSwitcher.tsx`**

```typescript
import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../lib/i18n';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    // Update document direction for RTL languages
    const lang = supportedLanguages.find(l => l.code === langCode);
    document.documentElement.dir = lang?.dir || 'ltr';
    document.documentElement.lang = langCode;
  };

  const currentLang = supportedLanguages.find(l => l.code === i18n.language);

  return (
    <div className="relative">
      <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100">
        <Globe className="w-4 h-4" />
        <span>{currentLang?.name || 'English'}</span>
      </button>
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border">
        {supportedLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
              i18n.language === lang.code ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 8. RTL Support CSS

**Add to `frontend/src/index.css`:**

```css
/* RTL Support */
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .flex-row {
  flex-direction: row-reverse;
}

[dir="rtl"] .ml-auto {
  margin-left: 0;
  margin-right: auto;
}

[dir="rtl"] .mr-auto {
  margin-right: 0;
  margin-left: auto;
}

/* Add RTL variants for spacing utilities */
[dir="rtl"] .space-x-4 > * + * {
  margin-left: 0;
  margin-right: 1rem;
}
```

---

## Acceptance Criteria

- [ ] i18next configured and working in frontend
- [ ] Language switcher component in header and settings
- [ ] User language preference persisted in database
- [ ] All common UI elements have translation keys
- [ ] Survey builder UI fully translatable
- [ ] Survey respondent UI fully translatable
- [ ] Database schema supports survey translations
- [ ] API endpoints for managing translations
- [ ] RTL layout works correctly for Arabic
- [ ] At least English and Spanish fully translated
- [ ] Translation files organized by namespace
- [ ] Lazy loading of translation files working
- [ ] Date/time formatting respects locale
- [ ] Number formatting respects locale
- [ ] Pluralization works correctly
- [ ] Unit tests for i18n utilities
- [ ] Documentation for adding new languages

---

## Files to Create/Modify

### New Files
- `frontend/src/lib/i18n.ts`
- `frontend/src/components/LanguageSwitcher.tsx`
- `frontend/src/components/SurveyLanguageManager.tsx`
- `frontend/public/locales/en/*.json` (6 files)
- `frontend/public/locales/es/*.json` (6 files)
- `backend/src/routes/i18nRoutes.ts`
- `backend/src/services/translationService.ts`

### Modified Files
- `frontend/src/main.tsx` - Import and initialize i18n
- `frontend/src/App.tsx` - Wrap with I18nextProvider
- `frontend/src/index.css` - Add RTL styles
- `frontend/package.json` - Add i18n dependencies
- `backend/prisma/schema.prisma` - Add translation models
- `backend/src/routes/index.ts` - Register i18n routes
- All component files - Replace hardcoded strings with `t()` calls

---

## Testing Strategy

1. **Unit Tests**
   - Test language switching
   - Test translation key resolution
   - Test pluralization
   - Test interpolation

2. **Integration Tests**
   - Test API endpoints for translations
   - Test survey with multiple languages

3. **E2E Tests**
   - Test language switcher UI
   - Test RTL layout
   - Test survey taking in different languages

---

## Dependencies

- None (this is foundational infrastructure)

## Blocks

- Issue #002: Multi-language Survey Builder (depends on this)
- Issue #003: AI Auto-Translation (depends on this)

---

## Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [RTL Styling Guide](https://rtlstyling.com/)
- [LimeSurvey i18n Implementation](https://github.com/LimeSurvey/LimeSurvey/tree/master/locale)
