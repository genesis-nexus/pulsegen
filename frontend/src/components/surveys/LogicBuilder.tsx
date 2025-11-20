import { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import {
  Question,
  SurveyLogic,
  LogicType,
  ConditionOperator,
  LogicAction,
  LogicCondition,
  LogicActionData,
} from '../../types';

interface LogicBuilderProps {
  question: Question;
  allQuestions: Question[];
  existingLogic?: SurveyLogic[];
  onSave: (logic: Partial<SurveyLogic>) => void;
  onDelete: (logicId: string) => void;
  onClose: () => void;
}

const CONDITION_OPERATORS = [
  { value: ConditionOperator.EQUALS, label: 'Equals' },
  { value: ConditionOperator.NOT_EQUALS, label: 'Not Equals' },
  { value: ConditionOperator.CONTAINS, label: 'Contains' },
  { value: ConditionOperator.NOT_CONTAINS, label: 'Not Contains' },
  { value: ConditionOperator.GREATER_THAN, label: 'Greater Than' },
  { value: ConditionOperator.LESS_THAN, label: 'Less Than' },
  { value: ConditionOperator.IS_ANSWERED, label: 'Is Answered' },
  { value: ConditionOperator.IS_NOT_ANSWERED, label: 'Is Not Answered' },
];

const LOGIC_ACTIONS = [
  { value: LogicAction.SKIP_TO_QUESTION, label: 'Skip to Question' },
  { value: LogicAction.SKIP_TO_END, label: 'Skip to End' },
  { value: LogicAction.SHOW_QUESTION, label: 'Show Question' },
  { value: LogicAction.HIDE_QUESTION, label: 'Hide Question' },
];

export default function LogicBuilder({
  question,
  allQuestions,
  existingLogic,
  onSave,
  onDelete,
  onClose,
}: LogicBuilderProps) {
  const [logicType, setLogicType] = useState<LogicType>(LogicType.SKIP_LOGIC);
  const [conditions, setConditions] = useState<LogicCondition[]>([
    {
      questionId: question.id,
      operator: ConditionOperator.EQUALS,
      value: '',
    },
  ]);
  const [action, setAction] = useState<LogicActionData>({
    action: LogicAction.SKIP_TO_QUESTION,
  });

  // Get questions that come after the current question
  const targetQuestions = allQuestions.filter((q) => q.order > question.order);

  // Get the selected question for condition
  const selectedConditionQuestion = allQuestions.find(
    (q) => q.id === conditions[0]?.questionId
  );

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      {
        questionId: question.id,
        operator: ConditionOperator.EQUALS,
        value: '',
      },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (
    index: number,
    field: keyof LogicCondition,
    value: any
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const handleSave = () => {
    const logic: Partial<SurveyLogic> = {
      sourceQuestionId: question.id,
      targetQuestionId: action.targetQuestionId,
      type: logicType,
      conditions,
      actions: action,
    };

    onSave(logic);
  };

  const needsValue = (operator: ConditionOperator) => {
    return (
      operator !== ConditionOperator.IS_ANSWERED &&
      operator !== ConditionOperator.IS_NOT_ANSWERED
    );
  };

  const renderValueInput = (condition: LogicCondition, index: number) => {
    const conditionQuestion = allQuestions.find((q) => q.id === condition.questionId);

    if (!needsValue(condition.operator)) {
      return null;
    }

    // If question has options, show dropdown
    if (conditionQuestion?.options && conditionQuestion.options.length > 0) {
      return (
        <select
          className="input"
          value={condition.value as string}
          onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
        >
          <option value="">Select value...</option>
          {conditionQuestion.options.map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.text}
            </option>
          ))}
        </select>
      );
    }

    // Otherwise show text input
    return (
      <input
        type="text"
        className="input"
        placeholder="Enter value..."
        value={condition.value as string}
        onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Configure Skip Logic</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Logic Type */}
            <div>
              <label className="label">Logic Type</label>
              <select
                className="input"
                value={logicType}
                onChange={(e) => setLogicType(e.target.value as LogicType)}
              >
                <option value={LogicType.SKIP_LOGIC}>Skip Logic</option>
                <option value={LogicType.BRANCHING}>Branching</option>
                <option value={LogicType.DISPLAY_LOGIC}>Display Logic</option>
              </select>
            </div>

            {/* Source Question Info */}
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Configure logic for:
              </p>
              <p className="text-gray-900">{question.text}</p>
            </div>

            {/* Conditions */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="label">Conditions</label>
                <button
                  onClick={handleAddCondition}
                  className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Condition
                </button>
              </div>

              <div className="space-y-3">
                {conditions.map((condition, index) => (
                  <div key={index} className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Condition {index + 1}
                      </span>
                      {conditions.length > 1 && (
                        <button
                          onClick={() => handleRemoveCondition(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">
                          If this answer
                        </label>
                        <select
                          className="input"
                          value={condition.questionId}
                          onChange={(e) =>
                            handleConditionChange(index, 'questionId', e.target.value)
                          }
                        >
                          {allQuestions.map((q) => (
                            <option key={q.id} value={q.id}>
                              {q.text.substring(0, 50)}
                              {q.text.length > 50 ? '...' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">
                          Operator
                        </label>
                        <select
                          className="input"
                          value={condition.operator}
                          onChange={(e) =>
                            handleConditionChange(
                              index,
                              'operator',
                              e.target.value as ConditionOperator
                            )
                          }
                        >
                          {CONDITION_OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {needsValue(condition.operator) && (
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            Value
                          </label>
                          {renderValueInput(condition, index)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <label className="label">Then...</label>
              <div className="space-y-3">
                <select
                  className="input"
                  value={action.action}
                  onChange={(e) =>
                    setAction({ ...action, action: e.target.value as LogicAction })
                  }
                >
                  {LOGIC_ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>

                {(action.action === LogicAction.SKIP_TO_QUESTION ||
                  action.action === LogicAction.SHOW_QUESTION ||
                  action.action === LogicAction.HIDE_QUESTION) && (
                  <select
                    className="input"
                    value={action.targetQuestionId || ''}
                    onChange={(e) =>
                      setAction({ ...action, targetQuestionId: e.target.value })
                    }
                  >
                    <option value="">Select question...</option>
                    {targetQuestions.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.text.substring(0, 60)}
                        {q.text.length > 60 ? '...' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Existing Logic Rules */}
            {existingLogic && existingLogic.length > 0 && (
              <div>
                <label className="label">Existing Logic Rules</label>
                <div className="space-y-2">
                  {existingLogic.map((logic) => (
                    <div
                      key={logic.id}
                      className="border border-gray-200 rounded p-3 flex justify-between items-center"
                    >
                      <div className="text-sm">
                        <span className="font-medium">{logic.type}</span>
                        <span className="text-gray-600 ml-2">
                          {logic.conditions.length} condition(s)
                        </span>
                      </div>
                      <button
                        onClick={() => onDelete(logic.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary inline-flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Save Logic Rule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
