import { QuestionType } from '@prisma/client';

// Question type metadata and configuration
export interface QuestionTypeConfig {
  type: QuestionType;
  label: string;
  description: string;
  category: 'input' | 'choice' | 'matrix' | 'advanced' | 'special';
  icon: string;
  supportsOptions: boolean;
  supportsValidation: boolean;
  defaultSettings: Record<string, any>;
  validateAnswer: (answer: any, settings?: any) => { valid: boolean; error?: string };
  formatForExport: (answer: any, settings?: any) => string | number | null;
}

// Question Type Registry
export const questionTypeRegistry: Record<QuestionType, QuestionTypeConfig> = {
  // ==================== INPUT TYPES ====================
  SHORT_TEXT: {
    type: 'SHORT_TEXT',
    label: 'Short Text',
    description: 'Single line text input',
    category: 'input',
    icon: 'text',
    supportsOptions: false,
    supportsValidation: true,
    defaultSettings: {
      placeholder: '',
      maxLength: 255,
      minLength: 0,
    },
    validateAnswer: (answer, settings) => {
      if (!answer?.textValue) return { valid: true };
      const text = answer.textValue;
      if (settings?.minLength && text.length < settings.minLength) {
        return { valid: false, error: `Minimum ${settings.minLength} characters required` };
      }
      if (settings?.maxLength && text.length > settings.maxLength) {
        return { valid: false, error: `Maximum ${settings.maxLength} characters allowed` };
      }
      return { valid: true };
    },
    formatForExport: (answer) => answer?.textValue || '',
  },

  LONG_TEXT: {
    type: 'LONG_TEXT',
    label: 'Long Text',
    description: 'Multi-line text area',
    category: 'input',
    icon: 'align-left',
    supportsOptions: false,
    supportsValidation: true,
    defaultSettings: {
      placeholder: '',
      maxLength: 5000,
      minLength: 0,
      rows: 5,
    },
    validateAnswer: (answer, settings) => {
      if (!answer?.textValue) return { valid: true };
      const text = answer.textValue;
      if (settings?.minLength && text.length < settings.minLength) {
        return { valid: false, error: `Minimum ${settings.minLength} characters required` };
      }
      if (settings?.maxLength && text.length > settings.maxLength) {
        return { valid: false, error: `Maximum ${settings.maxLength} characters allowed` };
      }
      return { valid: true };
    },
    formatForExport: (answer) => answer?.textValue || '',
  },

  EMAIL: {
    type: 'EMAIL',
    label: 'Email',
    description: 'Email address input',
    category: 'input',
    icon: 'mail',
    supportsOptions: false,
    supportsValidation: true,
    defaultSettings: {
      placeholder: 'email@example.com',
    },
    validateAnswer: (answer) => {
      if (!answer?.textValue) return { valid: true };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(answer.textValue)) {
        return { valid: false, error: 'Invalid email format' };
      }
      return { valid: true };
    },
    formatForExport: (answer) => answer?.textValue || '',
  },

  NUMBER: {
    type: 'NUMBER',
    label: 'Number',
    description: 'Numeric input',
    category: 'input',
    icon: 'hash',
    supportsOptions: false,
    supportsValidation: true,
    defaultSettings: {
      min: null,
      max: null,
      step: 1,
      allowDecimals: true,
    },
    validateAnswer: (answer, settings) => {
      if (answer?.numberValue === null || answer?.numberValue === undefined) {
        return { valid: true };
      }
      const num = answer.numberValue;
      if (settings?.min !== null && num < settings.min) {
        return { valid: false, error: `Minimum value is ${settings.min}` };
      }
      if (settings?.max !== null && num > settings.max) {
        return { valid: false, error: `Maximum value is ${settings.max}` };
      }
      return { valid: true };
    },
    formatForExport: (answer) => answer?.numberValue ?? '',
  },

  DATE: {
    type: 'DATE',
    label: 'Date',
    description: 'Date picker',
    category: 'input',
    icon: 'calendar',
    supportsOptions: false,
    supportsValidation: true,
    defaultSettings: {
      format: 'YYYY-MM-DD',
      minDate: null,
      maxDate: null,
    },
    validateAnswer: (answer, settings) => {
      if (!answer?.dateValue) return { valid: true };
      const date = new Date(answer.dateValue);
      if (settings?.minDate && date < new Date(settings.minDate)) {
        return { valid: false, error: 'Date is before minimum allowed' };
      }
      if (settings?.maxDate && date > new Date(settings.maxDate)) {
        return { valid: false, error: 'Date is after maximum allowed' };
      }
      return { valid: true };
    },
    formatForExport: (answer) => answer?.dateValue ? new Date(answer.dateValue).toISOString().split('T')[0] : '',
  },

  TIME: {
    type: 'TIME',
    label: 'Time',
    description: 'Time picker',
    category: 'input',
    icon: 'clock',
    supportsOptions: false,
    supportsValidation: false,
    defaultSettings: {
      format: '24h',
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => answer?.textValue || '',
  },

  FILE_UPLOAD: {
    type: 'FILE_UPLOAD',
    label: 'File Upload',
    description: 'File upload field',
    category: 'input',
    icon: 'upload',
    supportsOptions: false,
    supportsValidation: true,
    defaultSettings: {
      maxSize: 10485760, // 10MB
      allowedTypes: ['image/*', 'application/pdf'],
      multiple: false,
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => answer?.fileUrl || '',
  },

  // ==================== CHOICE TYPES ====================
  MULTIPLE_CHOICE: {
    type: 'MULTIPLE_CHOICE',
    label: 'Multiple Choice',
    description: 'Single selection from options',
    category: 'choice',
    icon: 'circle',
    supportsOptions: true,
    supportsValidation: false,
    defaultSettings: {
      allowOther: false,
      randomize: false,
    },
    validateAnswer: (answer) => {
      if (!answer?.optionId) return { valid: true };
      return { valid: true };
    },
    formatForExport: (answer) => answer?.textValue || '',
  },

  CHECKBOXES: {
    type: 'CHECKBOXES',
    label: 'Checkboxes',
    description: 'Multiple selections allowed',
    category: 'choice',
    icon: 'check-square',
    supportsOptions: true,
    supportsValidation: true,
    defaultSettings: {
      allowOther: false,
      randomize: false,
      minSelections: null,
      maxSelections: null,
    },
    validateAnswer: (answer, settings) => {
      if (!answer?.metadata?.selectedOptions) return { valid: true };
      const count = answer.metadata.selectedOptions.length;
      if (settings?.minSelections && count < settings.minSelections) {
        return { valid: false, error: `Select at least ${settings.minSelections} options` };
      }
      if (settings?.maxSelections && count > settings.maxSelections) {
        return { valid: false, error: `Select at most ${settings.maxSelections} options` };
      }
      return { valid: true };
    },
    formatForExport: (answer) => {
      if (!answer?.metadata?.selectedOptions) return '';
      return answer.metadata.selectedOptions.join(', ');
    },
  },

  DROPDOWN: {
    type: 'DROPDOWN',
    label: 'Dropdown',
    description: 'Dropdown selection',
    category: 'choice',
    icon: 'chevron-down',
    supportsOptions: true,
    supportsValidation: false,
    defaultSettings: {
      allowOther: false,
      searchable: false,
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => answer?.textValue || '',
  },

  YES_NO: {
    type: 'YES_NO',
    label: 'Yes/No',
    description: 'Binary choice question',
    category: 'choice',
    icon: 'toggle-right',
    supportsOptions: false,
    supportsValidation: false,
    defaultSettings: {},
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => answer?.textValue || '',
  },

  // ==================== IMAGE SELECT (NEW) ====================
  IMAGE_SELECT: {
    type: 'IMAGE_SELECT',
    label: 'Image Select',
    description: 'Select from image options',
    category: 'choice',
    icon: 'image',
    supportsOptions: true,
    supportsValidation: true,
    defaultSettings: {
      multiple: false,
      columns: 3,
      imageSize: 'medium',
      showLabels: true,
      minSelections: null,
      maxSelections: null,
    },
    validateAnswer: (answer, settings) => {
      if (settings?.multiple && answer?.metadata?.selectedOptions) {
        const count = answer.metadata.selectedOptions.length;
        if (settings?.minSelections && count < settings.minSelections) {
          return { valid: false, error: `Select at least ${settings.minSelections} images` };
        }
        if (settings?.maxSelections && count > settings.maxSelections) {
          return { valid: false, error: `Select at most ${settings.maxSelections} images` };
        }
      }
      return { valid: true };
    },
    formatForExport: (answer) => {
      if (answer?.metadata?.selectedOptions) {
        return answer.metadata.selectedOptions.join(', ');
      }
      return answer?.textValue || '';
    },
  },

  // ==================== RATING/SCALE TYPES ====================
  RATING_SCALE: {
    type: 'RATING_SCALE',
    label: 'Rating Scale',
    description: 'Numeric rating scale',
    category: 'choice',
    icon: 'star',
    supportsOptions: false,
    supportsValidation: false,
    defaultSettings: {
      min: 1,
      max: 5,
      step: 1,
      icon: 'star',
      labels: { min: '', max: '' },
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => answer?.numberValue ?? '',
  },

  NPS: {
    type: 'NPS',
    label: 'Net Promoter Score',
    description: '0-10 recommendation scale',
    category: 'choice',
    icon: 'trending-up',
    supportsOptions: false,
    supportsValidation: false,
    defaultSettings: {
      showLabels: true,
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => answer?.numberValue ?? '',
  },

  LIKERT_SCALE: {
    type: 'LIKERT_SCALE',
    label: 'Likert Scale',
    description: 'Agreement scale',
    category: 'choice',
    icon: 'bar-chart',
    supportsOptions: true,
    supportsValidation: false,
    defaultSettings: {
      points: 5,
      labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => answer?.textValue || '',
  },

  SLIDER: {
    type: 'SLIDER',
    label: 'Slider',
    description: 'Continuous value slider',
    category: 'choice',
    icon: 'sliders',
    supportsOptions: false,
    supportsValidation: false,
    defaultSettings: {
      min: 0,
      max: 100,
      step: 1,
      showValue: true,
      labels: { min: '', max: '' },
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => answer?.numberValue ?? '',
  },

  // ==================== SEMANTIC DIFFERENTIAL (NEW) ====================
  SEMANTIC_DIFFERENTIAL: {
    type: 'SEMANTIC_DIFFERENTIAL',
    label: 'Semantic Differential',
    description: 'Bipolar scale between opposing adjectives',
    category: 'choice',
    icon: 'git-commit',
    supportsOptions: false,
    supportsValidation: false,
    defaultSettings: {
      leftLabel: 'Strongly Disagree',
      rightLabel: 'Strongly Agree',
      steps: 7,
      showMiddleLabel: false,
      middleLabel: 'Neutral',
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => answer?.numberValue ?? '',
  },

  // ==================== MATRIX TYPES ====================
  MATRIX: {
    type: 'MATRIX',
    label: 'Matrix',
    description: 'Grid of questions and options',
    category: 'matrix',
    icon: 'grid',
    supportsOptions: true,
    supportsValidation: false,
    defaultSettings: {
      rows: [],
      columns: [],
      allowMultiple: false,
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => {
      if (!answer?.metadata?.matrix) return '';
      return JSON.stringify(answer.metadata.matrix);
    },
  },

  // ==================== ARRAY DUAL SCALE (NEW) ====================
  ARRAY_DUAL_SCALE: {
    type: 'ARRAY_DUAL_SCALE',
    label: 'Array Dual Scale',
    description: 'Matrix with two independent scales',
    category: 'matrix',
    icon: 'columns',
    supportsOptions: false,
    supportsValidation: false,
    defaultSettings: {
      rows: [],
      scale1Label: 'Importance',
      scale2Label: 'Satisfaction',
      steps: 5,
      scale1Options: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
      scale2Options: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'],
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => {
      if (!answer?.metadata?.dualScaleMatrix) return '';
      return JSON.stringify(answer.metadata.dualScaleMatrix);
    },
  },

  // ==================== RANKING ====================
  RANKING: {
    type: 'RANKING',
    label: 'Ranking',
    description: 'Rank items in order',
    category: 'choice',
    icon: 'list-ordered',
    supportsOptions: true,
    supportsValidation: false,
    defaultSettings: {
      minRanked: null,
      maxRanked: null,
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => {
      if (!answer?.metadata?.rankedOptions) return '';
      return answer.metadata.rankedOptions.join(', ');
    },
  },

  // ==================== ADVANCED TYPES ====================

  // GEO LOCATION (NEW)
  GEO_LOCATION: {
    type: 'GEO_LOCATION',
    label: 'Geo Location',
    description: 'Location picker with map',
    category: 'advanced',
    icon: 'map-pin',
    supportsOptions: false,
    supportsValidation: false,
    defaultSettings: {
      captureMode: 'both', // 'coordinates', 'address', 'both'
      defaultZoom: 13,
      allowManualEntry: true,
      requireCoordinates: true,
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => {
      if (!answer?.metadata?.location) return '';
      const loc = answer.metadata.location;
      if (loc.address) return loc.address;
      if (loc.latitude && loc.longitude) {
        return `${loc.latitude}, ${loc.longitude}`;
      }
      return '';
    },
  },

  // MULTIPLE NUMERICAL (NEW)
  MULTIPLE_NUMERICAL: {
    type: 'MULTIPLE_NUMERICAL',
    label: 'Multiple Numerical',
    description: 'Multiple number inputs',
    category: 'advanced',
    icon: 'calculator',
    supportsOptions: false,
    supportsValidation: true,
    defaultSettings: {
      fields: [
        { name: 'field1', label: 'Field 1', min: null, max: null, suffix: '' }
      ],
      validateSum: false,
      targetSum: null,
    },
    validateAnswer: (answer, settings) => {
      if (!answer?.metadata?.numericalValues) return { valid: true };
      const values = answer.metadata.numericalValues;

      if (settings?.validateSum && settings?.targetSum !== null) {
        const sum = Object.values(values).reduce((acc: number, val: any) => acc + (val || 0), 0);
        if (sum !== settings.targetSum) {
          return { valid: false, error: `Values must sum to ${settings.targetSum}` };
        }
      }
      return { valid: true };
    },
    formatForExport: (answer) => {
      if (!answer?.metadata?.numericalValues) return '';
      return JSON.stringify(answer.metadata.numericalValues);
    },
  },

  // EQUATION (NEW)
  EQUATION: {
    type: 'EQUATION',
    label: 'Equation',
    description: 'Calculated value from other answers',
    category: 'advanced',
    icon: 'function',
    supportsOptions: false,
    supportsValidation: false,
    defaultSettings: {
      formula: '',
      displayFormat: 'number',
      precision: 2,
      prefix: '',
      suffix: '',
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => answer?.numberValue?.toString() || '',
  },

  // ==================== SPECIAL TYPES ====================

  // BOILERPLATE (NEW)
  BOILERPLATE: {
    type: 'BOILERPLATE',
    label: 'Boilerplate Text',
    description: 'Display-only text block',
    category: 'special',
    icon: 'file-text',
    supportsOptions: false,
    supportsValidation: false,
    defaultSettings: {
      content: '',
      allowHtml: true,
      style: 'default', // 'default', 'info', 'warning', 'success'
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: () => '',
  },

  // HIDDEN (NEW)
  HIDDEN: {
    type: 'HIDDEN',
    label: 'Hidden Field',
    description: 'Hidden data field',
    category: 'special',
    icon: 'eye-off',
    supportsOptions: false,
    supportsValidation: false,
    defaultSettings: {
      defaultValue: '',
      valueSource: 'static', // 'static', 'url_param', 'session', 'calculated'
      paramName: '',
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => answer?.textValue || '',
  },

  // GENDER (NEW)
  GENDER: {
    type: 'GENDER',
    label: 'Gender',
    description: 'Gender selection field',
    category: 'special',
    icon: 'users',
    supportsOptions: false,
    supportsValidation: false,
    defaultSettings: {
      options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
      allowCustom: true,
      customLabel: 'Other (please specify)',
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => answer?.textValue || '',
  },

  // LANGUAGE SWITCHER (NEW)
  LANGUAGE_SWITCHER: {
    type: 'LANGUAGE_SWITCHER',
    label: 'Language Switcher',
    description: 'Survey language selector',
    category: 'special',
    icon: 'globe',
    supportsOptions: false,
    supportsValidation: false,
    defaultSettings: {
      availableLanguages: ['en', 'es', 'fr', 'de'],
      displayStyle: 'dropdown', // 'dropdown', 'flags', 'buttons'
      showInHeader: true,
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => answer?.textValue || '',
  },

  // SIGNATURE (NEW)
  SIGNATURE: {
    type: 'SIGNATURE',
    label: 'Signature',
    description: 'Digital signature pad',
    category: 'special',
    icon: 'edit-3',
    supportsOptions: false,
    supportsValidation: false,
    defaultSettings: {
      width: 500,
      height: 200,
      penColor: '#000000',
      backgroundColor: '#FFFFFF',
      format: 'png', // 'png', 'jpg', 'svg'
    },
    validateAnswer: () => ({ valid: true }),
    formatForExport: (answer) => answer?.fileUrl || '',
  },
};

// Helper functions
export function getQuestionTypeConfig(type: QuestionType): QuestionTypeConfig {
  return questionTypeRegistry[type];
}

export function getQuestionTypesByCategory(category: string): QuestionTypeConfig[] {
  return Object.values(questionTypeRegistry).filter(config => config.category === category);
}

export function getAllQuestionTypes(): QuestionTypeConfig[] {
  return Object.values(questionTypeRegistry);
}

export function validateQuestionAnswer(
  type: QuestionType,
  answer: any,
  settings?: any
): { valid: boolean; error?: string } {
  const config = getQuestionTypeConfig(type);
  return config.validateAnswer(answer, settings);
}

export function formatAnswerForExport(
  type: QuestionType,
  answer: any,
  settings?: any
): string | number | null {
  const config = getQuestionTypeConfig(type);
  return config.formatForExport(answer, settings);
}
