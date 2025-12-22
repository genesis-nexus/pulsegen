# PulseGen GitHub Issues - LimeSurvey Competitive Roadmap

This directory contains detailed GitHub issue templates for achieving feature parity with LimeSurvey and establishing PulseGen as the #1 open-source survey platform.

## How to Use These Issues

Each markdown file is a complete, self-contained issue that can be:
1. Copy-pasted directly into GitHub Issues
2. Fed to an AI coding agent for implementation
3. Used as a technical specification

**Each issue includes:**
- Background and motivation
- Detailed requirements
- Technical implementation with code examples
- Database schema changes
- API endpoints
- Frontend components
- Acceptance criteria
- File lists for modifications

---

## Issue Index by Phase

### Phase 1: Foundation & Critical Parity (Months 1-3)

| Issue | Title | Priority | Effort | Status |
|-------|-------|----------|--------|--------|
| [001](./001-i18n-framework.md) | Internationalization (i18n) Framework | P0 Critical | Large | 🔴 TODO |
| [002](./002-progress-bar.md) | Survey Progress Bar Component | P1 High | Small | 🔴 TODO |
| [003](./003-save-continue-later.md) | Save & Continue Later Feature | P1 High | Medium | 🔴 TODO |
| [004](./004-two-factor-auth.md) | Two-Factor Authentication (2FA) | P1 High | Medium | 🔴 TODO |
| [005](./005-new-question-types.md) | Additional Question Types (11 types) | P1 High | Large | 🔴 TODO |
| [006](./006-quota-management.md) | Survey Quota Management System | P1 High | Medium | 🔴 TODO |
| [007](./007-participant-management.md) | Participant Management System | P0 Critical | Large | 🔴 TODO |

### Phase 2: Competitive Features (Months 4-6)

| Issue | Title | Priority | Effort | Status |
|-------|-------|----------|--------|--------|
| [008](./008-spss-r-export.md) | SPSS and R Export Formats | P1 High | Medium | 🔴 TODO |
| [009](./009-accessibility-wcag.md) | WCAG 2.1 AA Accessibility | P1 High | Large | 🔴 TODO |

### Phase 3: AI Leadership (Months 7-9)

| Issue | Title | Priority | Effort | Status |
|-------|-------|----------|--------|--------|
| [010](./010-ai-survey-wizard.md) | AI Survey Wizard (Conversational Builder) | P0 Critical | Large | 🔴 TODO |
| [011](./011-ai-auto-translation.md) | AI-Powered Auto-Translation | P1 High | Medium | 🔴 TODO |

---

## Issue Dependencies

```
001 (i18n) ────────┬─────────────────────────────────────► 011 (Auto-Translation)
                   │
                   ├──► 007 (Participants) ──► Email templates need i18n
                   │
                   └──► 010 (AI Wizard) ──► Multi-language survey generation

005 (Question Types) ──► 006 (Quotas) ──► Quotas use question values

004 (2FA) ──► Required for enterprise adoption
```

---

## Recommended Implementation Order

### Sprint 1 (Weeks 1-2)
1. **001 - i18n Framework** - Foundation for all translations
2. **002 - Progress Bar** - Quick win, improves UX

### Sprint 2 (Weeks 3-4)
3. **003 - Save & Continue** - Critical for long surveys
4. **004 - 2FA** - Security requirement

### Sprint 3 (Weeks 5-6)
5. **005 - Question Types** - Start with Image Select, Semantic Differential
6. **006 - Quota Management** - Research market requirement

### Sprint 4 (Weeks 7-8)
7. **007 - Participant Management** - Critical for controlled studies
8. Continue Question Types implementation

### Sprint 5 (Weeks 9-10)
9. **008 - SPSS/R Export** - Academic market
10. Begin **009 - Accessibility** audit

### Sprint 6 (Weeks 11-12)
11. Complete **009 - Accessibility** implementation
12. Begin **010 - AI Wizard** design

### Sprint 7-8 (Weeks 13-16)
13. **010 - AI Survey Wizard** - Key differentiator
14. **011 - AI Auto-Translation** - Leverages i18n

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| P0 Critical | Blocks major use cases, must implement first |
| P1 High | Important for competitiveness |
| P2 Medium | Nice to have, improves product |
| P3 Low | Future consideration |

## Effort Legend

| Effort | Estimate |
|--------|----------|
| Small | 1-3 days |
| Medium | 1-2 weeks |
| Large | 2-4 weeks |

---

## AI Agent Instructions

When implementing these issues, AI coding agents should:

1. **Read the entire issue** before starting
2. **Check dependencies** - Some issues require others to be completed first
3. **Follow the technical implementation** - Code examples are provided
4. **Create all listed files** - Both new and modified files are specified
5. **Meet all acceptance criteria** - Use as a checklist
6. **Write tests** - Unit and integration tests are expected
7. **Update related files** - Routes, schemas, and types need coordination

---

## Success Metrics

After implementing all issues, PulseGen should achieve:

- [ ] 28+ question types (matching LimeSurvey)
- [ ] 10+ languages supported
- [ ] WCAG 2.1 AA compliant
- [ ] 10+ unique AI-powered features
- [ ] Full participant management
- [ ] Statistical software export (SPSS/R)
- [ ] Enterprise security (2FA, SSO)

---

## Related Documents

- [Competitive Analysis](../COMPETITIVE_ANALYSIS_LIMESURVEY.md) - Full comparison with LimeSurvey
- [Architecture Overview](../../backend/README.md) - Backend structure
- [API Documentation](../../backend/src/routes/README.md) - Existing endpoints

---

*Last Updated: December 2024*
