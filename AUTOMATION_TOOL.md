# PulseGen Automation Tool

## Overview

The PulseGen Automation Tool is a comprehensive solution for automatically configuring the PulseGen survey platform, creating industry-specific surveys, and generating realistic sample responses for testing and analytics.

## Quick Start

### 1. Start the Backend (if not already running)

```bash
cd backend
npm install
npm run dev
```

The backend should be running on `http://localhost:5000`

### 2. Start the Automation Tool UI

```bash
cd automation-tool
npm install
npm run dev
```

The automation tool UI will be available at `http://localhost:3001`

### 3. Login

Use your existing PulseGen credentials or create a new account:
- Navigate to `http://localhost:3001/login`
- Enter your email and password

### 4. Select a Persona and Run Automation

1. Browse the 10 available industry personas
2. Click "Run Automation" on your chosen persona
3. Configure options (optional):
   - Custom survey title
   - Number of scenarios (1-100, default: 20)
   - Enable AI generation
   - Include skip logic
4. Click "Run Automation"
5. Wait for the process to complete (~20-30 seconds)
6. View results and analytics

## What Does It Do?

The automation tool performs the following tasks automatically:

### 1. Survey Creation
- Creates a comprehensive survey tailored to the selected industry
- Generates 6-8 industry-specific questions
- Configures appropriate question types (NPS, rating scales, multiple choice, text fields)
- Sets up realistic options for choice-based questions

### 2. User Scenario Generation
- Generates 20 (or configured amount) unique user profiles
- Each scenario includes:
  - Age, gender, occupation
  - Experience level
  - Tech savviness (low/medium/high)
  - Education level
  - Geographic location

### 3. Response Simulation
- Simulates realistic survey responses for each scenario
- Answers vary based on user attributes
- Includes realistic completion rates and drop-off patterns
- Generates completion times matching persona patterns

### 4. Analytics Generation
- Calculates comprehensive survey analytics
- Provides response distributions
- Generates completion metrics
- Creates visualization-ready data

## Industry Personas

The tool includes 10 pre-configured personas:

1. **Healthcare** - Patient Satisfaction Survey (85% completion)
2. **Retail** - Customer Experience Survey (92% completion)
3. **Education** - Course Evaluation Survey (78% completion)
4. **Hospitality** - Hotel Guest Experience Survey (88% completion)
5. **Technology** - SaaS Product Feedback Survey (82% completion)
6. **Human Resources** - Employee Engagement Survey (75% completion)
7. **Food & Beverage** - Restaurant Dining Experience Survey (90% completion)
8. **E-commerce** - Online Shopping Experience Survey (86% completion)
9. **Fitness & Wellness** - Gym Member Satisfaction Survey (84% completion)
10. **Financial Services** - Banking Customer Satisfaction Survey (81% completion)

## Use Cases

### For Developers
- **Testing**: Generate realistic test data for development
- **Debugging**: Create reproducible survey scenarios
- **Performance**: Load test with multiple responses
- **Integration**: Validate analytics and reporting features

### For Product Managers
- **Demos**: Quickly create populated surveys for demonstrations
- **Prototyping**: Test survey designs with realistic data
- **Validation**: Verify survey logic and flow
- **Analytics**: Preview how results will look

### For QA Teams
- **End-to-End Testing**: Automated survey creation and response workflow
- **Data Validation**: Verify analytics calculations
- **Edge Cases**: Test various completion scenarios
- **Regression**: Consistent test data generation

### For Sales & Marketing
- **Demonstrations**: Show the platform with realistic data
- **Training**: Create training environments quickly
- **Proposals**: Generate industry-specific examples
- **Onboarding**: Help new clients understand the platform

## Architecture

```
┌─────────────────────────────────────────────────────┐
│           Automation Tool UI (Port 3001)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │Dashboard │  │Automation│  │Results/Analytics │  │
│  │  Page    │──│   Page   │──│      Page        │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────┐
│        PulseGen Backend (Port 5000)                 │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ Automation   │  │   Survey    │  │ Response   │ │
│  │   Service    │──│   Service   │──│  Service   │ │
│  └──────────────┘  └─────────────┘  └────────────┘ │
│         │                                           │
│  ┌──────▼────────────────────────────────────────┐ │
│  │         Persona Definitions                    │ │
│  │  (10 Industry Personas with Attributes)       │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              PostgreSQL Database                    │
│    Surveys │ Questions │ Responses │ Analytics      │
└─────────────────────────────────────────────────────┘
```

## API Endpoints

### Automation Endpoints

```
GET  /api/automation/personas          - List all personas
GET  /api/automation/personas/:id      - Get persona details
POST /api/automation/run               - Run automation
GET  /api/automation/status/:surveyId  - Get automation status
```

### Request Example

```bash
curl -X POST http://localhost:5000/api/automation/run \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "personaId": "healthcare-patient-satisfaction",
    "scenarioCount": 20,
    "useAI": false,
    "includeLogic": false
  }'
```

### Response Example

```json
{
  "success": true,
  "result": {
    "survey": {
      "surveyId": "clx...",
      "slug": "patient-satisfaction-automated-abc123",
      "title": "Patient Satisfaction Survey - Automated",
      "questionCount": 6,
      "url": "http://localhost:3000/s/patient-satisfaction-automated-abc123"
    },
    "responses": [
      {
        "responseId": "cly...",
        "scenario": {
          "age": 28,
          "gender": "Female",
          "occupation": "Teacher",
          "experience": "First-time patient",
          "techSavviness": "medium",
          "educationLevel": "Bachelor's",
          "location": "Urban"
        },
        "completionTime": 245,
        "completed": true
      }
      // ... 19 more responses
    ],
    "analytics": { /* analytics object */ },
    "summary": {
      "totalResponses": 20,
      "completedResponses": 17,
      "averageCompletionTime": 238,
      "completionRate": 85.0
    }
  }
}
```

## File Structure

```
pulsegen/
├── automation-tool/              # Separate UI application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── AutomationPage.tsx
│   │   │   └── ResultsPage.tsx
│   │   ├── stores/
│   │   │   └── authStore.ts
│   │   ├── lib/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── README.md
│
├── backend/src/
│   ├── data/
│   │   └── personas.ts           # 10 industry persona definitions
│   ├── services/
│   │   └── automationService.ts  # Automation logic
│   └── routes/
│       ├── automationRoutes.ts   # API routes
│       └── index.ts              # Updated with automation routes
│
└── AUTOMATION_TOOL.md            # This file
```

## Features in Detail

### Intelligent Response Generation

The tool generates realistic responses by considering:

- **User Demographics**: Age, occupation, education level
- **Experience Level**: First-time vs. regular vs. power users
- **Tech Savviness**: Affects completion time and answer quality
- **Question Type**: Different logic for NPS, ratings, text, etc.
- **Industry Context**: Healthcare responses differ from retail responses

### Realistic Completion Patterns

Each persona has realistic patterns:
- **Completion Rate**: Varies by industry (75-92%)
- **Average Time**: Realistic for question count
- **Drop-off Points**: Some users abandon at specific questions
- **Variance**: Not all responses are identical

### Question Type Support

The tool handles all PulseGen question types:
- Rating Scales (1-5, 1-10)
- NPS (Net Promoter Score)
- Multiple Choice
- Checkboxes
- Yes/No
- Short Text
- Long Text
- Email
- Number
- Slider
- Likert Scale
- Dropdown

## Advanced Usage

### Programmatic Access

You can use the automation API programmatically:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Run automation
const result = await api.post('/automation/run', {
  personaId: 'retail-customer-experience',
  scenarioCount: 50,
  useAI: true,
  includeLogic: true
});

console.log('Survey created:', result.data.result.survey.url);
console.log('Responses:', result.data.result.summary.totalResponses);
```

### Batch Automation

Run automation for multiple personas:

```bash
#!/bin/bash
TOKEN="your_access_token"

for persona in healthcare-patient-satisfaction retail-customer-experience education-course-feedback; do
  echo "Running automation for $persona..."
  curl -X POST http://localhost:5000/api/automation/run \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"personaId\": \"$persona\", \"scenarioCount\": 20}"
done
```

### Custom Persona Creation

To add a new persona, edit `backend/src/data/personas.ts`:

```typescript
{
  id: 'automotive-dealership-satisfaction',
  industry: 'Automotive',
  name: 'Dealership Customer Satisfaction',
  description: 'Car dealership customer experience survey',
  targetAudience: 'Recent car buyers aged 25-65',
  surveyTopics: [
    'Sales experience',
    'Vehicle selection',
    'Financing process',
    'Delivery experience',
    'After-sales service'
  ],
  questionTypes: ['RATING_SCALE', 'NPS', 'MULTIPLE_CHOICE', 'LONG_TEXT'],
  typicalQuestions: [
    'How satisfied were you with your sales representative?',
    'Was the vehicle selection process helpful?',
    'How would you rate the financing options?',
    'How likely are you to recommend our dealership?',
    'What could we improve about your experience?'
  ],
  attributes: [
    // Define 5+ user attribute variations
  ],
  responsePatterns: {
    completionRate: 88,
    averageTime: 210,
    dropoffPoints: [9]
  }
}
```

## Performance

### Automation Speed
- Survey creation: ~1-2 seconds
- 20 responses: ~5-10 seconds
- Analytics calculation: ~1-2 seconds
- **Total time**: ~10-20 seconds

### Scalability
- Can generate up to 100 scenarios per run
- Supports multiple concurrent automations
- Response submission is rate-limited for realism

## Security Considerations

- Requires valid authentication token
- User must have survey creation permissions
- API endpoints are protected with authentication middleware
- Automation runs are tied to the authenticated user
- All surveys follow standard access control rules

## Troubleshooting

### Issue: "Persona not found"
**Solution**: Check that the personaId is correct. List all personas with:
```bash
curl -X GET http://localhost:5000/api/automation/personas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: "Automation failed"
**Solution**:
1. Check backend logs for errors
2. Verify database connectivity
3. Ensure user has create survey permissions
4. Check that all required services are running

### Issue: "No responses generated"
**Solution**:
1. Verify survey was created successfully
2. Check survey status is ACTIVE
3. Review backend response service logs
4. Ensure database can accept responses

### Issue: UI not connecting to backend
**Solution**:
1. Verify backend is running on port 5000
2. Check `.env` file in automation-tool has correct VITE_API_URL
3. Check for CORS errors in browser console
4. Restart both frontend and backend

## Maintenance

### Updating Personas
1. Edit `backend/src/data/personas.ts`
2. Modify persona properties
3. Restart backend
4. Changes take effect immediately

### Modifying Response Logic
1. Edit `backend/src/services/automationService.ts`
2. Update `generateAnswer()` or related methods
3. Restart backend
4. Test with a small scenario count first

### Adding New Question Types
1. Add type to persona `questionTypes` array
2. Update `selectQuestionType()` logic
3. Add answer generation logic in `generateAnswer()`
4. Test thoroughly

## Best Practices

1. **Start Small**: Begin with 5-10 scenarios for testing
2. **Review Personas**: Understand the persona before running automation
3. **Check Results**: Always review the generated survey before sharing
4. **Export Data**: Export results for backup and analysis
5. **Clean Up**: Delete test surveys periodically
6. **Monitor Performance**: Watch backend logs during automation
7. **Customize Wisely**: Test custom configurations before large runs

## Roadmap

Future enhancements planned:
- [ ] Visual persona builder in UI
- [ ] AI-powered persona generation
- [ ] Custom response pattern templates
- [ ] Multi-language support
- [ ] Advanced analytics with ML
- [ ] Scheduled automation runs
- [ ] Webhook integration
- [ ] Export to multiple formats (CSV, Excel, PDF)
- [ ] Collaborative automation workflows
- [ ] A/B testing scenarios

## Contributing

To contribute to the automation tool:
1. Review the codebase structure
2. Follow TypeScript best practices
3. Add tests for new features
4. Update documentation
5. Submit pull request with clear description

## Support

For issues or questions:
- Check this documentation
- Review the automation-tool/README.md
- Check backend logs
- Verify configuration
- Review troubleshooting section

## License

Same as PulseGen main application.
