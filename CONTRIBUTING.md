# Contributing to PulseGen

Thank you for your interest in contributing to PulseGen! This guide will help you get started.

## Ways to Contribute

- **Bug Reports** — Found a bug? Open an issue
- **Feature Requests** — Have an idea? Let's discuss
- **Code** — Submit a pull request
- **Documentation** — Improve docs and guides
- **Testing** — Help test new features

---

## Getting Started

### 1. Fork the Repository

Click the "Fork" button on GitHub to create your own copy.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/pulsegen.git
cd pulsegen
```

### 3. Set Up Development Environment

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up database
cd backend
cp .env.example .env
# Edit .env with your database credentials
npx prisma migrate dev

# Start development servers
npm run dev  # Terminal 1: Backend
cd frontend && npm run dev  # Terminal 2: Frontend
```

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

---

## Development Workflow

### Code Style

We use ESLint and Prettier. Run before committing:

```bash
# Backend
cd backend
npm run lint
npm run format

# Frontend
cd frontend
npm run lint
npm run format
```

### Type Checking

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `style` — Code style (formatting, semicolons, etc.)
- `refactor` — Code change that neither fixes a bug nor adds a feature
- `test` — Adding or updating tests
- `chore` — Maintenance tasks

**Examples:**
```bash
git commit -m "feat(surveys): add drag-and-drop reordering"
git commit -m "fix(auth): resolve token refresh race condition"
git commit -m "docs: update API reference with new endpoints"
```

---

## Pull Request Process

### 1. Update Your Branch

```bash
git fetch origin
git rebase origin/main
```

### 2. Push Your Changes

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill out the PR template
4. Link related issues

### 4. PR Checklist

Before submitting, ensure:

- [ ] Code follows the project style guide
- [ ] All tests pass
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] No console.log or debug statements
- [ ] No hardcoded secrets or credentials

### 5. Review Process

- A maintainer will review your PR
- Address any requested changes
- Once approved, your PR will be merged

---

## Project Structure

```
pulsegen/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utilities
│   └── prisma/
│       └── schema.prisma    # Database schema
│
├── frontend/                # React application
│   └── src/
│       ├── components/      # Reusable components
│       ├── pages/           # Route pages
│       ├── lib/             # API client, utilities
│       └── types/           # TypeScript types
│
├── docs/                    # Documentation
└── .github/                 # GitHub workflows
```

---

## Adding New Features

### Backend

1. **Routes** — Add endpoints in `backend/src/routes/`
2. **Services** — Add business logic in `backend/src/services/`
3. **Database** — Update schema in `backend/prisma/schema.prisma`
4. **Validation** — Use Zod for request validation
5. **Tests** — Add tests for new functionality

### Frontend

1. **Pages** — Add pages in `frontend/src/pages/`
2. **Components** — Add reusable components in `frontend/src/components/`
3. **API** — Add API calls in `frontend/src/lib/api.ts`
4. **Types** — Add TypeScript types in `frontend/src/types/`

---

## Database Changes

When modifying the database schema:

```bash
cd backend

# 1. Edit prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name your_migration_name

# 3. Update Prisma client
npx prisma generate

# 4. Test the migration
npm test
```

---

## Reporting Bugs

When opening a bug report, include:

1. **Description** — Clear description of the issue
2. **Steps to Reproduce** — How to trigger the bug
3. **Expected Behavior** — What should happen
4. **Actual Behavior** — What actually happens
5. **Environment** — OS, Node version, browser
6. **Screenshots** — If applicable

Use the bug report template when opening issues.

---

## Feature Requests

When proposing a feature:

1. **Problem** — What problem does it solve?
2. **Solution** — How would it work?
3. **Alternatives** — Other approaches considered
4. **Impact** — Who benefits from this?

Use the feature request template when opening issues.

---

## Code of Conduct

Be respectful and inclusive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

**Expected behavior:**
- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community

**Unacceptable behavior:**
- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing private information without consent

---

## Getting Help

- **Questions** — Open a [Discussion](https://github.com/genesis-nexus/pulsegen/discussions)
- **Bugs** — Open an [Issue](https://github.com/genesis-nexus/pulsegen/issues)
- **Security** — Email security@pulsegen.dev (do not open public issues)

---

## Recognition

Contributors are listed in our [Contributors](https://github.com/genesis-nexus/pulsegen/graphs/contributors) page.

Thank you for contributing to PulseGen!
