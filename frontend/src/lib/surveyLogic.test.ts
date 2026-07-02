import { describe, it, expect } from 'vitest';
import {
  evaluateCondition,
  getActiveQuestions,
  getHiddenQuestionIds,
} from './surveyLogic';
import {
  ConditionOperator,
  LogicAction,
  LogicType,
  Question,
  QuestionType,
  SurveyLogic,
} from '../types';

function makeQuestion(
  id: string,
  overrides: Partial<Question> = {}
): Question {
  return {
    id,
    surveyId: 's1',
    type: QuestionType.SHORT_TEXT,
    text: `Question ${id}`,
    order: 0,
    isRequired: false,
    isRandomized: false,
    options: [],
    logic: [],
    ...overrides,
  };
}

function makeRule(
  sourceQuestionId: string,
  overrides: Partial<SurveyLogic> = {}
): SurveyLogic {
  return {
    id: `rule-${sourceQuestionId}`,
    surveyId: 's1',
    sourceQuestionId,
    type: LogicType.SKIP_LOGIC,
    conditions: [],
    actions: { action: LogicAction.SKIP_TO_END },
    ...overrides,
  };
}

const choiceQuestion = makeQuestion('q1', {
  type: QuestionType.MULTIPLE_CHOICE,
  options: [
    { id: 'opt-yes', questionId: 'q1', text: 'Yes', value: 'yes', order: 0 },
    { id: 'opt-no', questionId: 'q1', text: 'No', value: 'no', order: 1 },
  ],
});

const questionsById = new Map([[choiceQuestion.id, choiceQuestion]]);

describe('evaluateCondition', () => {
  it('matches EQUALS against an option id, value, or text', () => {
    const condition = {
      questionId: 'q1',
      operator: ConditionOperator.EQUALS,
      value: 'yes',
    };
    // Answer stored as option id (how the take page stores radio answers)
    expect(evaluateCondition(condition, { q1: 'opt-yes' }, questionsById)).toBe(true);
    // Answer stored as raw value
    expect(evaluateCondition(condition, { q1: 'yes' }, questionsById)).toBe(true);
    // Rule value referencing display text
    expect(
      evaluateCondition(
        { ...condition, value: 'Yes' },
        { q1: 'opt-yes' },
        questionsById
      )
    ).toBe(true);
    expect(evaluateCondition(condition, { q1: 'opt-no' }, questionsById)).toBe(false);
  });

  it('handles NOT_EQUALS and unanswered questions', () => {
    const condition = {
      questionId: 'q1',
      operator: ConditionOperator.NOT_EQUALS,
      value: 'yes',
    };
    expect(evaluateCondition(condition, { q1: 'opt-no' }, questionsById)).toBe(true);
    // Unanswered → comparison conditions never match
    expect(evaluateCondition(condition, {}, questionsById)).toBe(false);
  });

  it('matches CONTAINS case-insensitively on text answers', () => {
    const condition = {
      questionId: 'q2',
      operator: ConditionOperator.CONTAINS,
      value: 'great',
    };
    expect(
      evaluateCondition(condition, { q2: 'This was a GREAT experience' }, new Map())
    ).toBe(true);
    expect(evaluateCondition(condition, { q2: 'terrible' }, new Map())).toBe(false);
  });

  it('compares numbers for GREATER_THAN and LESS_THAN', () => {
    const gt = { questionId: 'q3', operator: ConditionOperator.GREATER_THAN, value: 18 };
    const lt = { questionId: 'q3', operator: ConditionOperator.LESS_THAN, value: 18 };
    expect(evaluateCondition(gt, { q3: 25 }, new Map())).toBe(true);
    expect(evaluateCondition(gt, { q3: 16 }, new Map())).toBe(false);
    expect(evaluateCondition(lt, { q3: 16 }, new Map())).toBe(true);
    // Non-numeric answers never match numeric comparisons
    expect(evaluateCondition(gt, { q3: 'abc' }, new Map())).toBe(false);
  });

  it('handles IS_ANSWERED and IS_NOT_ANSWERED including arrays', () => {
    const answered = { questionId: 'q4', operator: ConditionOperator.IS_ANSWERED };
    const notAnswered = { questionId: 'q4', operator: ConditionOperator.IS_NOT_ANSWERED };
    expect(evaluateCondition(answered, { q4: 'hi' }, new Map())).toBe(true);
    expect(evaluateCondition(answered, { q4: [] }, new Map())).toBe(false);
    expect(evaluateCondition(answered, { q4: ['a'] }, new Map())).toBe(true);
    expect(evaluateCondition(notAnswered, {}, new Map())).toBe(true);
  });

  it('matches checkbox answers stored as arrays of option ids', () => {
    const condition = {
      questionId: 'q1',
      operator: ConditionOperator.EQUALS,
      value: 'no',
    };
    expect(
      evaluateCondition(condition, { q1: ['opt-yes', 'opt-no'] }, questionsById)
    ).toBe(true);
    expect(evaluateCondition(condition, { q1: ['opt-yes'] }, questionsById)).toBe(false);
  });
});

describe('getHiddenQuestionIds', () => {
  it('hides questions between source and target for SKIP_TO_QUESTION', () => {
    const q1 = makeQuestion('q1', {
      ...choiceQuestion,
      logic: [
        makeRule('q1', {
          conditions: [
            { questionId: 'q1', operator: ConditionOperator.EQUALS, value: 'no' },
          ],
          actions: { action: LogicAction.SKIP_TO_QUESTION, targetQuestionId: 'q4' },
        }),
      ],
    });
    const questions = [q1, makeQuestion('q2'), makeQuestion('q3'), makeQuestion('q4')];

    // Condition not met → nothing hidden
    expect(getHiddenQuestionIds(questions, { q1: 'opt-yes' }).size).toBe(0);

    // Condition met → q2 and q3 hidden, target q4 still visible
    const hidden = getHiddenQuestionIds(questions, { q1: 'opt-no' });
    expect(hidden.has('q2')).toBe(true);
    expect(hidden.has('q3')).toBe(true);
    expect(hidden.has('q4')).toBe(false);
  });

  it('hides everything after the source for SKIP_TO_END', () => {
    const q1 = makeQuestion('q1', {
      ...choiceQuestion,
      logic: [
        makeRule('q1', {
          conditions: [
            { questionId: 'q1', operator: ConditionOperator.EQUALS, value: 'no' },
          ],
          actions: { action: LogicAction.SKIP_TO_END },
        }),
      ],
    });
    const questions = [q1, makeQuestion('q2'), makeQuestion('q3')];
    const hidden = getHiddenQuestionIds(questions, { q1: 'opt-no' });
    expect(hidden.has('q2')).toBe(true);
    expect(hidden.has('q3')).toBe(true);
  });

  it('hides SHOW_QUESTION targets until their condition matches', () => {
    const q1 = makeQuestion('q1', {
      ...choiceQuestion,
      logic: [
        makeRule('q1', {
          type: LogicType.DISPLAY_LOGIC,
          conditions: [
            { questionId: 'q1', operator: ConditionOperator.EQUALS, value: 'yes' },
          ],
          actions: { action: LogicAction.SHOW_QUESTION, targetQuestionId: 'q2' },
        }),
      ],
    });
    const questions = [q1, makeQuestion('q2'), makeQuestion('q3')];

    // Not answered yet → follow-up hidden
    expect(getHiddenQuestionIds(questions, {}).has('q2')).toBe(true);
    // Condition met → follow-up shown
    expect(getHiddenQuestionIds(questions, { q1: 'opt-yes' }).has('q2')).toBe(false);
    // Different answer → follow-up hidden again
    expect(getHiddenQuestionIds(questions, { q1: 'opt-no' }).has('q2')).toBe(true);
  });

  it('hides HIDE_QUESTION targets while the condition matches', () => {
    const q1 = makeQuestion('q1', {
      ...choiceQuestion,
      logic: [
        makeRule('q1', {
          type: LogicType.DISPLAY_LOGIC,
          conditions: [
            { questionId: 'q1', operator: ConditionOperator.EQUALS, value: 'yes' },
          ],
          actions: { action: LogicAction.HIDE_QUESTION, targetQuestionId: 'q3' },
        }),
      ],
    });
    const questions = [q1, makeQuestion('q2'), makeQuestion('q3')];
    expect(getHiddenQuestionIds(questions, { q1: 'opt-yes' }).has('q3')).toBe(true);
    expect(getHiddenQuestionIds(questions, { q1: 'opt-no' }).has('q3')).toBe(false);
  });

  it('does not fire rules whose source question is hidden', () => {
    // q1 skips over q2; q2 has a rule that would hide q3, but q2 is hidden.
    const q1 = makeQuestion('q1', {
      ...choiceQuestion,
      logic: [
        makeRule('q1', {
          conditions: [
            { questionId: 'q1', operator: ConditionOperator.EQUALS, value: 'no' },
          ],
          actions: { action: LogicAction.SKIP_TO_QUESTION, targetQuestionId: 'q3' },
        }),
      ],
    });
    const q2 = makeQuestion('q2', {
      logic: [
        makeRule('q2', {
          type: LogicType.DISPLAY_LOGIC,
          conditions: [
            { questionId: 'q2', operator: ConditionOperator.IS_NOT_ANSWERED },
          ],
          actions: { action: LogicAction.HIDE_QUESTION, targetQuestionId: 'q3' },
        }),
      ],
    });
    const questions = [q1, q2, makeQuestion('q3')];
    const hidden = getHiddenQuestionIds(questions, { q1: 'opt-no' });
    expect(hidden.has('q2')).toBe(true);
    expect(hidden.has('q3')).toBe(false);
  });
});

describe('getActiveQuestions', () => {
  it('returns visible questions in order', () => {
    const q1 = makeQuestion('q1', {
      ...choiceQuestion,
      logic: [
        makeRule('q1', {
          conditions: [
            { questionId: 'q1', operator: ConditionOperator.EQUALS, value: 'no' },
          ],
          actions: { action: LogicAction.SKIP_TO_QUESTION, targetQuestionId: 'q3' },
        }),
      ],
    });
    const questions = [q1, makeQuestion('q2'), makeQuestion('q3')];
    expect(getActiveQuestions(questions, { q1: 'opt-no' }).map((q) => q.id)).toEqual([
      'q1',
      'q3',
    ]);
    expect(getActiveQuestions(questions, {}).map((q) => q.id)).toEqual(['q1', 'q2', 'q3']);
  });
});
