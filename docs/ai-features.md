---
layout: default
title: AI Features
nav_order: 4
description: "Configure AI providers and unlock powerful automation in PulseGen."
---

# AI Features
{: .no_toc }

Unlock powerful automation by connecting your own AI provider.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

PulseGen's AI features let you:

- **Generate surveys** from natural language descriptions
- **Optimize questions** for clarity and engagement
- **Analyze responses** with sentiment detection and theme extraction
- **Translate surveys** to 12+ languages instantly

{: .note }
AI features are optional. PulseGen works perfectly without them—add AI when you're ready.

---

## Supported Providers

| Provider | Models | Best For |
|:---------|:-------|:---------|
| **OpenAI** | GPT-4, GPT-4 Turbo, GPT-3.5 | General use, fast responses |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus | Long-form analysis, nuanced responses |
| **Google** | Gemini Pro, Gemini Ultra | Multi-modal, cost-effective |
| **Azure OpenAI** | GPT-4, GPT-3.5 | Enterprise compliance |

---

## Configuration

### Setting API Keys

Add your API keys to the `.env` file:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google AI
GOOGLE_AI_API_KEY=AIza...

# Azure OpenAI
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

{: .warning }
Keep API keys secure. Never commit them to version control.

### In-App Configuration

1. Go to **Settings** → **AI Configuration**
2. Select your preferred provider
3. Enter your API key
4. Test the connection
5. Save settings

---

## AI Survey Generation

Generate complete surveys from plain English descriptions.

### Quick Generate

1. Navigate to **Surveys** → **Create Survey with AI**
2. Select **Quick Generate**
3. Describe your survey:
   ```
   Create a customer satisfaction survey for an e-commerce store.
   Include questions about product quality, shipping speed,
   customer service, and likelihood to recommend.
   ```
4. Set question count (5-30)
5. Click **Generate**

### Guided Wizard

For more control:

1. Select **Guided Wizard**
2. Have a conversation with AI to refine your survey
3. Iterate on questions and structure
4. Preview and edit before saving

### API Usage

```bash
curl -X POST http://localhost:5001/api/ai/generate-survey \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Customer feedback survey for a SaaS product",
    "questionCount": 10,
    "provider": "anthropic"
  }'
```

---

## Question Optimization

AI reviews your questions for:

- **Clarity** — Ambiguous wording
- **Bias** — Leading questions
- **Length** — Questions that are too long
- **Engagement** — Ways to improve response rates

### Using Optimization

1. Open a survey in the editor
2. Click the **AI Optimize** button
3. Review suggestions
4. Accept or reject each recommendation

---

## Response Analysis

### Sentiment Analysis

Automatically detect emotional tone in open-ended responses:

- **Positive** — Satisfied customers
- **Negative** — Issues to address
- **Neutral** — Factual feedback
- **Mixed** — Complex responses

### Theme Extraction

Identify common themes across responses:

```json
{
  "themes": [
    { "name": "Shipping Speed", "count": 45, "sentiment": "negative" },
    { "name": "Product Quality", "count": 38, "sentiment": "positive" },
    { "name": "Customer Service", "count": 22, "sentiment": "mixed" }
  ]
}
```

### Smart Summaries

Get AI-generated summaries of survey results:

1. Open survey analytics
2. Click **Generate AI Summary**
3. Review insights and recommendations

---

## Translation

Translate surveys to multiple languages while preserving meaning and context.

### Supported Languages

- English, Spanish, French, German, Italian
- Portuguese, Dutch, Polish, Russian
- Chinese (Simplified/Traditional), Japanese, Korean
- Arabic, Hebrew (RTL support)

### Using Translation

1. Open survey settings
2. Click **Add Language**
3. Select target language
4. Choose **AI Translate** or manual translation
5. Review and publish

---

## Cost Optimization

{: .tip }
Use these strategies to minimize API costs.

### Choose the Right Model

| Task | Recommended Model |
|:-----|:------------------|
| Survey generation | GPT-4 / Claude 3.5 Sonnet |
| Question optimization | GPT-3.5 / Claude 3 Haiku |
| Sentiment analysis | GPT-3.5 / Gemini Pro |
| Translation | GPT-4 / Claude 3.5 Sonnet |

### Batch Processing

Process multiple responses together instead of individually:

```env
# Enable batch mode for analysis
AI_BATCH_SIZE=50
AI_BATCH_DELAY_MS=1000
```

### Caching

Enable response caching to avoid duplicate API calls:

```env
AI_CACHE_ENABLED=true
AI_CACHE_TTL_SECONDS=3600
```

---

## Rate Limits

PulseGen respects provider rate limits:

| Provider | Requests/min | Tokens/min |
|:---------|:-------------|:-----------|
| OpenAI | 60 | 90,000 |
| Anthropic | 60 | 100,000 |
| Google AI | 60 | 120,000 |

{: .note }
Limits vary by plan. Check your provider's documentation.

---

## Privacy Considerations

When using AI features:

1. **Data Processing** — Survey responses are sent to AI providers
2. **Data Retention** — Check provider policies on data retention
3. **Compliance** — Ensure AI usage complies with your data policies
4. **Opt-out** — Users can disable AI features per survey

### GDPR Compliance

For GDPR compliance:

```env
# Anonymize responses before AI processing
AI_ANONYMIZE_PII=true

# Use EU-based endpoints where available
AZURE_OPENAI_ENDPOINT=https://your-eu-resource.openai.azure.com
```

---

## Troubleshooting

### "API Key Invalid"

1. Check key format matches provider
2. Verify key has required permissions
3. Ensure key hasn't expired

### "Rate Limit Exceeded"

1. Wait and retry
2. Reduce batch size
3. Upgrade your API plan

### "Model Not Available"

1. Check model name spelling
2. Verify model is available in your region
3. Try an alternative model

---

## API Reference

See the [AI API Documentation]({% link api.md %}#ai-features) for complete endpoint details.
