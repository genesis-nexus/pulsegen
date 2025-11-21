# PulseGen Automation Tool

A comprehensive automation tool for the PulseGen survey platform that enables automated survey configuration, creation, and response simulation across multiple industry personas.

## Features

- **Industry-Based Personas**: 10 pre-configured industry personas covering Healthcare, Retail, Education, Hospitality, Technology, HR, Food & Beverage, E-commerce, Fitness, and Financial Services
- **Automated Survey Creation**: Automatically generates comprehensive surveys tailored to each industry
- **Response Simulation**: Generates 20 realistic user scenarios and simulates survey responses
- **Analytics Dashboard**: View detailed analytics and insights for generated surveys
- **Separate UI**: Standalone web interface independent of the main PulseGen application

## Industry Personas

### 1. Healthcare - Patient Satisfaction Survey
- **Target Audience**: Patients aged 25-75
- **Topics**: Wait time, staff professionalism, facility cleanliness, treatment effectiveness
- **Completion Rate**: 85%

### 2. Retail - Customer Experience Survey
- **Target Audience**: Shoppers aged 18-65
- **Topics**: Product availability, store layout, checkout experience, staff helpfulness
- **Completion Rate**: 92%

### 3. Education - Course Evaluation Survey
- **Target Audience**: Students aged 18-30
- **Topics**: Course content, instructor effectiveness, learning materials, assessments
- **Completion Rate**: 78%

### 4. Hospitality - Hotel Guest Experience Survey
- **Target Audience**: Hotel guests aged 25-65
- **Topics**: Booking experience, check-in/out, room cleanliness, amenities, staff service
- **Completion Rate**: 88%

### 5. Technology - SaaS Product Feedback Survey
- **Target Audience**: Active users aged 22-50
- **Topics**: Ease of use, features, performance, support quality, value for price
- **Completion Rate**: 82%

### 6. Human Resources - Employee Engagement Survey
- **Target Audience**: Employees aged 22-65
- **Topics**: Job satisfaction, management, work-life balance, career development
- **Completion Rate**: 75%

### 7. Food & Beverage - Restaurant Dining Experience Survey
- **Target Audience**: Diners aged 18-70
- **Topics**: Food quality, service speed, staff friendliness, cleanliness, ambiance
- **Completion Rate**: 90%

### 8. E-commerce - Online Shopping Experience Survey
- **Target Audience**: Online shoppers aged 18-60
- **Topics**: Website usability, product discovery, checkout, delivery, product quality
- **Completion Rate**: 86%

### 9. Fitness & Wellness - Gym Member Satisfaction Survey
- **Target Audience**: Gym members aged 18-65
- **Topics**: Equipment availability, facility cleanliness, staff knowledge, class variety
- **Completion Rate**: 84%

### 10. Financial Services - Banking Customer Satisfaction Survey
- **Target Audience**: Bank customers aged 22-70
- **Topics**: Account management, digital banking, branch service, fee transparency
- **Completion Rate**: 81%

## Installation

### Prerequisites
- Node.js 18+ and npm
- PulseGen backend running and accessible
- Valid PulseGen user account

### Setup

1. **Navigate to the automation-tool directory**:
   ```bash
   cd automation-tool
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:
   ```
   VITE_API_URL=http://localhost:5000
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3001`

5. **Build for production**:
   ```bash
   npm run build
   ```

## Usage

### 1. Login
- Navigate to `http://localhost:3001/login`
- Use your PulseGen credentials to sign in

### 2. Select a Persona
- Browse the available industry personas on the dashboard
- Review persona details including target audience, topics, and response patterns
- Click "Run Automation" on the desired persona

### 3. Configure Automation
- **Survey Title**: Optionally customize the survey title (defaults to persona name)
- **Number of Scenarios**: Choose how many user scenarios to generate (1-100, default: 20)
- **Use AI**: Enable AI-powered survey generation (optional)
- **Include Skip Logic**: Add conditional logic to surveys (optional)

### 4. Run Automation
- Click "Run Automation" to start the process
- The tool will:
  1. Create a survey tailored to the persona
  2. Generate realistic user scenarios
  3. Simulate survey responses
  4. Calculate analytics

### 5. View Results
- After automation completes, view the summary:
  - Survey URL and details
  - Response statistics
  - Completion metrics
- Click "View Analytics" to see detailed insights
- Export data as JSON for further analysis

## API Endpoints

The automation tool uses the following backend API endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Automation
- `GET /api/automation/personas` - Get all personas
- `GET /api/automation/personas/:id` - Get specific persona
- `POST /api/automation/run` - Run automation workflow
- `GET /api/automation/status/:surveyId` - Get automation status

### Surveys & Analytics
- `GET /api/surveys` - List all surveys
- `GET /api/surveys/:id` - Get survey details
- `GET /api/analytics/surveys/:surveyId` - Get survey analytics

## Architecture

### Frontend (React + TypeScript)
```
automation-tool/
├── src/
│   ├── pages/           # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── AutomationPage.tsx
│   │   └── ResultsPage.tsx
│   ├── stores/          # Zustand state management
│   │   └── authStore.ts
│   ├── lib/             # API client
│   │   └── api.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   └── App.tsx          # Main app component
```

### Backend (Node.js + Express)
```
backend/src/
├── data/
│   └── personas.ts      # Industry persona definitions
├── services/
│   └── automationService.ts  # Automation logic
└── routes/
    └── automationRoutes.ts   # API routes
```

## How It Works

### 1. Persona Selection
Each persona contains:
- Industry-specific survey topics
- Question types appropriate for the domain
- Typical questions for the industry
- User attribute profiles (age, occupation, tech savviness, etc.)
- Expected response patterns (completion rate, average time)

### 2. Survey Generation
The automation service:
- Creates a survey with the persona's typical questions
- Selects appropriate question types (rating scales, NPS, multiple choice, etc.)
- Generates relevant options for choice-based questions
- Applies industry-specific settings and validations

### 3. Scenario Generation
For each automation run, the tool:
- Generates 20 (or configured amount) unique user scenarios
- Varies user attributes (age, experience, tech savviness)
- Creates realistic demographic profiles

### 4. Response Simulation
For each scenario, the tool:
- Determines completion likelihood based on persona patterns
- Generates realistic answers based on:
  - Question type
  - User attributes
  - Industry context
- Simulates completion times
- Includes realistic variance and edge cases

### 5. Analytics Calculation
After response generation:
- Calculates completion rates
- Computes average response times
- Generates question-level statistics
- Creates distribution charts
- Provides exportable data

## Configuration Options

### AutomationConfig
```typescript
interface AutomationConfig {
  personaId: string;        // Required: ID of the persona to use
  surveyTitle?: string;     // Optional: Custom survey title
  questionCount?: number;   // Optional: Number of questions (1-50)
  useAI?: boolean;         // Optional: Use AI for generation
  includeLogic?: boolean;  // Optional: Add skip logic
  scenarioCount?: number;  // Optional: Number of scenarios (1-100, default: 20)
}
```

## Response Data Structure

### AutomationResult
```typescript
interface AutomationResult {
  survey: {
    surveyId: string;
    slug: string;
    title: string;
    questionCount: number;
    url: string;
  };
  responses: Array<{
    responseId: string;
    scenario: PersonaAttribute;
    completionTime: number;
    completed: boolean;
  }>;
  analytics: any;
  summary: {
    totalResponses: number;
    completedResponses: number;
    averageCompletionTime: number;
    completionRate: number;
  };
}
```

## Development

### Adding New Personas

1. Open `backend/src/data/personas.ts`
2. Add a new persona to the `INDUSTRY_PERSONAS` array:

```typescript
{
  id: 'your-persona-id',
  industry: 'Your Industry',
  name: 'Your Persona Name',
  description: 'Description',
  targetAudience: 'Target audience description',
  surveyTopics: ['Topic 1', 'Topic 2', ...],
  questionTypes: ['RATING_SCALE', 'NPS', ...],
  typicalQuestions: ['Question 1?', 'Question 2?', ...],
  attributes: [
    // 5+ persona attribute variations
  ],
  responsePatterns: {
    completionRate: 85,
    averageTime: 240,
    dropoffPoints: [8, 12]
  }
}
```

### Customizing Response Generation

Modify `backend/src/services/automationService.ts`:
- `generateAnswer()`: Customize answer generation logic
- `generateShortText()`: Add industry-specific short text responses
- `generateLongText()`: Add industry-specific long text responses

## Troubleshooting

### Common Issues

**Authentication fails**
- Ensure the backend is running
- Verify VITE_API_URL is correct in `.env`
- Check that you're using valid PulseGen credentials

**Automation fails to create survey**
- Verify user has permission to create surveys
- Check backend logs for errors
- Ensure database is accessible

**Responses not generating**
- Check that survey was created successfully
- Verify the survey is in ACTIVE status
- Review backend logs for response submission errors

**Analytics not showing**
- Ensure responses were submitted successfully
- Check that analytics calculation completed
- Verify database analytics table is accessible

## Technologies Used

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Zustand (state management)
- Axios (HTTP client)
- Recharts (data visualization)
- Tailwind CSS (styling)
- Lucide React (icons)

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod (validation)

## License

Same as PulseGen main application.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs
3. Verify configuration settings
4. Ensure all dependencies are installed

## Future Enhancements

Potential improvements:
- Custom persona creation via UI
- AI-powered persona generation
- Response pattern learning from real data
- Bulk automation for multiple personas
- Advanced analytics with ML insights
- Export to various formats (CSV, Excel, PDF)
- Scheduled automation runs
- Integration with CI/CD pipelines
