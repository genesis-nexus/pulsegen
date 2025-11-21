# PulseGen

A self-hosted survey platform with AI-powered analytics. Create surveys, collect responses, and get intelligent insights—all on your own infrastructure.

## Why PulseGen?

- **Self-Hosted**: Full control of your data
- **AI-Powered**: Bring your own AI (OpenAI, Anthropic, Google) for smart analysis
- **No Vendor Lock-in**: Export everything, run anywhere
- **Automation Ready**: Built-in automation tool for testing and demos
- **Modern Stack**: React, TypeScript, PostgreSQL, Prisma

## Quick Start

### Option 1: Fastest Setup (Bash Script)

```bash
git clone <your-repo-url>
cd pulsegen
./scripts/quick-setup.sh

# Create database
createdb pulsegen

# Initialize database
cd backend
npx prisma migrate dev --name init
npm run prisma:seed

# Start development
npm run dev  # Terminal 1: Backend
cd ../frontend && npm run dev  # Terminal 2: Frontend
```

**Access:** http://localhost:3000
**Login:** admin@example.com / admin123

### Option 2: Interactive Setup (Guided)

```bash
npm run setup
```

Choose Docker or local, configure options interactively, and let the script handle everything.

### Option 3: Docker (Production-like)

```bash
# Without Redis (faster startup)
docker-compose up -d

# With Redis (better performance)
docker-compose --profile with-redis up -d
```

**See [SETUP.md](SETUP.md) for detailed setup options.**

---

## Using PulseGen

### 1. Create Your First Survey

**Via UI:**
1. Login → Click "New Survey"
2. Add questions using the builder
3. Configure settings (anonymous, limit responses, etc.)
4. Click "Publish"
5. Share the link: `http://localhost:3000/s/your-survey-slug`

**Via API:**
```bash
# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Create survey
curl -X POST http://localhost:5000/api/surveys \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Customer Satisfaction Survey",
    "description": "Tell us how we did",
    "status": "ACTIVE",
    "isAnonymous": true
  }'
```

### 2. Add Questions

**Question Types Available:**
- `MULTIPLE_CHOICE` - Radio buttons
- `CHECKBOXES` - Multi-select
- `RATING_SCALE` - 1-5 stars
- `NPS` - Net Promoter Score (0-10)
- `LONG_TEXT` - Open-ended feedback
- `SHORT_TEXT` - Brief answers
- `EMAIL` - Email validation
- `YES_NO` - Boolean choice
- Plus: Date, Number, Slider, Matrix, Ranking, File Upload

**Example: Add NPS Question**
```bash
curl -X POST http://localhost:5000/api/surveys/SURVEY_ID/questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "NPS",
    "text": "How likely are you to recommend us?",
    "isRequired": true,
    "order": 0,
    "settings": {
      "minValue": 0,
      "maxValue": 10,
      "minLabel": "Not likely",
      "maxLabel": "Very likely"
    }
  }'
```

### 3. Collect Responses

**Public Survey (No Auth Required):**
```bash
curl -X POST http://localhost:5000/api/responses/surveys/SURVEY_ID/submit \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "questionId": "QUESTION_ID",
        "numberValue": 9
      }
    ]
  }'
```

**Share Options:**
- Direct Link: `/s/survey-slug`
- QR Code: Generated automatically
- Email: Configure SMTP in settings
- Embed: Use iframe code

### 4. View Analytics

**Via UI:**
- Dashboard → Select Survey → Analytics Tab
- Real-time charts, response counts, completion rates
- Download CSV/Excel/PDF exports

**Via API:**
```bash
curl http://localhost:5000/api/analytics/surveys/SURVEY_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "totalResponses": 156,
  "completionRate": 87.5,
  "averageDuration": 180,
  "questionStats": [
    {
      "questionId": "...",
      "type": "NPS",
      "averageValue": 8.3,
      "distribution": {...}
    }
  ]
}
```

### 5. AI-Powered Insights

**Setup AI Provider:**
1. Settings → AI Providers → Add Provider
2. Choose: OpenAI, Anthropic, or Google
3. Enter your API key
4. Set as default (optional)

**Generate Insights:**
```bash
curl -X POST http://localhost:5000/api/ai/surveys/SURVEY_ID/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "anthropic",
    "includeRecommendations": true
  }'
```

**AI Features:**
- **Survey Generation**: "Create a customer satisfaction survey for a SaaS product"
- **Question Optimization**: Improve existing questions for clarity
- **Sentiment Analysis**: Analyze text responses
- **Smart Summaries**: Executive summary of results
- **Action Items**: Recommended next steps from feedback

**Example: AI Generate Survey**
```bash
curl -X POST http://localhost:5000/api/ai/generate-survey \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create an employee engagement survey with 8 questions",
    "questionCount": 8,
    "includeLogic": false
  }'
```

---

## Automation Tool

Quickly populate surveys with realistic test data for demos and development.

**Access:** http://localhost:3001

**Features:**
- 10 industry personas (Healthcare, Retail, Tech, etc.)
- Auto-creates surveys with industry-specific questions
- Generates 20 realistic user responses
- Full analytics ready immediately

**Example Usage:**
1. Start automation tool: `cd automation-tool && npm run dev`
2. Login with same credentials
3. Select persona (e.g., "Healthcare - Patient Satisfaction")
4. Click "Run Automation"
5. View results with 20 pre-filled responses

**Programmatic:**
```bash
curl -X POST http://localhost:5000/api/automation/run \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "personaId": "healthcare-patient-satisfaction",
    "scenarioCount": 20
  }'
```

**See [AUTOMATION_TOOL.md](AUTOMATION_TOOL.md) for details.**

---

## Common Workflows

### Workflow 1: Employee Feedback Survey

```bash
# 1. Create survey
POST /api/surveys
{
  "title": "Q4 Team Feedback",
  "visibility": "PRIVATE",  # Only accessible via link
  "isAnonymous": true
}

# 2. Add Likert scale questions
POST /api/surveys/{id}/questions
{
  "type": "LIKERT_SCALE",
  "text": "I feel valued and appreciated at work",
  "options": [
    {"text": "Strongly Disagree", "order": 0},
    {"text": "Disagree", "order": 1},
    {"text": "Neutral", "order": 2},
    {"text": "Agree", "order": 3},
    {"text": "Strongly Agree", "order": 4}
  ]
}

# 3. Add open feedback
POST /api/surveys/{id}/questions
{
  "type": "LONG_TEXT",
  "text": "What would improve your work experience?",
  "isRequired": false
}

# 4. Publish and share link
PUT /api/surveys/{id}
{"status": "ACTIVE"}

# 5. After responses, get AI insights
POST /api/ai/surveys/{id}/report
{"includeRecommendations": true}
```

### Workflow 2: Customer Satisfaction with Logic

```bash
# 1. Create NPS question
POST /api/surveys/{id}/questions
{
  "type": "NPS",
  "text": "How likely are you to recommend us?"
}

# 2. Add conditional follow-up
POST /api/surveys/{id}/logic
{
  "sourceQuestionId": "NPS_QUESTION_ID",
  "type": "SKIP_LOGIC",
  "conditions": [
    {"operator": "less_than", "value": 7}
  ],
  "actions": [
    {"type": "show_question", "targetQuestionId": "DETRACTOR_QUESTION_ID"}
  ]
}

# Logic: If NPS < 7, show "What went wrong?"
# If NPS >= 9, show "What did we do well?"
```

### Workflow 3: Multi-Language Survey

```bash
# Create base survey in English
POST /api/surveys {...}

# Add Spanish version (coming soon - currently single language)
# Translation workflow in development
```

---

## Configuration

### Required Environment Variables

```env
# Database (required)
DATABASE_URL=postgresql://postgres:password@localhost:5432/pulsegen

# Security (required - generate with: openssl rand -hex 32)
JWT_SECRET=<64-char-hex>
JWT_REFRESH_SECRET=<64-char-hex>
ENCRYPTION_KEY=<64-char-hex>

# Admin user (required for initial setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
```

### Optional Features

```env
# Caching (optional - improves performance)
REDIS_URL=redis://localhost:6379
USE_CACHE=true  # false to disable caching entirely

# Email (optional - for survey distribution)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AI (optional - users can add their own in UI)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
```

**No Redis?** App works fine with in-memory caching for development.

---

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   React     │─────▶│   Express   │─────▶│  PostgreSQL  │
│  Frontend   │      │   Backend   │      │   Database   │
│  (Port 3000)│      │  (Port 5000)│      │  (Port 5432) │
└─────────────┘      └─────────────┘      └──────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │    Redis    │
                     │   (Cache)   │
                     │ (Optional)  │
                     └─────────────┘
```

**Key Components:**
- **Prisma ORM**: Type-safe database queries
- **JWT Auth**: Secure token-based authentication
- **Zustand**: Lightweight state management
- **Cache Layer**: Pluggable (Redis or in-memory)

**Database Schema:**
- 30 tables covering surveys, questions, responses, analytics
- Supports complex logic, branching, and custom themes
- See: `backend/prisma/schema.prisma`

---

## Development

### Project Structure

```
pulsegen/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── lib/cache/    # Cache abstraction
│   │   └── data/         # Persona definitions
│   └── prisma/
│       ├── schema.prisma # Database schema
│       └── seed.ts       # Initial data
│
├── frontend/             # React + TypeScript UI
│   └── src/
│       ├── pages/        # Route pages
│       ├── stores/       # State management
│       └── lib/          # API client
│
├── automation-tool/      # Separate testing UI
│   └── src/
│       └── pages/        # Automation workflows
│
└── scripts/              # Setup automation
    ├── setup.ts          # Interactive CLI
    └── quick-setup.sh    # Bash script
```

### Database Migrations

```bash
# Create migration
cd backend
npx prisma migrate dev --name your_migration_name

# View database in browser
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed with sample data
npm run prisma:seed
```

### API Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Create survey (use token from login)
curl -X POST http://localhost:5000/api/surveys \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Survey","status":"DRAFT"}'
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests (if configured)
npm run test:e2e
```

---

## Production Deployment

### Docker (Recommended)

```bash
# With Redis for better performance
docker-compose --profile with-redis up -d

# Or without Redis
docker-compose up -d
```

### Environment Configuration

```env
NODE_ENV=production
APP_URL=https://surveys.yourdomain.com
CORS_ORIGIN=https://surveys.yourdomain.com

# Use strong, unique secrets in production
JWT_SECRET=<generate-new>
JWT_REFRESH_SECRET=<generate-new>
ENCRYPTION_KEY=<generate-new>
```

### Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secrets (64+ chars)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up PostgreSQL backups
- [ ] Enable Redis for production
- [ ] Configure rate limiting
- [ ] Set up monitoring/logging
- [ ] Review firewall rules
- [ ] Keep dependencies updated

---

## Troubleshooting

### Port already in use
```bash
# Find process
lsof -i :5000
# Kill it
kill -9 <PID>
```

### Database connection error
```bash
# Check PostgreSQL is running
pg_isready

# Start it
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux
```

### Redis connection fails
**This is OK!** App falls back to in-memory cache. To use Redis:
```bash
brew install redis && redis-server  # macOS
sudo apt install redis && sudo systemctl start redis  # Linux
```

### Prisma client errors
```bash
cd backend
npx prisma generate
```

**See [SETUP.md](SETUP.md) for complete troubleshooting guide.**

---

## Documentation

- **[SETUP.md](SETUP.md)** - Comprehensive setup guide
- **[AUTOMATION_TOOL.md](AUTOMATION_TOOL.md)** - Automation tool usage
- **[scripts/README.md](scripts/README.md)** - Setup scripts reference

---

## Key Features

### Survey Creation
✅ 17 question types
✅ Drag-and-drop builder
✅ Skip logic & branching
✅ Templates & question bank
✅ Multi-page surveys

### Distribution
✅ Public/private links
✅ QR codes
✅ Email invitations
✅ Embed codes
✅ Password protection

### Analytics
✅ Real-time dashboard
✅ Export CSV/Excel/PDF
✅ Custom filters
✅ Cross-tabulation
✅ Response tracking

### AI Features
✅ Survey generation
✅ Question optimization
✅ Sentiment analysis
✅ Smart summaries
✅ Action recommendations
✅ Multi-provider support (OpenAI, Anthropic, Google)

### Enterprise
✅ Self-hosted
✅ White-label ready
✅ SSO support
✅ Team workspaces
✅ Audit logging
✅ API access

---

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand
**Backend:** Node.js, Express, Prisma, JWT, Zod
**Database:** PostgreSQL, Redis (optional)
**AI:** OpenAI, Anthropic, Google (user-configurable)

---

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## Licensing & Editions

PulseGen is available in two editions:

### Community Edition (This Repo)
- **License**: MIT - Free and open source
- **Features**: Full survey platform with all core features
- **Support**: Community (GitHub Issues)
- **Perfect for**: Developers, startups, personal projects

### Enterprise Edition
- **License**: Commercial (paid subscription)
- **Features**: Everything in Community + SSO, advanced white-labeling, compliance tools
- **Support**: Professional SLA with email/phone/video
- **Perfect for**: Commercial use, large organizations
- **Details**: See [COMMERCIALIZATION_STRATEGY.md](./COMMERCIALIZATION_STRATEGY.md)

Both editions use the same codebase. Enterprise features unlock via license key.

---

## Support

- **Issues**: GitHub Issues
- **Setup Help**: [SETUP.md](SETUP.md)
- **API Docs**: http://localhost:5000/api-docs (when running)
- **Enterprise**: See [CUSTOMER_SETUP_GUIDE.md](./CUSTOMER_SETUP_GUIDE.md)

---

**Quick Links:**
- [Setup Guide](SETUP.md)
- [Automation Tool](AUTOMATION_TOOL.md)
- [Setup Scripts](scripts/README.md)
- [Licensing Details](LICENSING_GUIDE.md)
