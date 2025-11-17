# PulseGen - Advanced Survey Platform

A comprehensive, self-hosted survey platform with AI-powered insights that rivals SurveyMonkey.

## Features

### Core Survey Features
- **15+ Question Types**: Multiple choice, checkboxes, dropdowns, rating scales, matrix, ranking, text, email, number, date, file upload, and more
- **Advanced Survey Logic**: Skip logic, branching, piping, randomization, and quotas
- **Drag-and-Drop Builder**: Intuitive interface for creating surveys
- **Survey Templates**: Pre-built templates for common use cases
- **Question Bank**: Reusable question library

### Distribution & Collection
- **Multiple Distribution Channels**: Email invitations, web links, QR codes, embeds, and social sharing
- **Response Management**: Real-time tracking, anonymous responses, IP blocking, response limits
- **Data Validation**: Built-in validation rules for quality responses
- **Mobile Optimized**: Fully responsive design for all devices

### Analytics & Insights
- **Real-time Analytics**: Live dashboard with response tracking
- **AI-Powered Insights**: Claude AI integration for intelligent analysis
- **Advanced Reporting**: Charts, graphs, cross-tabulation, trend analysis
- **Data Export**: CSV, Excel, PDF, JSON formats
- **Custom Filters**: Filter and segment responses
- **Sentiment Analysis**: AI-powered sentiment detection in text responses

### AI Capabilities (Enhanced Beyond SurveyMonkey)
- **Bring Your Own AI**: Support for multiple AI providers - OpenAI (GPT-4), Anthropic (Claude), Google (Gemini), and more
- **Survey Generation**: AI-powered survey creation from prompts
- **Question Recommendations**: Intelligent question suggestions
- **Response Analysis**: Automated insights from survey data
- **Trend Detection**: Identify patterns and anomalies
- **Predictive Analytics**: Forecast response trends
- **Smart Summaries**: Automatic executive summaries
- **Sentiment Analysis**: Understand respondent emotions
- **Recommendation Engine**: Action items based on feedback
- **Flexible Provider Selection**: Choose your preferred AI provider per task or set a default

### Customization & Branding
- **Theme Customization**: Full control over colors, fonts, and styling
- **White Labeling**: Remove branding for enterprise use
- **Custom Domains**: Use your own domain
- **Multi-language Support**: Create surveys in multiple languages
- **Custom CSS**: Advanced styling options

### Collaboration & Management
- **User Roles**: Admin, Manager, Viewer with granular permissions
- **Team Collaboration**: Share surveys with team members
- **Comment System**: Internal notes and discussions
- **Audit Logs**: Track all changes and access
- **Workspace Management**: Organize surveys by projects

### Self-Hosted Solution
- **Full Data Control**: Your data stays on your servers
- **Docker Support**: Easy deployment with Docker Compose
- **Scalable Architecture**: Designed for growth
- **API Access**: Comprehensive REST API
- **Webhook Support**: Real-time event notifications

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing fast builds
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **Zustand** for state management
- **React DnD** for drag-and-drop
- **Recharts** for data visualization
- **React Hook Form** for form management

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma ORM** for database management
- **JWT** for authentication
- **Zod** for validation
- **Multi-AI Provider Support**: OpenAI, Anthropic Claude, Google Gemini, Azure OpenAI
- **Nodemailer** for email distribution
- **Bull** for job queues

### Database
- **PostgreSQL** for relational data
- **Redis** for caching and queues

### Infrastructure
- **Docker** for containerization
- **Nginx** for reverse proxy
- **Let's Encrypt** for SSL

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 7+
- AI Provider API key (optional - for AI features):
  - OpenAI API key (recommended: gpt-4-turbo-preview)
  - OR Anthropic API key (recommended: claude-sonnet-4)
  - OR Google AI API key (recommended: gemini-pro)
  - Users can add their own API keys through the UI

### Quick Start with Docker

```bash
# Clone the repository
git clone <repository-url>
cd pulsegen

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start with Docker Compose
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### Manual Setup

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database and API keys
npx prisma migrate dev
npx prisma generate
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with API URL
npm run dev
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/pulsegen
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
ANTHROPIC_API_KEY=your-anthropic-key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
APP_URL=http://localhost:3000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

## Project Structure

```
pulsegen/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── models/           # Database models
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── utils/            # Utilities
│   │   ├── validators/       # Request validation
│   │   └── ai/               # AI integration
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   ├── stores/           # State management
│   │   ├── services/         # API services
│   │   ├── utils/            # Utilities
│   │   └── types/            # TypeScript types
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API Documentation

Once running, API documentation is available at:
- Swagger UI: http://localhost:5000/api-docs

## Key Features Comparison

| Feature | PulseGen Community | PulseGen Enterprise | SurveyMonkey |
|---------|-------------------|---------------------|--------------|
| **Pricing** | Free | $99-999+/month | $25-99+/month |
| **Hosting** | Self-hosted | Self-hosted or Managed | Cloud only |
| **Question Types** | 15+ | 15+ | 15+ |
| **AI Insights** | ✅ Basic (BYOK) | ✅ Advanced | ❌ |
| **Self-Hosted** | ✅ | ✅ | ❌ |
| **SSO Integration** | ❌ | ✅ | ✅ (Enterprise) |
| **White Label** | ⚠️ Basic | ✅ Advanced | ✅ (Enterprise) |
| **Real-time Analytics** | ✅ | ✅ Advanced | ✅ |
| **Survey Logic** | ✅ | ✅ | ✅ |
| **API Access** | ✅ Full | ✅ Full | ⚠️ Limited |
| **Custom Branding** | ⚠️ Limited | ✅ Full | ✅ |
| **Data Ownership** | ✅ Full | ✅ Full | ❌ |
| **Support** | Community | Professional SLA | Email/Chat |
| **Source Code Access** | ✅ | ✅ | ❌ |
| **Compliance Tools** | ❌ | ✅ | ✅ (Enterprise) |
| **Response Limits** | Unlimited | Unlimited | ⚠️ Limited by plan |

## AI-Powered Features

### Survey Intelligence
- **Auto-generate surveys** from natural language descriptions
- **Optimize questions** for better response rates
- **Suggest follow-up questions** based on previous answers

### Response Analysis
- **Automated insights** from survey results
- **Sentiment analysis** on text responses
- **Theme extraction** from open-ended questions
- **Anomaly detection** in response patterns
- **Predictive modeling** for future trends

### Smart Recommendations
- **Action items** generated from feedback
- **Priority ranking** of issues
- **Trend forecasting** and predictions
- **Comparative analysis** across surveys

## Security Features

- **Encryption at rest and in transit**
- **Role-based access control (RBAC)**
- **Audit logging**
- **Rate limiting**
- **CORS protection**
- **SQL injection protection**
- **XSS protection**
- **CSRF tokens**
- **Password hashing with bcrypt**
- **API key management**

## Commercial Offerings

PulseGen is available in two editions:

### Community Edition (Free)
- **Open Source**: Full source code access under MIT License
- **Self-Hosted**: Deploy on your infrastructure
- **Core Features**: All essential survey functionality
- **Community Support**: GitHub issues and community forum
- **Perfect for**: Personal projects, startups, small teams

**Get started**: Clone this repository and follow the Quick Start guide above

### Enterprise Edition (Paid)
- **Everything in Community Edition**
- **Professional Support**: Email, video, and phone support with SLA
- **Enterprise Features**:
  - Single Sign-On (SSO) - SAML, OAuth2, LDAP
  - Advanced white-labeling and custom branding
  - Priority security patches and updates
  - Compliance assistance (SOC2, HIPAA, GDPR)
  - Dedicated customer success manager
- **One-Click Installation**: Automated setup script
- **Training & Onboarding**: Guided setup and best practices
- **Perfect for**: Commercial use, enterprises, teams needing support

**Pricing**:
- **Starter**: $99/month - Up to 5 users, email support
- **Professional**: $299/month - Up to 50 users, SSO, priority support
- **Enterprise**: Custom pricing - Unlimited users, 24/7 support, SLA, custom development

**Learn more**: See [COMMERCIALIZATION_STRATEGY.md](./COMMERCIALIZATION_STRATEGY.md) for detailed comparison

**Get Enterprise**: Contact sales@pulsegen.com or visit https://pulsegen.com/enterprise

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

For Enterprise customers, see [CUSTOMER_SETUP_GUIDE.md](./CUSTOMER_SETUP_GUIDE.md) for streamlined setup.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Licensing

PulseGen uses a **dual-licensing model**:

- **Community Edition**: MIT License - Free for everyone
- **Enterprise Edition**: Commercial License - Paid subscription with support and enterprise features

Both editions use the same codebase. Enterprise features are unlocked via license key.

**Details**: See [LICENSING_GUIDE.md](./LICENSING_GUIDE.md) for complete licensing information

**MIT License**: See [LICENSE](./LICENSE) for the Community Edition license text

## Support

### Community Support (Free)
- **GitHub Issues**: <repository-url>/issues
- **Documentation**: See docs/ folder
- **Community Forum**: https://community.pulsegen.com
- **Discord**: https://discord.gg/pulsegen

### Enterprise Support (Paid)
- **Email Support**: support@pulsegen.com (SLA guaranteed)
- **Customer Portal**: https://portal.pulsegen.com
- **Video Calls**: Scheduled support sessions
- **Phone Support**: 24/7 for Enterprise tier customers
- **Dedicated Slack**: Private channel for your team
- **Training**: Onboarding and best practices

**Need enterprise support?** Visit https://pulsegen.com/enterprise

## Roadmap

- [ ] Mobile applications (iOS/Android)
- [ ] Advanced A/B testing
- [ ] Integration marketplace
- [ ] Video question types
- [ ] Voice responses
- [ ] Offline mode
- [ ] Advanced statistical analysis
- [ ] Machine learning models for response prediction
