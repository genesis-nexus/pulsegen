import { useState } from 'react';
import toast from 'react-hot-toast';
import { CornerDownRight, GitBranch, Loader2, Plus, Trash2 } from 'lucide-react';
import api from '../../../lib/api';
import {
  ConditionOperator,
  LogicAction,
  LogicType,
  Question,
  QuestionType,
  SurveyLogic,
} from '../../../types';

interface LogicRulesPanelProps {
  surveyId: string;
  question: Question;
  questions: Question[];
  onLogicChanged: (questionId: string, logic: SurveyLogic[]) => void;
  /** Vertical layout for narrow containers like the property inspector. */
  compact?: boolean;
}

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  [ConditionOperator.EQUALS]: 'is',
  [ConditionOperator.NOT_EQUALS]: 'is not',
  [ConditionOperator.CONTAINS]: 'contains',
  [ConditionOperator.NOT_CONTAINS]: 'does not contain',
  [ConditionOperator.GREATER_THAN]: 'is greater than',
  [ConditionOperator.LESS_THAN]: 'is less than',
  [ConditionOperator.IS_ANSWERED]: 'is answered',
  [ConditionOperator.IS_NOT_ANSWERED]: 'is not answered',
};

const ACTION_LABELS: Record<LogicAction, string> = {
  [LogicAction.SKIP_TO_QUESTION]: 'Skip to question',
  [LogicAction.SKIP_TO_END]: 'Skip to end of survey',
  [LogicAction.SHOW_QUESTION]: 'Show question',
  [LogicAction.HIDE_QUESTION]: 'Hide question',
};

const NO_VALUE_OPERATORS = [
  ConditionOperator.IS_ANSWERED,
  ConditionOperator.IS_NOT_ANSWERED,
];

const OPTION_QUESTION_TYPES = [
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.CHECKBOXES,
  QuestionType.DROPDOWN,
  QuestionType.LIKERT_SCALE,
  QuestionType.RANKING,
  QuestionType.IMAGE_SELECT,
];

const NUMERIC_QUESTION_TYPES = [
  QuestionType.NPS,
  QuestionType.RATING_SCALE,
  QuestionType.NUMBER,
  QuestionType.SLIDER,
];

/** Which logic type a rule belongs to, derived from its action. */
function logicTypeForAction(action: LogicAction): LogicType {
  return action === LogicAction.SHOW_QUESTION || action === LogicAction.HIDE_QUESTION
    ? LogicType.DISPLAY_LOGIC
    : LogicType.SKIP_LOGIC;
}

function rulePayload(rule: SurveyLogic) {
  return {
    sourceQuestionId: rule.sourceQuestionId,
    targetQuestionId: rule.actions?.targetQuestionId || undefined,
    type: logicTypeForAction(rule.actions.action),
    conditions: rule.conditions.map((c) => ({
      questionId: c.questionId,
      operator: c.operator,
      value: c.value === '' || c.value === undefined ? undefined : c.value,
    })),
    actions: {
      action: rule.actions.action,
      targetQuestionId: rule.actions.targetQuestionId || undefined,
    },
  };
}

export default function LogicRulesPanel({
  surveyId,
  question,
  questions,
  onLogicChanged,
  compact = false,
}: LogicRulesPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const rules = question.logic || [];

  const questionIndex = questions.findIndex((q) => q.id === question.id);
  const skipTargets = questions.slice(questionIndex + 1);
  const displayTargets = questions.filter((q) => q.id !== question.id);

  const handleAddRule = async () => {
    setIsAdding(true);
    try {
      const newRule = {
        sourceQuestionId: question.id,
        type: LogicType.SKIP_LOGIC,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.IS_ANSWERED,
          },
        ],
        actions: { action: LogicAction.SKIP_TO_END },
      };
      const response = await api.post(`/surveys/${surveyId}/logic`, newRule);
      onLogicChanged(question.id, [...rules, response.data.data as SurveyLogic]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add logic rule');
    } finally {
      setIsAdding(false);
    }
  };

  const persistRule = async (rule: SurveyLogic) => {
    try {
      await api.put(`/surveys/logic/${rule.id}`, rulePayload(rule));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save logic rule');
    }
  };

  /** Apply updates locally, then persist. Selects persist immediately; text inputs on blur. */
  const updateRule = (
    ruleId: string,
    updates: Partial<SurveyLogic>,
    persist = true
  ) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r));
    onLogicChanged(question.id, updated);
    if (persist) {
      const rule = updated.find((r) => r.id === ruleId);
      if (rule) persistRule(rule);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    onLogicChanged(question.id, rules.filter((r) => r.id !== ruleId));
    try {
      await api.delete(`/surveys/logic/${ruleId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete logic rule');
    }
  };

  const selectClass =
    'text-sm rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1.5';

  const renderValueInput = (rule: SurveyLogic) => {
    const condition = rule.conditions[0];
    if (!condition || NO_VALUE_OPERATORS.includes(condition.operator)) return null;

    const setValue = (value: string | number, persist: boolean) =>
      updateRule(
        rule.id,
        { conditions: [{ ...condition, value }] },
        persist
      );

    if (OPTION_QUESTION_TYPES.includes(question.type) && question.options.length > 0) {
      return (
        <select
          className={`${selectClass} ${compact ? 'w-full' : 'flex-1 min-w-[10rem]'}`}
          value={String(condition.value ?? '')}
          onChange={(e) => setValue(e.target.value, true)}
        >
          <option value="">Select option...</option>
          {question.options.map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.text}
            </option>
          ))}
        </select>
      );
    }

    if (question.type === QuestionType.YES_NO) {
      return (
        <select
          className={`${selectClass} ${compact ? 'w-full' : 'flex-1 min-w-[10rem]'}`}
          value={String(condition.value ?? '')}
          onChange={(e) => setValue(e.target.value, true)}
        >
          <option value="">Select...</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      );
    }

    if (NUMERIC_QUESTION_TYPES.includes(question.type)) {
      return (
        <input
          type="number"
          className={`${selectClass} ${compact ? 'w-full' : 'w-28'}`}
          value={condition.value === undefined ? '' : String(condition.value)}
          onChange={(e) =>
            setValue(e.target.value === '' ? '' : Number(e.target.value), false)
          }
          onBlur={() => {
            const rule2 = rules.find((r) => r.id === rule.id);
            if (rule2) persistRule(rule2);
          }}
          placeholder="Value"
        />
      );
    }

    return (
      <input
        type="text"
        className={`${selectClass} ${compact ? 'w-full' : 'flex-1 min-w-[10rem]'}`}
        value={String(condition.value ?? '')}
        onChange={(e) => setValue(e.target.value, false)}
        onBlur={() => {
          const rule2 = rules.find((r) => r.id === rule.id);
          if (rule2) persistRule(rule2);
        }}
        placeholder="Value"
      />
    );
  };

  return (
    <div className="space-y-3">
      {rules.map((rule, index) => {
        const condition = rule.conditions[0];
        const action = rule.actions?.action || LogicAction.SKIP_TO_END;
        const needsTarget = action !== LogicAction.SKIP_TO_END;
        const targets = action === LogicAction.SKIP_TO_QUESTION ? skipTargets : displayTargets;

        return (
          <div
            key={rule.id}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 shadow-sm"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="inline-flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <GitBranch className="w-3.5 h-3.5 mr-1.5" />
                Rule {index + 1}
              </span>
              <button
                onClick={() => handleDeleteRule(rule.id)}
                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-0.5"
                title="Delete rule"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* IF: condition */}
            <div className={`${compact ? 'space-y-2' : 'flex items-center gap-2 flex-wrap'} mb-3`}>
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 w-9 shrink-0">
                IF
              </span>
              <span className={`text-sm text-slate-600 dark:text-slate-300 ${compact ? 'block' : ''}`}>
                this answer
              </span>
              <select
                className={`${selectClass} ${compact ? 'w-full' : ''}`}
                value={condition?.operator || ConditionOperator.IS_ANSWERED}
                onChange={(e) =>
                  updateRule(rule.id, {
                    conditions: [
                      {
                        questionId: question.id,
                        operator: e.target.value as ConditionOperator,
                        value: condition?.value,
                      },
                    ],
                  })
                }
              >
                {Object.entries(OPERATOR_LABELS).map(([op, label]) => (
                  <option key={op} value={op}>
                    {label}
                  </option>
                ))}
              </select>
              {renderValueInput(rule)}
            </div>

            {/* THEN: action */}
            <div className={compact ? 'space-y-2' : 'flex items-center gap-2 flex-wrap'}>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 w-9 shrink-0 inline-flex items-center">
                <CornerDownRight className="w-3.5 h-3.5 mr-1" />
                THEN
              </span>
              <select
                className={`${selectClass} ${compact ? 'w-full' : ''}`}
                value={action}
                onChange={(e) => {
                  const newAction = e.target.value as LogicAction;
                  updateRule(rule.id, {
                    type: logicTypeForAction(newAction),
                    actions: {
                      action: newAction,
                      targetQuestionId:
                        newAction === LogicAction.SKIP_TO_END
                          ? undefined
                          : rule.actions?.targetQuestionId,
                    },
                  });
                }}
              >
                {Object.entries(ACTION_LABELS).map(([act, label]) => (
                  <option key={act} value={act}>
                    {label}
                  </option>
                ))}
              </select>

              {needsTarget && (
                <select
                  className={`${selectClass} ${compact ? 'w-full' : 'flex-1 min-w-[12rem]'}`}
                  value={rule.actions?.targetQuestionId || ''}
                  onChange={(e) =>
                    updateRule(rule.id, {
                      actions: { ...rule.actions, targetQuestionId: e.target.value || undefined },
                    })
                  }
                >
                  <option value="">Select question...</option>
                  {targets.map((q) => {
                    const number = questions.findIndex((qq) => qq.id === q.id) + 1;
                    const label = q.text.length > 40 ? `${q.text.slice(0, 40)}...` : q.text;
                    return (
                      <option key={q.id} value={q.id}>
                        {number}. {label || 'Untitled'}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>
        );
      })}

      {rules.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-3">
          No logic rules yet. Rules let you skip, show, or hide questions based on this answer.
        </p>
      )}

      <button
        onClick={handleAddRule}
        disabled={isAdding}
        className="w-full flex items-center justify-center px-4 py-2 border border-dashed border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        {isAdding ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Plus className="w-4 h-4 mr-2" />
        )}
        Add logic rule
      </button>
    </div>
  );
}
