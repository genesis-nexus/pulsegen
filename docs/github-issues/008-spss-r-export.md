# Implement SPSS and R Export Formats

## Priority: P1 - High
## Labels: `feature`, `analytics`, `phase-2`, `academic`, `export`
## Estimated Effort: Medium

---

## Summary

Add export functionality for SPSS (.sav) and R (.rds/.csv with codebook) formats. This is critical for academic researchers and data scientists who need to analyze survey data in statistical software.

---

## Background & Motivation

LimeSurvey supports SPSS export as a core feature. The academic and research market requires:
- SPSS format for social science research
- R format for data science and statistical analysis
- Proper variable labels, value labels, and metadata
- Codebook generation for documentation

Without these formats, PulseGen cannot serve:
- Universities and research institutions
- Market research firms
- Data science teams
- Graduate students and researchers

---

## Requirements

### SPSS Export (.sav)

1. **Variable Metadata**
   - Variable names (from question IDs, cleaned for SPSS)
   - Variable labels (question text)
   - Value labels (for choice questions)
   - Missing value definitions

2. **Data Types**
   - Numeric for scales, ratings, numbers
   - String for text responses
   - Date/time for date questions

3. **Additional Features**
   - Unicode support
   - Long string support (>255 characters)
   - Multiple response sets
   - Survey metadata as document variables

### R Export

1. **Data File (.rds or .csv)**
   - Clean data frame with proper types
   - Factor levels for categorical variables
   - Date/time as proper R date types

2. **Codebook (.R script)**
   - Variable descriptions
   - Value labels as factors
   - Data dictionary
   - Import instructions

3. **Analysis-Ready Package**
   - Pre-configured factor levels
   - Proper NA handling
   - Survey weights if applicable

---

## Technical Implementation

### 1. Install Dependencies

```bash
cd backend
npm install spssify json2csv
```

### 2. Export Service

**File: `backend/src/services/exportService.ts`** (extend existing)

```typescript
import { prisma } from '../lib/prisma';
import { spss } from 'spssify';
import { parse as json2csv } from 'json2csv';
import archiver from 'archiver';
import { Readable } from 'stream';

export class StatisticalExportService {
  /**
   * Export survey responses to SPSS format
   */
  async exportToSPSS(surveyId: string): Promise<Buffer> {
    const survey = await this.getSurveyWithResponses(surveyId);

    // Build SPSS variable definitions
    const variables: SpssVariable[] = [];
    const data: any[] = [];

    // Add metadata variables
    variables.push(
      { name: 'ResponseID', label: 'Response ID', type: 'string', width: 36 },
      { name: 'StartTime', label: 'Survey Start Time', type: 'datetime' },
      { name: 'EndTime', label: 'Survey End Time', type: 'datetime' },
      { name: 'Duration', label: 'Duration (seconds)', type: 'numeric' }
    );

    // Build variables from questions
    for (const page of survey.pages) {
      for (const question of page.questions) {
        const varName = this.cleanVariableName(question.id, question.text);

        switch (question.type) {
          case 'MULTIPLE_CHOICE':
          case 'DROPDOWN':
          case 'YES_NO':
            variables.push({
              name: varName,
              label: this.truncateLabel(question.text),
              type: 'numeric',
              valueLabels: this.buildValueLabels(question.options),
            });
            break;

          case 'CHECKBOXES':
            // Multiple response - create variable for each option
            for (const option of question.options || []) {
              variables.push({
                name: `${varName}_${this.cleanVariableName(option.id)}`,
                label: `${this.truncateLabel(question.text)} - ${option.text}`,
                type: 'numeric',
                valueLabels: { 0: 'Not selected', 1: 'Selected' },
              });
            }
            break;

          case 'RATING_SCALE':
          case 'NPS':
          case 'SLIDER':
          case 'NUMBER':
            variables.push({
              name: varName,
              label: this.truncateLabel(question.text),
              type: 'numeric',
              measurementLevel: 'scale',
            });
            break;

          case 'LIKERT_SCALE':
            variables.push({
              name: varName,
              label: this.truncateLabel(question.text),
              type: 'numeric',
              valueLabels: this.buildLikertLabels(question.settings),
              measurementLevel: 'ordinal',
            });
            break;

          case 'MATRIX':
            // Create variable for each row
            for (const row of question.settings?.rows || []) {
              variables.push({
                name: `${varName}_${this.cleanVariableName(row.id)}`,
                label: `${this.truncateLabel(question.text)} - ${row.text}`,
                type: 'numeric',
                valueLabels: this.buildValueLabels(question.options),
              });
            }
            break;

          case 'SHORT_TEXT':
          case 'LONG_TEXT':
          case 'EMAIL':
            variables.push({
              name: varName,
              label: this.truncateLabel(question.text),
              type: 'string',
              width: question.type === 'LONG_TEXT' ? 32767 : 255,
            });
            break;

          case 'DATE':
            variables.push({
              name: varName,
              label: this.truncateLabel(question.text),
              type: 'date',
            });
            break;

          case 'TIME':
            variables.push({
              name: varName,
              label: this.truncateLabel(question.text),
              type: 'time',
            });
            break;

          case 'RANKING':
            // Create variable for each rank position
            const optionCount = question.options?.length || 0;
            for (let i = 1; i <= optionCount; i++) {
              variables.push({
                name: `${varName}_Rank${i}`,
                label: `${this.truncateLabel(question.text)} - Rank ${i}`,
                type: 'numeric',
                valueLabels: this.buildValueLabels(question.options),
              });
            }
            break;

          default:
            variables.push({
              name: varName,
              label: this.truncateLabel(question.text),
              type: 'string',
              width: 255,
            });
        }
      }
    }

    // Build data rows
    for (const response of survey.responses) {
      const row: any = {
        ResponseID: response.id,
        StartTime: response.startedAt,
        EndTime: response.completedAt,
        Duration: response.completedAt && response.startedAt
          ? Math.round((response.completedAt.getTime() - response.startedAt.getTime()) / 1000)
          : null,
      };

      // Add answer data
      for (const answer of response.answers) {
        const question = this.findQuestion(survey, answer.questionId);
        if (!question) continue;

        const varName = this.cleanVariableName(question.id, question.text);
        const value = this.parseAnswerValue(answer.value);

        switch (question.type) {
          case 'CHECKBOXES':
            // Set 1 for selected options, 0 for others
            const selectedOptions = Array.isArray(value) ? value : [value];
            for (const option of question.options || []) {
              row[`${varName}_${this.cleanVariableName(option.id)}`] =
                selectedOptions.includes(option.id) || selectedOptions.includes(option.text) ? 1 : 0;
            }
            break;

          case 'MATRIX':
            // Parse matrix answers
            if (typeof value === 'object') {
              for (const [rowId, rowValue] of Object.entries(value)) {
                row[`${varName}_${this.cleanVariableName(rowId)}`] = this.getOptionIndex(question.options, rowValue);
              }
            }
            break;

          case 'RANKING':
            // Parse ranking answers
            if (Array.isArray(value)) {
              value.forEach((optionId, index) => {
                row[`${varName}_Rank${index + 1}`] = this.getOptionIndex(question.options, optionId);
              });
            }
            break;

          case 'MULTIPLE_CHOICE':
          case 'DROPDOWN':
          case 'YES_NO':
          case 'LIKERT_SCALE':
            row[varName] = this.getOptionIndex(question.options, value) || value;
            break;

          default:
            row[varName] = value;
        }
      }

      data.push(row);
    }

    // Generate SPSS file
    const spssFile = await spss.write({
      variables,
      data,
      fileLabel: survey.title,
    });

    return spssFile;
  }

  /**
   * Export survey responses to R format
   */
  async exportToR(surveyId: string): Promise<Buffer> {
    const survey = await this.getSurveyWithResponses(surveyId);

    // Create archive with data file and codebook
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk) => chunks.push(chunk));

    // Generate CSV data
    const { csvData, variableInfo } = this.buildRExportData(survey);
    archive.append(csvData, { name: 'data.csv' });

    // Generate R codebook/import script
    const rScript = this.generateRScript(survey, variableInfo);
    archive.append(rScript, { name: 'import_data.R' });

    // Generate data dictionary
    const dataDictionary = this.generateDataDictionary(survey, variableInfo);
    archive.append(dataDictionary, { name: 'codebook.txt' });

    await archive.finalize();

    return Buffer.concat(chunks);
  }

  /**
   * Generate R import script with factor definitions
   */
  private generateRScript(survey: any, variableInfo: any[]): string {
    let script = `# PulseGen Survey Data Import Script
# Survey: ${survey.title}
# Exported: ${new Date().toISOString()}

# Load required packages
if (!require("tidyverse")) install.packages("tidyverse")
library(tidyverse)

# Import data
survey_data <- read_csv("data.csv", col_types = cols(
${variableInfo.map(v => `  ${v.name} = ${this.getRColType(v)}`).join(',\n')}
))

# Apply factor levels and labels
`;

    // Add factor definitions
    for (const variable of variableInfo) {
      if (variable.valueLabels && Object.keys(variable.valueLabels).length > 0) {
        const levels = Object.keys(variable.valueLabels);
        const labels = Object.values(variable.valueLabels);

        script += `
survey_data$${variable.name} <- factor(
  survey_data$${variable.name},
  levels = c(${levels.map(l => `"${l}"`).join(', ')}),
  labels = c(${labels.map(l => `"${String(l).replace(/"/g, '\\"')}"`).join(', ')})
)
`;
      }
    }

    script += `
# Variable labels (stored as attributes)
variable_labels <- list(
${variableInfo.map(v => `  ${v.name} = "${v.label.replace(/"/g, '\\"')}"`).join(',\n')}
)

for (var_name in names(variable_labels)) {
  attr(survey_data[[var_name]], "label") <- variable_labels[[var_name]]
}

# Display summary
print("Survey data loaded successfully!")
print(paste("Responses:", nrow(survey_data)))
print(paste("Variables:", ncol(survey_data)))
glimpse(survey_data)
`;

    return script;
  }

  /**
   * Generate data dictionary/codebook
   */
  private generateDataDictionary(survey: any, variableInfo: any[]): string {
    let doc = `CODEBOOK
========

Survey: ${survey.title}
Exported: ${new Date().toISOString()}
Total Responses: ${survey.responses.length}
Total Variables: ${variableInfo.length}

================================================================================
VARIABLE DEFINITIONS
================================================================================

`;

    for (const variable of variableInfo) {
      doc += `
Variable: ${variable.name}
Label: ${variable.label}
Type: ${variable.type}
`;

      if (variable.valueLabels && Object.keys(variable.valueLabels).length > 0) {
        doc += `Value Labels:\n`;
        for (const [value, label] of Object.entries(variable.valueLabels)) {
          doc += `  ${value} = ${label}\n`;
        }
      }

      doc += `--------------------------------------------------------------------------------\n`;
    }

    return doc;
  }

  // Helper methods
  private cleanVariableName(id: string, text?: string): string {
    // SPSS variable names: max 64 chars, start with letter, only letters/numbers/underscore
    let name = text
      ? text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)
      : id;

    // Ensure starts with letter
    if (!/^[a-zA-Z]/.test(name)) {
      name = 'Q_' + name;
    }

    // Remove consecutive underscores
    name = name.replace(/_+/g, '_').replace(/_$/, '');

    return name.substring(0, 64);
  }

  private truncateLabel(text: string, maxLength: number = 255): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  private buildValueLabels(options: any[]): Record<number, string> {
    const labels: Record<number, string> = {};
    options?.forEach((opt, index) => {
      labels[index + 1] = opt.text || opt.label || `Option ${index + 1}`;
    });
    return labels;
  }

  private buildLikertLabels(settings: any): Record<number, string> {
    const scale = settings?.scale || 5;
    const labels: Record<number, string> = {};

    const defaultLabels: Record<number, string[]> = {
      5: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
      7: ['Strongly Disagree', 'Disagree', 'Somewhat Disagree', 'Neutral', 'Somewhat Agree', 'Agree', 'Strongly Agree'],
    };

    const scaleLabels = settings?.labels || defaultLabels[scale] || [];
    scaleLabels.forEach((label: string, index: number) => {
      labels[index + 1] = label;
    });

    return labels;
  }

  private getOptionIndex(options: any[], value: any): number | null {
    if (!options) return null;
    const index = options.findIndex(
      opt => opt.id === value || opt.text === value || opt.value === value
    );
    return index >= 0 ? index + 1 : null;
  }

  private getRColType(variable: any): string {
    switch (variable.type) {
      case 'numeric':
        return 'col_double()';
      case 'string':
        return 'col_character()';
      case 'date':
        return 'col_date()';
      case 'datetime':
        return 'col_datetime()';
      default:
        return 'col_guess()';
    }
  }

  private parseAnswerValue(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private findQuestion(survey: any, questionId: string): any {
    for (const page of survey.pages) {
      const question = page.questions.find((q: any) => q.id === questionId);
      if (question) return question;
    }
    return null;
  }

  private async getSurveyWithResponses(surveyId: string) {
    return prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        pages: {
          include: {
            questions: {
              include: { options: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        responses: {
          where: { isComplete: true },
          include: {
            answers: true,
          },
          orderBy: { completedAt: 'desc' },
        },
      },
    });
  }

  private buildRExportData(survey: any): { csvData: string; variableInfo: any[] } {
    // Implementation similar to SPSS but outputting CSV
    // Returns CSV string and variable metadata
    const variableInfo: any[] = [];
    const data: any[] = [];

    // ... build data similar to SPSS method ...

    const csvData = json2csv(data, {
      fields: variableInfo.map(v => v.name),
    });

    return { csvData, variableInfo };
  }
}

export const statisticalExportService = new StatisticalExportService();
```

### 3. API Endpoints

**Add to `backend/src/routes/exportRoutes.ts`:**

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { statisticalExportService } from '../services/exportService';

const router = Router();

// Export to SPSS
router.get('/surveys/:surveyId/export/spss', authenticate, async (req, res) => {
  try {
    const buffer = await statisticalExportService.exportToSPSS(req.params.surveyId);

    res.setHeader('Content-Type', 'application/x-spss-sav');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="survey-${req.params.surveyId}.sav"`
    );
    res.send(buffer);
  } catch (error) {
    console.error('SPSS export error:', error);
    res.status(500).json({ error: 'Failed to generate SPSS export' });
  }
});

// Export to R
router.get('/surveys/:surveyId/export/r', authenticate, async (req, res) => {
  try {
    const buffer = await statisticalExportService.exportToR(req.params.surveyId);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="survey-${req.params.surveyId}-R.zip"`
    );
    res.send(buffer);
  } catch (error) {
    console.error('R export error:', error);
    res.status(500).json({ error: 'Failed to generate R export' });
  }
});

export default router;
```

### 4. Frontend Integration

**Add export buttons to analytics page:**

```typescript
// In SurveyAnalytics.tsx

<div className="flex gap-2">
  <button
    onClick={() => downloadExport('csv')}
    className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50"
  >
    <FileSpreadsheet className="w-4 h-4" />
    CSV
  </button>

  <button
    onClick={() => downloadExport('excel')}
    className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50"
  >
    <FileSpreadsheet className="w-4 h-4" />
    Excel
  </button>

  <button
    onClick={() => downloadExport('spss')}
    className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50"
  >
    <FileCode className="w-4 h-4" />
    SPSS
  </button>

  <button
    onClick={() => downloadExport('r')}
    className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50"
  >
    <FileCode className="w-4 h-4" />
    R
  </button>

  <button
    onClick={() => downloadExport('pdf')}
    className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50"
  >
    <FileText className="w-4 h-4" />
    PDF Report
  </button>
</div>
```

---

## Acceptance Criteria

### SPSS Export
- [ ] Generates valid .sav file that opens in SPSS
- [ ] Variable names follow SPSS conventions
- [ ] Variable labels contain question text
- [ ] Value labels for choice questions
- [ ] Numeric types for scales and ratings
- [ ] String types for text responses
- [ ] Date/time types handled correctly
- [ ] Matrix questions expand to multiple variables
- [ ] Checkbox questions create binary indicators
- [ ] Ranking questions create rank variables
- [ ] Unicode text preserved
- [ ] Long text responses supported

### R Export
- [ ] ZIP file contains data.csv, import_data.R, codebook.txt
- [ ] R script successfully imports and labels data
- [ ] Factor levels correctly defined
- [ ] Variable labels as attributes
- [ ] Codebook documents all variables
- [ ] Works in R 4.0+

### General
- [ ] Handles surveys with 100+ questions
- [ ] Handles 10,000+ responses
- [ ] Background job for large exports
- [ ] Progress tracking for large exports
- [ ] Error handling for malformed data

---

## Files to Create/Modify

### New Files
- `backend/src/services/statisticalExportService.ts`

### Modified Files
- `backend/src/routes/exportRoutes.ts`
- `backend/package.json` - Add spssify dependency
- `frontend/src/pages/SurveyAnalytics.tsx` - Add export buttons

---

## Dependencies

- `spssify` npm package for SPSS generation
- `json2csv` for CSV generation
- `archiver` for ZIP creation

---

## Testing

Test with:
1. IBM SPSS Statistics
2. PSPP (free SPSS alternative)
3. R / RStudio
4. jamovi (free statistics software)
