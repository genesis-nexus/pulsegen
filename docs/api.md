# API Reference

PulseGen provides a RESTful API for programmatic access to surveys, responses, and analytics.

**Base URL:** `http://localhost:5001/api`

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header.

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "abc123",
      "email": "user@example.com",
      "role": "ADMIN"
    }
  }
}
```

### Using the Token

```http
GET /surveys
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Surveys

### List Surveys

```http
GET /surveys
Authorization: Bearer {token}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `status` | string | Filter by status: `DRAFT`, `ACTIVE`, `PAUSED`, `CLOSED` |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "survey123",
      "title": "Customer Feedback",
      "status": "ACTIVE",
      "createdAt": "2024-01-15T10:00:00Z",
      "responseCount": 156
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

### Get Survey

```http
GET /surveys/{id}
Authorization: Bearer {token}
```

### Create Survey

```http
POST /surveys
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Customer Satisfaction Survey",
  "description": "Help us improve our service",
  "status": "DRAFT",
  "isAnonymous": true,
  "visibility": "PUBLIC"
}
```

### Update Survey

```http
PUT /surveys/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "ACTIVE"
}
```

### Delete Survey

```http
DELETE /surveys/{id}
Authorization: Bearer {token}
```

### Publish Survey

```http
POST /surveys/{id}/publish
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "ACTIVE"
}
```

---

## Questions

### Add Question

```http
POST /surveys/{surveyId}/questions
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "MULTIPLE_CHOICE",
  "text": "How satisfied are you?",
  "isRequired": true,
  "order": 0,
  "options": [
    { "text": "Very Satisfied", "value": "5" },
    { "text": "Satisfied", "value": "4" },
    { "text": "Neutral", "value": "3" },
    { "text": "Dissatisfied", "value": "2" },
    { "text": "Very Dissatisfied", "value": "1" }
  ]
}
```

**Question Types:**
| Type | Description |
|------|-------------|
| `MULTIPLE_CHOICE` | Single selection from options |
| `CHECKBOXES` | Multiple selection |
| `DROPDOWN` | Dropdown menu |
| `RATING_SCALE` | Numeric rating (e.g., 1-5) |
| `NPS` | Net Promoter Score (0-10) |
| `MATRIX` | Grid of rows and columns |
| `RANKING` | Drag to rank items |
| `SHORT_TEXT` | Single line text |
| `LONG_TEXT` | Multi-line text |
| `EMAIL` | Email with validation |
| `NUMBER` | Numeric input |
| `DATE` | Date picker |
| `TIME` | Time picker |
| `FILE_UPLOAD` | File attachment |
| `SLIDER` | Range slider |
| `YES_NO` | Boolean choice |
| `LIKERT_SCALE` | Agreement scale |

### Update Question

```http
PUT /surveys/questions/{questionId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Updated question text",
  "isRequired": false
}
```

### Delete Question

```http
DELETE /surveys/{surveyId}/questions/{questionId}
Authorization: Bearer {token}
```

### Reorder Questions

```http
POST /surveys/{surveyId}/questions/reorder
Authorization: Bearer {token}
Content-Type: application/json

{
  "questionIds": ["q1", "q3", "q2", "q4"]
}
```

---

## Responses

### Submit Response (Public)

```http
POST /responses/surveys/{surveyId}/submit
Content-Type: application/json

{
  "answers": [
    {
      "questionId": "question123",
      "textValue": "Great service!"
    },
    {
      "questionId": "question456",
      "numberValue": 9
    },
    {
      "questionId": "question789",
      "optionId": "option123"
    }
  ]
}
```

### Get Responses

```http
GET /responses/surveys/{surveyId}
Authorization: Bearer {token}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `startDate` | ISO date | Filter from date |
| `endDate` | ISO date | Filter to date |
| `isComplete` | boolean | Filter by completion |

### Get Single Response

```http
GET /responses/{responseId}
Authorization: Bearer {token}
```

### Delete Response

```http
DELETE /responses/{responseId}
Authorization: Bearer {token}
```

---

## Analytics

### Get Survey Analytics

```http
GET /analytics/surveys/{surveyId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalResponses": 156,
    "completeResponses": 142,
    "completionRate": 91.0,
    "averageDuration": 180,
    "questionStats": [
      {
        "questionId": "q123",
        "type": "NPS",
        "averageValue": 8.3,
        "distribution": {
          "0": 2, "1": 0, "2": 1, "3": 3,
          "4": 5, "5": 8, "6": 12, "7": 25,
          "8": 35, "9": 40, "10": 25
        }
      }
    ]
  }
}
```

### Get Question Analytics

```http
GET /analytics/surveys/{surveyId}/questions/{questionId}
Authorization: Bearer {token}
```

### Cross-Tabulation

```http
POST /analytics/surveys/{surveyId}/crosstab
Authorization: Bearer {token}
Content-Type: application/json

{
  "questionId1": "q123",
  "questionId2": "q456"
}
```

---

## Export

### Export Responses

```http
POST /exports/surveys/{surveyId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "format": "CSV",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**Formats:** `CSV`, `EXCEL`, `PDF`, `JSON`

### Get Export Status

```http
GET /exports/{exportId}
Authorization: Bearer {token}
```

### Download Export

```http
GET /exports/{exportId}/download
Authorization: Bearer {token}
```

---

## AI Features

### Generate Survey

```http
POST /ai/generate-survey
Authorization: Bearer {token}
Content-Type: application/json

{
  "prompt": "Create a customer satisfaction survey for an e-commerce store",
  "questionCount": 10,
  "provider": "anthropic"
}
```

### Analyze Responses

```http
POST /ai/surveys/{surveyId}/analyze
Authorization: Bearer {token}
Content-Type: application/json

{
  "analysisType": "sentiment",
  "provider": "openai"
}
```

### Generate Report

```http
POST /ai/surveys/{surveyId}/report
Authorization: Bearer {token}
Content-Type: application/json

{
  "includeRecommendations": true,
  "provider": "anthropic"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 10 requests/minute |
| Response submission | 60 requests/minute |
| General API | 100 requests/minute |

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Webhooks

Configure webhooks in Settings to receive real-time notifications.

**Events:**
- `response.submitted` - New response received
- `response.completed` - Response marked complete
- `survey.published` - Survey published
- `quota.reached` - Survey quota reached

**Payload Example:**
```json
{
  "event": "response.submitted",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "surveyId": "survey123",
    "responseId": "response456"
  }
}
```

---

## SDKs & Libraries

- **JavaScript/TypeScript:** Coming soon
- **Python:** Coming soon
- **PHP:** Coming soon

---

## Need Help?

- [Setup Guide](SETUP.md)
- [GitHub Issues](https://github.com/your-org/pulsegen/issues)
