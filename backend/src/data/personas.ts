/**
 * Industry-based User Personas for Automation
 * These personas define realistic user profiles across different industries
 */

export interface PersonaAttribute {
  age: number;
  gender: string;
  occupation: string;
  experience: string;
  techSavviness: 'low' | 'medium' | 'high';
  educationLevel: string;
  location: string;
}

export interface IndustryPersona {
  id: string;
  industry: string;
  name: string;
  description: string;
  targetAudience: string;
  surveyTopics: string[];
  questionTypes: string[];
  typicalQuestions: string[];
  attributes: PersonaAttribute[];
  responsePatterns: {
    completionRate: number; // 0-100
    averageTime: number; // seconds
    dropoffPoints: number[]; // question indices
  };
}

export const INDUSTRY_PERSONAS: IndustryPersona[] = [
  {
    id: 'healthcare-patient-satisfaction',
    industry: 'Healthcare',
    name: 'Patient Satisfaction Survey',
    description: 'Hospital/clinic patient feedback collection',
    targetAudience: 'Patients aged 25-75 who recently visited a healthcare facility',
    surveyTopics: [
      'Wait time experience',
      'Staff professionalism',
      'Facility cleanliness',
      'Treatment effectiveness',
      'Communication quality',
      'Billing transparency',
      'Overall satisfaction'
    ],
    questionTypes: ['RATING_SCALE', 'NPS', 'MULTIPLE_CHOICE', 'LONG_TEXT', 'YES_NO'],
    typicalQuestions: [
      'How would you rate your overall experience?',
      'How long did you wait to see a healthcare provider?',
      'Were the staff members courteous and professional?',
      'How clean was the facility?',
      'Did you understand your treatment plan?',
      'How likely are you to recommend our facility?'
    ],
    attributes: [
      { age: 28, gender: 'Female', occupation: 'Teacher', experience: 'First-time patient', techSavviness: 'medium', educationLevel: 'Bachelor\'s', location: 'Urban' },
      { age: 45, gender: 'Male', occupation: 'Engineer', experience: 'Regular patient', techSavviness: 'high', educationLevel: 'Master\'s', location: 'Suburban' },
      { age: 62, gender: 'Female', occupation: 'Retired', experience: 'Frequent patient', techSavviness: 'low', educationLevel: 'High School', location: 'Rural' },
      { age: 35, gender: 'Non-binary', occupation: 'Designer', experience: 'Occasional patient', techSavviness: 'high', educationLevel: 'Bachelor\'s', location: 'Urban' },
      { age: 52, gender: 'Male', occupation: 'Manager', experience: 'Regular patient', techSavviness: 'medium', educationLevel: 'MBA', location: 'Suburban' }
    ],
    responsePatterns: {
      completionRate: 85,
      averageTime: 240,
      dropoffPoints: [8, 12]
    }
  },
  {
    id: 'retail-customer-experience',
    industry: 'Retail',
    name: 'Customer Experience Survey',
    description: 'Retail store customer satisfaction and shopping experience',
    targetAudience: 'Shoppers aged 18-65 who made a purchase in the last 7 days',
    surveyTopics: [
      'Product availability',
      'Store layout and navigation',
      'Checkout experience',
      'Staff helpfulness',
      'Price satisfaction',
      'Product quality',
      'Return/exchange experience'
    ],
    questionTypes: ['RATING_SCALE', 'NPS', 'MULTIPLE_CHOICE', 'CHECKBOXES', 'SHORT_TEXT'],
    typicalQuestions: [
      'How satisfied are you with your recent purchase?',
      'Was the product you wanted in stock?',
      'How easy was it to find what you were looking for?',
      'How would you rate the checkout process?',
      'How likely are you to shop with us again?',
      'What could we improve?'
    ],
    attributes: [
      { age: 22, gender: 'Female', occupation: 'Student', experience: 'First-time shopper', techSavviness: 'high', educationLevel: 'Some College', location: 'Urban' },
      { age: 38, gender: 'Male', occupation: 'Sales Manager', experience: 'Frequent shopper', techSavviness: 'medium', educationLevel: 'Bachelor\'s', location: 'Suburban' },
      { age: 55, gender: 'Female', occupation: 'Accountant', experience: 'Regular shopper', techSavviness: 'medium', educationLevel: 'Master\'s', location: 'Suburban' },
      { age: 29, gender: 'Male', occupation: 'Developer', experience: 'Online shopper', techSavviness: 'high', educationLevel: 'Bachelor\'s', location: 'Urban' },
      { age: 44, gender: 'Female', occupation: 'Nurse', experience: 'Occasional shopper', techSavviness: 'low', educationLevel: 'Associate', location: 'Rural' }
    ],
    responsePatterns: {
      completionRate: 92,
      averageTime: 180,
      dropoffPoints: [10]
    }
  },
  {
    id: 'education-course-feedback',
    industry: 'Education',
    name: 'Course Evaluation Survey',
    description: 'Student feedback on course quality and instructor performance',
    targetAudience: 'Students aged 18-30 who completed a course or semester',
    surveyTopics: [
      'Course content quality',
      'Instructor effectiveness',
      'Learning materials',
      'Assessment fairness',
      'Workload appropriateness',
      'Skill development',
      'Overall learning experience'
    ],
    questionTypes: ['LIKERT_SCALE', 'RATING_SCALE', 'LONG_TEXT', 'MULTIPLE_CHOICE', 'CHECKBOXES'],
    typicalQuestions: [
      'The course content was well-organized and clear',
      'The instructor was knowledgeable and engaging',
      'The workload was appropriate for the credit hours',
      'Assessments fairly measured learning outcomes',
      'What did you like most about this course?',
      'How would you improve this course?'
    ],
    attributes: [
      { age: 19, gender: 'Male', occupation: 'Undergraduate', experience: 'Freshman', techSavviness: 'high', educationLevel: 'Some College', location: 'Urban' },
      { age: 23, gender: 'Female', occupation: 'Graduate Student', experience: 'Master\'s student', techSavviness: 'high', educationLevel: 'Bachelor\'s', location: 'Urban' },
      { age: 21, gender: 'Non-binary', occupation: 'Undergraduate', experience: 'Junior', techSavviness: 'high', educationLevel: 'Some College', location: 'Suburban' },
      { age: 27, gender: 'Female', occupation: 'PhD Candidate', experience: 'Doctoral student', techSavviness: 'high', educationLevel: 'Master\'s', location: 'Urban' },
      { age: 20, gender: 'Male', occupation: 'Undergraduate', experience: 'Sophomore', techSavviness: 'medium', educationLevel: 'Some College', location: 'Suburban' }
    ],
    responsePatterns: {
      completionRate: 78,
      averageTime: 300,
      dropoffPoints: [15]
    }
  },
  {
    id: 'hospitality-guest-experience',
    industry: 'Hospitality',
    name: 'Hotel Guest Experience Survey',
    description: 'Hotel guest satisfaction and service quality assessment',
    targetAudience: 'Hotel guests aged 25-65 who stayed within the last 30 days',
    surveyTopics: [
      'Booking experience',
      'Check-in/check-out process',
      'Room cleanliness',
      'Amenities quality',
      'Staff service',
      'Value for money',
      'Overall satisfaction'
    ],
    questionTypes: ['RATING_SCALE', 'NPS', 'MULTIPLE_CHOICE', 'YES_NO', 'LONG_TEXT'],
    typicalQuestions: [
      'How would you rate your overall stay?',
      'Was the check-in process smooth and efficient?',
      'How satisfied were you with your room?',
      'Did our amenities meet your expectations?',
      'How likely are you to recommend our hotel?',
      'What could we do to improve your experience?'
    ],
    attributes: [
      { age: 32, gender: 'Male', occupation: 'Business Consultant', experience: 'Business traveler', techSavviness: 'high', educationLevel: 'MBA', location: 'Urban' },
      { age: 45, gender: 'Female', occupation: 'Marketing Director', experience: 'Frequent business traveler', techSavviness: 'high', educationLevel: 'Master\'s', location: 'Urban' },
      { age: 38, gender: 'Male', occupation: 'Software Engineer', experience: 'Leisure traveler', techSavviness: 'high', educationLevel: 'Bachelor\'s', location: 'Suburban' },
      { age: 58, gender: 'Female', occupation: 'Retired', experience: 'Vacation traveler', techSavviness: 'low', educationLevel: 'Bachelor\'s', location: 'Rural' },
      { age: 29, gender: 'Female', occupation: 'Event Planner', experience: 'Occasional traveler', techSavviness: 'medium', educationLevel: 'Bachelor\'s', location: 'Urban' }
    ],
    responsePatterns: {
      completionRate: 88,
      averageTime: 210,
      dropoffPoints: [9, 13]
    }
  },
  {
    id: 'saas-product-feedback',
    industry: 'Technology',
    name: 'SaaS Product Feedback Survey',
    description: 'Software product user satisfaction and feature requests',
    targetAudience: 'Active users aged 22-50 using the product for at least 30 days',
    surveyTopics: [
      'Ease of use',
      'Feature satisfaction',
      'Performance and reliability',
      'Support quality',
      'Value for price',
      'Feature requests',
      'Overall satisfaction'
    ],
    questionTypes: ['RATING_SCALE', 'NPS', 'CHECKBOXES', 'LONG_TEXT', 'MATRIX'],
    typicalQuestions: [
      'How easy is our product to use?',
      'Which features do you use most frequently?',
      'How satisfied are you with product performance?',
      'How responsive is our support team?',
      'How likely are you to recommend our product?',
      'What features would you like to see added?'
    ],
    attributes: [
      { age: 26, gender: 'Male', occupation: 'Junior Developer', experience: 'New user (1-3 months)', techSavviness: 'high', educationLevel: 'Bachelor\'s', location: 'Urban' },
      { age: 34, gender: 'Female', occupation: 'Product Manager', experience: 'Regular user (6-12 months)', techSavviness: 'high', educationLevel: 'MBA', location: 'Urban' },
      { age: 42, gender: 'Male', occupation: 'Senior Engineer', experience: 'Power user (1+ years)', techSavviness: 'high', educationLevel: 'Master\'s', location: 'Suburban' },
      { age: 29, gender: 'Non-binary', occupation: 'UX Designer', experience: 'Regular user (3-6 months)', techSavviness: 'high', educationLevel: 'Bachelor\'s', location: 'Urban' },
      { age: 38, gender: 'Female', occupation: 'IT Manager', experience: 'Regular user (6-12 months)', techSavviness: 'medium', educationLevel: 'Bachelor\'s', location: 'Suburban' }
    ],
    responsePatterns: {
      completionRate: 82,
      averageTime: 270,
      dropoffPoints: [12]
    }
  },
  {
    id: 'hr-employee-engagement',
    industry: 'Human Resources',
    name: 'Employee Engagement Survey',
    description: 'Workplace satisfaction and employee engagement assessment',
    targetAudience: 'Employees aged 22-65 across all departments',
    surveyTopics: [
      'Job satisfaction',
      'Management effectiveness',
      'Work-life balance',
      'Career development',
      'Company culture',
      'Compensation and benefits',
      'Overall engagement'
    ],
    questionTypes: ['LIKERT_SCALE', 'RATING_SCALE', 'MULTIPLE_CHOICE', 'LONG_TEXT', 'YES_NO'],
    typicalQuestions: [
      'I feel valued and appreciated at work',
      'My manager provides clear direction and support',
      'I have opportunities for professional growth',
      'The company culture aligns with my values',
      'I would recommend this company as a great place to work',
      'What would improve your work experience?'
    ],
    attributes: [
      { age: 25, gender: 'Female', occupation: 'Junior Analyst', experience: '< 1 year tenure', techSavviness: 'high', educationLevel: 'Bachelor\'s', location: 'Urban' },
      { age: 35, gender: 'Male', occupation: 'Senior Developer', experience: '3-5 years tenure', techSavviness: 'high', educationLevel: 'Master\'s', location: 'Suburban' },
      { age: 48, gender: 'Female', occupation: 'Director', experience: '10+ years tenure', techSavviness: 'medium', educationLevel: 'MBA', location: 'Urban' },
      { age: 31, gender: 'Male', occupation: 'Marketing Specialist', experience: '2-3 years tenure', techSavviness: 'high', educationLevel: 'Bachelor\'s', location: 'Urban' },
      { age: 42, gender: 'Female', occupation: 'Operations Manager', experience: '5-10 years tenure', techSavviness: 'medium', educationLevel: 'Bachelor\'s', location: 'Suburban' }
    ],
    responsePatterns: {
      completionRate: 75,
      averageTime: 360,
      dropoffPoints: [18, 22]
    }
  },
  {
    id: 'restaurant-dining-experience',
    industry: 'Food & Beverage',
    name: 'Restaurant Dining Experience Survey',
    description: 'Customer satisfaction with food, service, and ambiance',
    targetAudience: 'Diners aged 18-70 who visited in the last 14 days',
    surveyTopics: [
      'Food quality',
      'Service speed',
      'Staff friendliness',
      'Cleanliness',
      'Ambiance',
      'Value for money',
      'Overall experience'
    ],
    questionTypes: ['RATING_SCALE', 'NPS', 'MULTIPLE_CHOICE', 'YES_NO', 'SHORT_TEXT'],
    typicalQuestions: [
      'How would you rate the quality of your meal?',
      'How satisfied were you with the service?',
      'Was your order accurate?',
      'How would you rate the restaurant atmosphere?',
      'How likely are you to return?',
      'What dish did you enjoy most?'
    ],
    attributes: [
      { age: 24, gender: 'Female', occupation: 'Social Media Manager', experience: 'First-time visitor', techSavviness: 'high', educationLevel: 'Bachelor\'s', location: 'Urban' },
      { age: 40, gender: 'Male', occupation: 'Business Owner', experience: 'Regular customer', techSavviness: 'medium', educationLevel: 'MBA', location: 'Suburban' },
      { age: 33, gender: 'Female', occupation: 'Nurse', experience: 'Occasional visitor', techSavviness: 'medium', educationLevel: 'Bachelor\'s', location: 'Suburban' },
      { age: 55, gender: 'Male', occupation: 'Attorney', experience: 'Frequent customer', techSavviness: 'low', educationLevel: 'JD', location: 'Urban' },
      { age: 28, gender: 'Non-binary', occupation: 'Artist', experience: 'Occasional visitor', techSavviness: 'high', educationLevel: 'Bachelor\'s', location: 'Urban' }
    ],
    responsePatterns: {
      completionRate: 90,
      averageTime: 150,
      dropoffPoints: [7]
    }
  },
  {
    id: 'ecommerce-shopping-experience',
    industry: 'E-commerce',
    name: 'Online Shopping Experience Survey',
    description: 'Customer satisfaction with online purchase and delivery',
    targetAudience: 'Online shoppers aged 18-60 who completed a purchase',
    surveyTopics: [
      'Website usability',
      'Product discovery',
      'Checkout process',
      'Delivery experience',
      'Product quality',
      'Customer support',
      'Overall satisfaction'
    ],
    questionTypes: ['RATING_SCALE', 'NPS', 'MULTIPLE_CHOICE', 'CHECKBOXES', 'LONG_TEXT'],
    typicalQuestions: [
      'How easy was it to find what you were looking for?',
      'How satisfied are you with the checkout process?',
      'Did your order arrive on time?',
      'How does the product match your expectations?',
      'How likely are you to shop with us again?',
      'What could improve your shopping experience?'
    ],
    attributes: [
      { age: 27, gender: 'Female', occupation: 'Graphic Designer', experience: 'Frequent shopper', techSavviness: 'high', educationLevel: 'Bachelor\'s', location: 'Urban' },
      { age: 35, gender: 'Male', occupation: 'Data Analyst', experience: 'Regular shopper', techSavviness: 'high', educationLevel: 'Master\'s', location: 'Suburban' },
      { age: 50, gender: 'Female', occupation: 'Teacher', experience: 'Occasional shopper', techSavviness: 'medium', educationLevel: 'Master\'s', location: 'Suburban' },
      { age: 22, gender: 'Male', occupation: 'Student', experience: 'First-time buyer', techSavviness: 'high', educationLevel: 'Some College', location: 'Urban' },
      { age: 43, gender: 'Female', occupation: 'Small Business Owner', experience: 'Regular shopper', techSavviness: 'medium', educationLevel: 'Bachelor\'s', location: 'Rural' }
    ],
    responsePatterns: {
      completionRate: 86,
      averageTime: 195,
      dropoffPoints: [11]
    }
  },
  {
    id: 'fitness-member-satisfaction',
    industry: 'Fitness & Wellness',
    name: 'Gym Member Satisfaction Survey',
    description: 'Fitness center member experience and facility feedback',
    targetAudience: 'Gym members aged 18-65 with active memberships',
    surveyTopics: [
      'Equipment availability',
      'Facility cleanliness',
      'Staff knowledge',
      'Class variety',
      'Operating hours',
      'Value for membership',
      'Overall satisfaction'
    ],
    questionTypes: ['RATING_SCALE', 'NPS', 'MULTIPLE_CHOICE', 'CHECKBOXES', 'SHORT_TEXT'],
    typicalQuestions: [
      'How satisfied are you with the equipment variety?',
      'Are the facilities clean and well-maintained?',
      'How helpful and knowledgeable is the staff?',
      'Which classes do you attend most often?',
      'How likely are you to renew your membership?',
      'What new equipment or classes would you like?'
    ],
    attributes: [
      { age: 26, gender: 'Male', occupation: 'Personal Trainer', experience: 'Long-term member', techSavviness: 'high', educationLevel: 'Bachelor\'s', location: 'Urban' },
      { age: 34, gender: 'Female', occupation: 'Yoga Instructor', experience: 'Regular member', techSavviness: 'medium', educationLevel: 'Certification', location: 'Suburban' },
      { age: 45, gender: 'Male', occupation: 'Executive', experience: 'Regular member', techSavviness: 'medium', educationLevel: 'MBA', location: 'Urban' },
      { age: 29, gender: 'Female', occupation: 'Nurse', experience: 'New member', techSavviness: 'medium', educationLevel: 'Associate', location: 'Suburban' },
      { age: 52, gender: 'Male', occupation: 'Engineer', experience: 'Long-term member', techSavviness: 'high', educationLevel: 'Master\'s', location: 'Suburban' }
    ],
    responsePatterns: {
      completionRate: 84,
      averageTime: 225,
      dropoffPoints: [10]
    }
  },
  {
    id: 'financial-services-satisfaction',
    industry: 'Financial Services',
    name: 'Banking Customer Satisfaction Survey',
    description: 'Bank customer experience and service quality assessment',
    targetAudience: 'Bank customers aged 22-70 with active accounts',
    surveyTopics: [
      'Account management',
      'Digital banking experience',
      'Branch service quality',
      'Fee transparency',
      'Problem resolution',
      'Trust and security',
      'Overall satisfaction'
    ],
    questionTypes: ['RATING_SCALE', 'NPS', 'MULTIPLE_CHOICE', 'YES_NO', 'LONG_TEXT'],
    typicalQuestions: [
      'How satisfied are you with our online banking platform?',
      'How easy is it to manage your account?',
      'Have you visited a branch in the last 6 months?',
      'How would you rate our customer service?',
      'How likely are you to recommend our bank?',
      'What banking features are most important to you?'
    ],
    attributes: [
      { age: 28, gender: 'Male', occupation: 'Software Developer', experience: 'Digital-only customer', techSavviness: 'high', educationLevel: 'Bachelor\'s', location: 'Urban' },
      { age: 45, gender: 'Female', occupation: 'Business Owner', experience: 'Long-term customer', techSavviness: 'medium', educationLevel: 'MBA', location: 'Suburban' },
      { age: 62, gender: 'Male', occupation: 'Retired', experience: 'Long-term customer', techSavviness: 'low', educationLevel: 'Bachelor\'s', location: 'Rural' },
      { age: 36, gender: 'Female', occupation: 'Doctor', experience: 'Regular customer', techSavviness: 'medium', educationLevel: 'MD', location: 'Urban' },
      { age: 31, gender: 'Male', occupation: 'Sales Manager', experience: 'New customer', techSavviness: 'high', educationLevel: 'Bachelor\'s', location: 'Suburban' }
    ],
    responsePatterns: {
      completionRate: 81,
      averageTime: 285,
      dropoffPoints: [14]
    }
  }
];

/**
 * Generate 20 realistic user scenarios for a given persona
 */
export function generateUserScenarios(persona: IndustryPersona): PersonaAttribute[] {
  const scenarios: PersonaAttribute[] = [];

  // Use the predefined attributes as a base
  const baseAttributes = [...persona.attributes];

  // Generate 20 scenarios by creating variations
  for (let i = 0; i < 20; i++) {
    const baseIndex = i % baseAttributes.length;
    const base = baseAttributes[baseIndex];

    // Create variation
    const ageVariation = Math.floor(Math.random() * 10) - 5; // +/- 5 years
    const scenario: PersonaAttribute = {
      ...base,
      age: Math.max(18, Math.min(75, base.age + ageVariation))
    };

    scenarios.push(scenario);
  }

  return scenarios;
}

export function getPersonaById(id: string): IndustryPersona | undefined {
  return INDUSTRY_PERSONAS.find(p => p.id === id);
}

export function getAllPersonas(): IndustryPersona[] {
  return INDUSTRY_PERSONAS;
}

export function getPersonasByIndustry(industry: string): IndustryPersona[] {
  return INDUSTRY_PERSONAS.filter(p =>
    p.industry.toLowerCase() === industry.toLowerCase()
  );
}
