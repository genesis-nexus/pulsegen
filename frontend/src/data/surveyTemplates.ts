import { QuestionType } from '../types';

export interface TemplateQuestion {
  type: QuestionType;
  text: string;
  description?: string;
  isRequired?: boolean;
  options?: string[];
}

export type TemplateCategory =
  | 'Customer Experience'
  | 'Product'
  | 'Employee'
  | 'Marketing'
  | 'Research'
  | 'Events';

export interface SurveyTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  /** Rough time to complete for respondents */
  duration: string;
  /** Tailwind gradient classes used for the template card artwork */
  gradient: string;
  questions: TemplateQuestion[];
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Customer Experience',
  'Product',
  'Employee',
  'Marketing',
  'Research',
  'Events',
];

const AGREEMENT_SCALE = [
  'Strongly disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly agree',
];

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: 'nps',
    name: 'Net Promoter Score (NPS)',
    description:
      'The industry-standard loyalty metric. Measure how likely customers are to recommend you and learn why.',
    category: 'Customer Experience',
    duration: '1 min',
    gradient: 'from-emerald-500 to-teal-600',
    questions: [
      {
        type: QuestionType.NPS,
        text: 'How likely are you to recommend us to a friend or colleague?',
        isRequired: true,
      },
      {
        type: QuestionType.LONG_TEXT,
        text: 'What is the primary reason for your score?',
        description: 'Your honest feedback helps us improve.',
      },
      {
        type: QuestionType.SHORT_TEXT,
        text: 'What is one thing we could do to improve your experience?',
      },
    ],
  },
  {
    id: 'csat',
    name: 'Customer Satisfaction (CSAT)',
    description:
      'A quick pulse on how satisfied customers are with your product, service, or a recent interaction.',
    category: 'Customer Experience',
    duration: '2 min',
    gradient: 'from-sky-500 to-blue-600',
    questions: [
      {
        type: QuestionType.RATING_SCALE,
        text: 'Overall, how satisfied are you with our product/service?',
        description: '1 = Very dissatisfied, 5 = Very satisfied',
        isRequired: true,
      },
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'Which aspect influenced your rating the most?',
        options: ['Product quality', 'Customer support', 'Pricing', 'Ease of use', 'Delivery / speed'],
      },
      {
        type: QuestionType.YES_NO,
        text: 'Did our team resolve your issue on the first contact?',
      },
      {
        type: QuestionType.LONG_TEXT,
        text: 'Is there anything else you would like to share about your experience?',
      },
    ],
  },
  {
    id: 'ces',
    name: 'Customer Effort Score (CES)',
    description:
      'Find friction. Measure how easy it was for customers to get what they needed done.',
    category: 'Customer Experience',
    duration: '1 min',
    gradient: 'from-cyan-500 to-sky-600',
    questions: [
      {
        type: QuestionType.LIKERT_SCALE,
        text: 'The company made it easy for me to handle my issue.',
        isRequired: true,
        options: AGREEMENT_SCALE,
      },
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'What made the process difficult, if anything?',
        options: [
          'Nothing, it was easy',
          'Hard to find the right information',
          'Too many steps',
          'Slow response times',
          'Had to repeat myself',
        ],
      },
      {
        type: QuestionType.LONG_TEXT,
        text: 'How could we make this easier for you next time?',
      },
    ],
  },
  {
    id: 'pmf',
    name: 'Product-Market Fit',
    description:
      "The Sean Ellis test. Learn how disappointed users would be without your product and who your superfans are.",
    category: 'Product',
    duration: '3 min',
    gradient: 'from-violet-500 to-purple-600',
    questions: [
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'How would you feel if you could no longer use our product?',
        isRequired: true,
        options: ['Very disappointed', 'Somewhat disappointed', 'Not disappointed'],
      },
      {
        type: QuestionType.SHORT_TEXT,
        text: 'What type of people do you think would most benefit from our product?',
      },
      {
        type: QuestionType.LONG_TEXT,
        text: 'What is the main benefit you receive from our product?',
      },
      {
        type: QuestionType.LONG_TEXT,
        text: 'How can we improve the product for you?',
      },
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'How did you discover our product?',
        options: ['Search engine', 'Social media', 'Friend or colleague', 'Advertising', 'Other'],
      },
    ],
  },
  {
    id: 'onboarding-feedback',
    name: 'Onboarding Feedback',
    description:
      'Catch new users while the experience is fresh. Understand how smooth your first-run experience is.',
    category: 'Product',
    duration: '2 min',
    gradient: 'from-fuchsia-500 to-pink-600',
    questions: [
      {
        type: QuestionType.RATING_SCALE,
        text: 'How easy was it to get started with our product?',
        description: '1 = Very difficult, 5 = Very easy',
        isRequired: true,
      },
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'How long did it take you to get set up?',
        options: ['Under 10 minutes', '10–30 minutes', '30–60 minutes', 'More than an hour', "I'm still not set up"],
      },
      {
        type: QuestionType.CHECKBOXES,
        text: 'Where did you get stuck or feel unsure? (Select all that apply)',
        options: [
          'Creating my account',
          'Understanding the main features',
          'Inviting my team',
          'Connecting integrations',
          'I did not get stuck anywhere',
        ],
      },
      {
        type: QuestionType.LONG_TEXT,
        text: 'What almost stopped you from signing up?',
      },
    ],
  },
  {
    id: 'feature-feedback',
    name: 'Feature Feedback',
    description:
      'Just shipped something new? Learn whether users found it, used it, and loved it.',
    category: 'Product',
    duration: '2 min',
    gradient: 'from-indigo-500 to-violet-600',
    questions: [
      {
        type: QuestionType.YES_NO,
        text: 'Have you tried the new feature yet?',
        isRequired: true,
      },
      {
        type: QuestionType.RATING_SCALE,
        text: 'How useful is this feature to you?',
        description: '1 = Not useful at all, 5 = Extremely useful',
      },
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'How often do you expect to use it?',
        options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'],
      },
      {
        type: QuestionType.LONG_TEXT,
        text: 'What would make this feature more valuable to you?',
      },
    ],
  },
  {
    id: 'churn',
    name: 'Churn / Cancellation Survey',
    description:
      'Turn goodbyes into insight. Understand why customers leave and what could win them back.',
    category: 'Customer Experience',
    duration: '2 min',
    gradient: 'from-rose-500 to-red-600',
    questions: [
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'What is the main reason you are cancelling?',
        isRequired: true,
        options: [
          'Too expensive',
          'Missing features I need',
          'Found a better alternative',
          'Too difficult to use',
          'No longer need it',
          'Other',
        ],
      },
      {
        type: QuestionType.SHORT_TEXT,
        text: 'If you switched to an alternative, which one?',
      },
      {
        type: QuestionType.RATING_SCALE,
        text: 'How likely are you to return in the future?',
        description: '1 = Very unlikely, 5 = Very likely',
      },
      {
        type: QuestionType.LONG_TEXT,
        text: 'What is one thing we could have done to keep you?',
      },
    ],
  },
  {
    id: 'employee-engagement',
    name: 'Employee Engagement (eNPS)',
    description:
      'Measure how your team really feels about work, leadership, growth, and culture — anonymously.',
    category: 'Employee',
    duration: '5 min',
    gradient: 'from-amber-500 to-orange-600',
    questions: [
      {
        type: QuestionType.NPS,
        text: 'How likely are you to recommend this company as a place to work?',
        isRequired: true,
      },
      {
        type: QuestionType.LIKERT_SCALE,
        text: 'I feel valued and recognized for my contributions.',
        options: AGREEMENT_SCALE,
      },
      {
        type: QuestionType.LIKERT_SCALE,
        text: 'I have opportunities to learn and grow in my role.',
        options: AGREEMENT_SCALE,
      },
      {
        type: QuestionType.LIKERT_SCALE,
        text: 'Leadership communicates a clear vision for the company.',
        options: AGREEMENT_SCALE,
      },
      {
        type: QuestionType.LIKERT_SCALE,
        text: 'I can maintain a healthy balance between work and personal life.',
        options: AGREEMENT_SCALE,
      },
      {
        type: QuestionType.LONG_TEXT,
        text: 'What is one thing we could change to make this a better place to work?',
      },
    ],
  },
  {
    id: 'event-feedback',
    name: 'Event Feedback',
    description:
      'Post-event pulse for conferences, webinars, and meetups. Learn what worked and what to improve.',
    category: 'Events',
    duration: '3 min',
    gradient: 'from-lime-500 to-green-600',
    questions: [
      {
        type: QuestionType.RATING_SCALE,
        text: 'How would you rate the event overall?',
        description: '1 = Poor, 5 = Excellent',
        isRequired: true,
      },
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'Which part of the event did you find most valuable?',
        options: ['Speakers / sessions', 'Networking', 'Workshops', 'Q&A / panels', 'Other'],
      },
      {
        type: QuestionType.RATING_SCALE,
        text: 'How satisfied were you with the event organization and logistics?',
        description: '1 = Very dissatisfied, 5 = Very satisfied',
      },
      {
        type: QuestionType.YES_NO,
        text: 'Would you attend this event again next year?',
      },
      {
        type: QuestionType.LONG_TEXT,
        text: 'What topics or speakers would you like to see next time?',
      },
    ],
  },
  {
    id: 'website-feedback',
    name: 'Website Feedback',
    description:
      'Understand whether visitors find what they came for and where your website falls short.',
    category: 'Marketing',
    duration: '2 min',
    gradient: 'from-blue-500 to-indigo-600',
    questions: [
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'What brought you to our website today?',
        isRequired: true,
        options: [
          'Researching a purchase',
          'Looking for support / help',
          'Comparing with alternatives',
          'Just browsing',
          'Other',
        ],
      },
      {
        type: QuestionType.YES_NO,
        text: 'Did you find what you were looking for?',
        isRequired: true,
      },
      {
        type: QuestionType.RATING_SCALE,
        text: 'How easy was it to navigate our website?',
        description: '1 = Very difficult, 5 = Very easy',
      },
      {
        type: QuestionType.LONG_TEXT,
        text: 'What was missing or could be improved on this page?',
      },
    ],
  },
  {
    id: 'user-research',
    name: 'User Research Screener',
    description:
      'Recruit the right participants for interviews and usability tests with qualifying questions.',
    category: 'Research',
    duration: '3 min',
    gradient: 'from-slate-500 to-slate-700',
    questions: [
      {
        type: QuestionType.SHORT_TEXT,
        text: 'What is your current job title?',
        isRequired: true,
      },
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'How large is the company you work for?',
        options: ['Just me', '2–10 people', '11–50 people', '51–200 people', '200+ people'],
      },
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'How often do you use tools like ours?',
        isRequired: true,
        options: ['Daily', 'A few times a week', 'A few times a month', 'Rarely', 'Never'],
      },
      {
        type: QuestionType.YES_NO,
        text: 'Would you be open to a 30-minute video interview?',
        isRequired: true,
      },
      {
        type: QuestionType.EMAIL,
        text: 'What email address can we reach you at?',
        description: 'Only used to schedule the interview.',
      },
    ],
  },
  {
    id: 'market-research',
    name: 'Market Research',
    description:
      'Validate demand before you build. Explore your audience, their problems, and willingness to pay.',
    category: 'Research',
    duration: '4 min',
    gradient: 'from-teal-500 to-emerald-600',
    questions: [
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'How do you currently solve this problem?',
        isRequired: true,
        options: [
          'A dedicated tool',
          'Spreadsheets / manual process',
          'An internal solution we built',
          "We don't solve it today",
        ],
      },
      {
        type: QuestionType.RATING_SCALE,
        text: 'How painful is this problem for you or your team?',
        description: '1 = Barely noticeable, 5 = Extremely painful',
        isRequired: true,
      },
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: 'How much would you be willing to pay for a solution?',
        options: ['Nothing', 'Up to $10/month', '$10–50/month', '$50–200/month', 'More than $200/month'],
      },
      {
        type: QuestionType.CHECKBOXES,
        text: 'Which capabilities matter most to you? (Select up to 3)',
        options: [
          'Ease of use',
          'Integrations',
          'Automation / AI',
          'Reporting & analytics',
          'Collaboration',
          'Security & compliance',
        ],
      },
      {
        type: QuestionType.LONG_TEXT,
        text: 'Describe the last time you ran into this problem. What happened?',
      },
    ],
  },
];

/** Convert template option labels into API question option payloads. */
export function templateOptionsToPayload(options?: string[]) {
  if (!options) return undefined;
  return options.map((text) => ({
    text,
    value: text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, ''),
  }));
}
