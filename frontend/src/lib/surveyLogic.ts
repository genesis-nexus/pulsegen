import {
  ConditionOperator,
  LogicAction,
  LogicCondition,
  Question,
  SurveyLogic,
} from '../types';

/**
 * Client-side evaluation of survey logic rules.
 *
 * Answer values come from the take-survey answer map, where choice questions
 * store option IDs (or arrays of option IDs for checkboxes) while logic rules
 * may reference options by id, stored value, or display text. All comparisons
 * therefore normalize an answer to the full set of identifiers it could match.
 */

function isEmptyAnswer(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** All string representations an answered value can match (id, value, text). */
function answerCandidates(question: Question | undefined, raw: unknown): string[] {
  const values = Array.isArray(raw) ? raw : [raw];
  const candidates: string[] = [];
  for (const v of values) {
    if (v === undefined || v === null) continue;
    const str = String(v);
    candidates.push(str);
    const option = question?.options?.find((o) => o.id === str || o.value === str);
    if (option) {
      candidates.push(option.value, option.text);
    }
  }
  return candidates;
}

export function evaluateCondition(
  condition: LogicCondition,
  answers: Record<string, unknown>,
  questionsById: Map<string, Question>
): boolean {
  const raw = answers[condition.questionId];
  const answered = !isEmptyAnswer(raw);

  switch (condition.operator) {
    case ConditionOperator.IS_ANSWERED:
      return answered;
    case ConditionOperator.IS_NOT_ANSWERED:
      return !answered;
    default:
      break;
  }

  if (!answered) return false;

  const question = questionsById.get(condition.questionId);
  const expected = condition.value;
  const expectedStr = String(expected ?? '').trim();
  const candidates = answerCandidates(question, raw).map((c) => c.trim());

  switch (condition.operator) {
    case ConditionOperator.EQUALS:
      return candidates.some((c) => c.toLowerCase() === expectedStr.toLowerCase());
    case ConditionOperator.NOT_EQUALS:
      return !candidates.some((c) => c.toLowerCase() === expectedStr.toLowerCase());
    case ConditionOperator.CONTAINS:
      return candidates.some((c) => c.toLowerCase().includes(expectedStr.toLowerCase()));
    case ConditionOperator.NOT_CONTAINS:
      return !candidates.some((c) => c.toLowerCase().includes(expectedStr.toLowerCase()));
    case ConditionOperator.GREATER_THAN: {
      const answerNum = Number(Array.isArray(raw) ? raw[0] : raw);
      const expectedNum = Number(expected);
      return !Number.isNaN(answerNum) && !Number.isNaN(expectedNum) && answerNum > expectedNum;
    }
    case ConditionOperator.LESS_THAN: {
      const answerNum = Number(Array.isArray(raw) ? raw[0] : raw);
      const expectedNum = Number(expected);
      return !Number.isNaN(answerNum) && !Number.isNaN(expectedNum) && answerNum < expectedNum;
    }
    default:
      return false;
  }
}

function ruleMatches(
  rule: SurveyLogic,
  answers: Record<string, unknown>,
  questionsById: Map<string, Question>
): boolean {
  if (!rule.conditions || rule.conditions.length === 0) return false;
  return rule.conditions.every((condition) =>
    evaluateCondition(condition, answers, questionsById)
  );
}

/**
 * Compute which questions should be hidden from the respondent given the
 * current answers.
 *
 * - SKIP_TO_QUESTION hides every question between the source and the target.
 * - SKIP_TO_END hides every question after the source.
 * - SHOW_QUESTION targets are hidden unless at least one of their show rules matches.
 * - HIDE_QUESTION hides its target while the conditions match.
 *
 * Rules whose source question is itself hidden do not fire.
 */
export function getHiddenQuestionIds(
  questions: Question[],
  answers: Record<string, unknown>
): Set<string> {
  const hidden = new Set<string>();
  const questionsById = new Map(questions.map((q) => [q.id, q]));
  const indexById = new Map(questions.map((q, i) => [q.id, i]));

  // SHOW_QUESTION targets are hidden by default until a show rule matches.
  const showTargets = new Map<string, boolean>();
  for (const question of questions) {
    for (const rule of question.logic || []) {
      const action = rule.actions?.action;
      const targetId = rule.actions?.targetQuestionId || rule.targetQuestionId;
      if (action === LogicAction.SHOW_QUESTION && targetId) {
        if (!showTargets.has(targetId)) showTargets.set(targetId, false);
      }
    }
  }

  for (const question of questions) {
    if (hidden.has(question.id)) continue;

    for (const rule of question.logic || []) {
      const action = rule.actions?.action;
      if (!action) continue;
      const targetId = rule.actions?.targetQuestionId || rule.targetQuestionId;
      const matches = ruleMatches(rule, answers, questionsById);
      if (!matches) continue;

      const sourceIndex = indexById.get(question.id) ?? -1;

      if (action === LogicAction.SKIP_TO_END) {
        for (let i = sourceIndex + 1; i < questions.length; i++) {
          hidden.add(questions[i].id);
        }
      } else if (action === LogicAction.SKIP_TO_QUESTION && targetId) {
        const targetIndex = indexById.get(targetId) ?? -1;
        if (targetIndex > sourceIndex) {
          for (let i = sourceIndex + 1; i < targetIndex; i++) {
            hidden.add(questions[i].id);
          }
        }
      } else if (action === LogicAction.HIDE_QUESTION && targetId) {
        hidden.add(targetId);
      } else if (action === LogicAction.SHOW_QUESTION && targetId) {
        showTargets.set(targetId, true);
      }
    }
  }

  for (const [targetId, shown] of showTargets) {
    if (!shown) hidden.add(targetId);
  }

  return hidden;
}

/** Questions that remain visible to the respondent, in order. */
export function getActiveQuestions(
  questions: Question[],
  answers: Record<string, unknown>
): Question[] {
  const hidden = getHiddenQuestionIds(questions, answers);
  return questions.filter((q) => !hidden.has(q.id));
}
