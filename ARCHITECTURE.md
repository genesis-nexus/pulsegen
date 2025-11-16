# PulseGen System Architecture

## Overview

PulseGen is built as a modern, scalable three-tier application with a React frontend, Node.js backend, and PostgreSQL database. The system is designed for self-hosting with AI capabilities integrated throughout.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │    Mobile    │  │   Embedded   │      │
│  │              │  │              │  │    Widget    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
          ┌──────────────────▼──────────────────┐
          │         Load Balancer (Nginx)        │
          └──────────────────┬──────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                    Application Layer                         │
│         ┌──────────────────┴──────────────────┐              │
│         │     React Frontend (Vite)           │              │
│         │  - Components & Pages               │              │
│         │  - State Management (Zustand)       │              │
│         │  - API Client (React Query)         │              │
│         └──────────────────┬──────────────────┘              │
│                            │                                  │
│         ┌──────────────────▼──────────────────┐              │
│         │   Express Backend (Node.js)         │              │
│         │  ┌─────────────────────────────┐    │              │
│         │  │      API Routes             │    │              │
│         │  ├─────────────────────────────┤    │              │
│         │  │    Controllers              │    │              │
│         │  ├─────────────────────────────┤    │              │
│         │  │    Services Layer           │◄───┼────┐         │
│         │  ├─────────────────────────────┤    │    │         │
│         │  │  Authentication (JWT)       │    │    │         │
│         │  ├─────────────────────────────┤    │    │         │
│         │  │  Validation (Zod)           │    │    │         │
│         │  └─────────────────────────────┘    │    │         │
│         └──────────────────┬──────────────────┘    │         │
│                            │                        │         │
└────────────────────────────┼────────────────────────┼─────────┘
                             │                        │
┌────────────────────────────┼────────────────────────┼─────────┐
│                      Data Layer                     │         │
│         ┌──────────────────▼──────────────────┐     │         │
│         │    PostgreSQL Database              │     │         │
│         │  - Surveys & Questions              │     │         │
│         │  - Responses & Analytics            │     │         │
│         │  - Users & Permissions              │     │         │
│         │  - Templates & Themes               │     │         │
│         └─────────────────────────────────────┘     │         │
│                                                      │         │
│         ┌────────────────────────────────────┐      │         │
│         │    Redis Cache                     │      │         │
│         │  - Session Storage                 │      │         │
│         │  - Job Queues                      │      │         │
│         │  - Rate Limiting                   │      │         │
│         └────────────────────────────────────┘      │         │
└─────────────────────────────────────────────────────┘         │
                                                                 │
┌────────────────────────────────────────────────────────────────┤
│                   External Services                            │
│         ┌────────────────────────────────────┐                 │
│         │   Anthropic Claude API             │◄────────────────┘
│         │  - Survey Generation               │
│         │  - Response Analysis               │
│         │  - Insight Generation              │
│         │  - Sentiment Analysis              │
│         └────────────────────────────────────┘
│
│         ┌────────────────────────────────────┐
│         │   Email Service (SMTP)             │
│         │  - Survey Invitations              │
│         │  - Notifications                   │
│         │  - Reminders                       │
│         └────────────────────────────────────┘
└──────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Entities

#### Users & Authentication
- **users**: User accounts with roles
- **sessions**: Active user sessions
- **api_keys**: API authentication tokens

#### Surveys
- **surveys**: Survey definitions
- **survey_pages**: Multi-page surveys
- **questions**: Survey questions
- **question_options**: Answer options for choice questions
- **survey_logic**: Skip logic and branching rules
- **survey_themes**: Custom styling

#### Responses
- **responses**: Individual survey submissions
- **answers**: Specific question answers
- **response_metadata**: IP, device, location data

#### Templates & Organization
- **survey_templates**: Pre-built survey templates
- **question_bank**: Reusable questions
- **workspaces**: Team organization
- **workspace_members**: User workspace access

#### Analytics
- **survey_analytics**: Cached analytics data
- **ai_insights**: Generated insights from Claude
- **response_exports**: Export history

## Data Flow

### Survey Creation Flow
```
User → Frontend → API → Validation → Service Layer → Prisma → PostgreSQL
                                           ↓
                                    AI Service (Optional)
                                           ↓
                                    Claude API (Question suggestions)
```

### Response Collection Flow
```
Respondent → Public Survey Page → API → Validation
                                          ↓
                                    Rate Limiting Check
                                          ↓
                                    Business Rules (Logic, Skip)
                                          ↓
                                    Save to Database
                                          ↓
                                    Queue Analytics Update
                                          ↓
                                    Background Job → AI Analysis
```

### Analytics Generation Flow
```
User Request → API → Check Cache (Redis)
                          ↓
                     Cache Miss
                          ↓
                    Query Database (Aggregations)
                          ↓
                    AI Service (Insights)
                          ↓
                    Claude API (Analysis)
                          ↓
                    Store in Cache
                          ↓
                    Return Results
```

## API Design

### RESTful Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

#### Surveys
- `GET /api/surveys` - List surveys
- `POST /api/surveys` - Create survey
- `GET /api/surveys/:id` - Get survey
- `PUT /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey
- `POST /api/surveys/:id/duplicate` - Duplicate survey
- `POST /api/surveys/:id/publish` - Publish survey
- `GET /api/surveys/:id/preview` - Preview survey

#### Questions
- `POST /api/surveys/:id/questions` - Add question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `POST /api/questions/:id/duplicate` - Duplicate question

#### Responses
- `POST /api/surveys/:id/responses` - Submit response (public)
- `GET /api/surveys/:id/responses` - List responses
- `GET /api/responses/:id` - Get response
- `DELETE /api/responses/:id` - Delete response

#### Analytics
- `GET /api/surveys/:id/analytics` - Survey analytics
- `GET /api/surveys/:id/analytics/summary` - Summary stats
- `GET /api/surveys/:id/analytics/insights` - AI insights
- `POST /api/surveys/:id/analytics/export` - Export data

#### AI Features
- `POST /api/ai/generate-survey` - Generate survey from prompt
- `POST /api/ai/suggest-questions` - Question suggestions
- `POST /api/ai/analyze-responses` - Analyze responses
- `POST /api/ai/generate-report` - Generate report

#### Templates
- `GET /api/templates` - List templates
- `GET /api/templates/:id` - Get template
- `POST /api/templates` - Create template
- `POST /api/templates/:id/use` - Create survey from template

#### Users & Workspaces
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `POST /api/workspaces/:id/members` - Add member
- `PUT /api/users/:id` - Update user
- `GET /api/users/:id/activity` - User activity

## Security Architecture

### Authentication & Authorization
- **JWT-based authentication** with access and refresh tokens
- **Role-based access control (RBAC)**: Admin, Manager, Viewer
- **API key authentication** for programmatic access
- **Session management** with Redis

### Data Protection
- **Encryption at rest**: Database encryption
- **Encryption in transit**: HTTPS/TLS
- **Password hashing**: bcrypt with salt
- **Input validation**: Zod schemas
- **SQL injection prevention**: Parameterized queries (Prisma)
- **XSS protection**: Content sanitization
- **CSRF protection**: Tokens for state-changing operations

### Rate Limiting
- **API rate limits**: Per user/IP
- **Response submission limits**: Per survey
- **AI request limits**: Per workspace

## AI Integration Architecture

### Claude API Integration

#### Request Flow
```
User Action → Service Layer → AI Service
                                   ↓
                            Format Prompt
                                   ↓
                            Call Claude API
                                   ↓
                            Parse Response
                                   ↓
                            Cache Result
                                   ↓
                            Return to User
```

#### AI Capabilities

1. **Survey Generation**
   - Input: Natural language description
   - Output: Complete survey with questions
   - Model: Claude Sonnet for complex surveys

2. **Response Analysis**
   - Input: Survey responses
   - Output: Insights, themes, sentiment
   - Model: Claude Sonnet for deep analysis

3. **Question Optimization**
   - Input: Existing questions
   - Output: Improved versions
   - Model: Claude Haiku for quick suggestions

4. **Report Generation**
   - Input: Analytics data
   - Output: Executive summary
   - Model: Claude Sonnet for comprehensive reports

#### Prompt Engineering
- **System prompts**: Role definition for survey expert
- **Few-shot examples**: Quality question examples
- **Context injection**: Survey context and goals
- **Output formatting**: Structured JSON responses

## Scalability Considerations

### Horizontal Scaling
- **Stateless backend**: Can run multiple instances
- **Load balancing**: Nginx for request distribution
- **Database connection pooling**: Prisma connection pool
- **Session storage**: Redis for shared sessions

### Caching Strategy
- **Response caching**: Cache analytics for 5 minutes
- **Template caching**: Cache survey templates
- **AI result caching**: Cache AI insights for 1 hour
- **CDN**: Static assets on CDN

### Background Jobs
- **Email sending**: Queued with Bull
- **Analytics calculation**: Background processing
- **AI analysis**: Async job processing
- **Data export**: Background generation

### Database Optimization
- **Indexing**: Strategic indexes on query patterns
- **Partitioning**: Response table partitioning by date
- **Archiving**: Old survey archival
- **Read replicas**: Separate analytics queries

## Deployment Architecture

### Docker Composition
```
┌─────────────────────────────────────────────┐
│              Docker Host                    │
│  ┌─────────────────────────────────────┐   │
│  │      Nginx Container                │   │
│  │      (Port 80, 443)                 │   │
│  └──────────────┬──────────────────────┘   │
│                 │                           │
│  ┌──────────────▼──────────────────────┐   │
│  │      Frontend Container             │   │
│  │      (React Build - Static)         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │      Backend Container              │   │
│  │      (Node.js Express)              │   │
│  └──────────────┬──────────────────────┘   │
│                 │                           │
│  ┌──────────────▼──────────────────────┐   │
│  │      PostgreSQL Container           │   │
│  │      (Data Volume)                  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │      Redis Container                │   │
│  │      (Cache & Queue)                │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Environment Configuration
- **Development**: Local setup with hot reload
- **Staging**: Docker compose with test data
- **Production**: Docker with external database

## Monitoring & Logging

### Application Monitoring
- **Health checks**: /health endpoint
- **Error tracking**: Structured error logging
- **Performance metrics**: Response times
- **AI usage tracking**: Token consumption

### Logging Strategy
- **Request logging**: All API requests
- **Error logging**: Stack traces
- **Audit logging**: User actions
- **AI interaction logging**: Prompts and responses

## Technology Decisions

### Why React?
- Large ecosystem and community
- Component reusability
- Excellent developer experience
- Rich library support (DnD, charts, etc.)

### Why Node.js + Express?
- JavaScript everywhere (frontend + backend)
- Fast development cycle
- Excellent async handling for AI calls
- Large package ecosystem

### Why PostgreSQL?
- ACID compliance for data integrity
- JSON support for flexible schemas
- Robust query capabilities
- Excellent for analytics queries

### Why Prisma?
- Type-safe database access
- Automatic migrations
- Excellent TypeScript support
- Great developer experience

### Why Redis?
- Fast caching
- Pub/sub for real-time features
- Job queue support
- Session storage

## Future Enhancements

### Phase 2
- WebSocket for real-time collaboration
- GraphQL API option
- Mobile native apps
- Advanced ML models

### Phase 3
- Microservices architecture
- Kubernetes deployment
- Multi-region support
- Advanced A/B testing

### Phase 4
- Video/voice responses
- Blockchain verification
- Advanced fraud detection
- Predictive analytics
