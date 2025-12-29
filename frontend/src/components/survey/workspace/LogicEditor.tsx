import { Question, QuestionType, SurveyLogic, LogicType, LogicCondition, LogicAction, ConditionOperator, LogicActionData } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';

interface LogicEditorProps {
    questions: Question[];
    onUpdateLogic: (questionId: string, logic: SurveyLogic[]) => void;
    selectedQuestionId: string | null;
    onSelectQuestion: (id: string) => void;
}

export default function LogicEditor({
    questions,
    onUpdateLogic,
    selectedQuestionId,
    onSelectQuestion
}: LogicEditorProps) {

    const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

    const handleAddRule = () => {
        if (!selectedQuestionId) return;
        const currentLogic = selectedQuestion?.logic || [];
        const newRule: SurveyLogic = {
            id: crypto.randomUUID(),
            surveyId: selectedQuestion!.surveyId,
            sourceQuestionId: selectedQuestionId, // Use sourceQuestionId
            type: LogicType.SKIP_LOGIC,
            conditions: [{ questionId: selectedQuestionId, operator: ConditionOperator.EQUALS, value: '' }],
            actions: { action: LogicAction.SKIP_TO_QUESTION, targetQuestionId: '' }
        };
        onUpdateLogic(selectedQuestionId, [...currentLogic, newRule]);
    };

    const handleDeleteRule = (ruleId: string) => {
        if (!selectedQuestionId) return;
        const currentLogic = selectedQuestion?.logic || [];
        onUpdateLogic(selectedQuestionId, currentLogic.filter(r => r.id !== ruleId));
    };

    const handleUpdateRule = (ruleId: string, updates: Partial<SurveyLogic>) => {
        if (!selectedQuestionId) return;
        const currentLogic = selectedQuestion?.logic || [];
        onUpdateLogic(selectedQuestionId, currentLogic.map(r => r.id === ruleId ? { ...r, ...updates } : r));
    };

    const updateCondition = (ruleId: string, index: number, field: keyof LogicCondition, value: any) => {
        if (!selectedQuestionId) return;
        const rule = selectedQuestion?.logic?.find(r => r.id === ruleId);
        if (!rule) return;

        const newConditions = [...rule.conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        handleUpdateRule(ruleId, { conditions: newConditions });
    };

    const updateAction = (ruleId: string, field: keyof LogicActionData, value: any) => {
        if (!selectedQuestionId) return;
        const rule = selectedQuestion?.logic?.find(r => r.id === ruleId);
        if (!rule) return;

        const newActions = { ...rule.actions, [field]: value };
        handleUpdateRule(ruleId, { actions: newActions });
    };

    // Helper to get available target questions (must be after current question)
    const getAvailableTargets = (currentQId: string) => {
        const currentIndex = questions.findIndex(q => q.id === currentQId);
        return questions.slice(currentIndex + 1);
    };

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-900">
            {/* Sidebar: Question List */}
            <div className="w-1/4 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-medium text-slate-900 dark:text-white">Select Question</h3>
                </div>
                <div className="p-2">
                    {questions.map((q, index) => (
                        <div
                            key={q.id}
                            onClick={() => onSelectQuestion(q.id)}
                            className={`
                                p-3 mb-1 rounded cursor-pointer text-sm
                                ${selectedQuestionId === q.id ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}
                            `}
                        >
                            <span className="mr-2 text-slate-400 dark:text-slate-500">{index + 1}.</span>
                            {q.text}
                            {q.logic && q.logic.length > 0 && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                                    {q.logic.length} rules
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Area: Logic Builder */}
            <div className="flex-1 p-6 overflow-y-auto">
                {selectedQuestion ? (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Logic for: {selectedQuestion.text}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Define what happens based on the answer to this question.</p>
                        </div>

                        {/* Logic Rules List */}
                        <div className="space-y-4">
                            {(selectedQuestion.logic || []).map((rule, ruleIndex) => (
                                <div key={rule.id || ruleIndex} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm relative">
                                    <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                                        <h4 className="font-medium text-slate-900 dark:text-white">Rule {ruleIndex + 1}</h4>
                                        <button
                                            onClick={() => handleDeleteRule(rule.id)}
                                            className="text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col space-y-4">
                                        {/* IF Condition */}
                                        <div className="flex items-center space-x-3">
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-12">IF</span>

                                            <select
                                                className="block rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                                value={rule.conditions[0]?.operator}
                                                onChange={(e) => updateCondition(rule.id, 0, 'operator', e.target.value)}
                                            >
                                                <option value="equals">equals</option>
                                                <option value="not_equals">does not equal</option>
                                                <option value="contains">contains</option>
                                            </select>

                                            {/* Value Input: Depends on Question Type */}
                                            {(selectedQuestion.type === QuestionType.MULTIPLE_CHOICE || selectedQuestion.type === QuestionType.CHECKBOXES) ? (
                                                <select
                                                    className="block flex-1 rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                                    value={String(rule.conditions[0]?.value)}
                                                    onChange={(e) => updateCondition(rule.id, 0, 'value', e.target.value)}
                                                >
                                                    <option value="">Select option...</option>
                                                    {selectedQuestion.options?.map(opt => (
                                                        <option key={opt.id} value={opt.value}>{opt.text}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="block flex-1 rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                                    value={String(rule.conditions[0]?.value)}
                                                    onChange={(e) => updateCondition(rule.id, 0, 'value', e.target.value)}
                                                    placeholder="Value"
                                                />
                                            )}
                                        </div>

                                        {/* THEN Action */}
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Then</span>
                                            <select
                                                className="block w-40 pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                                value={rule.actions.action}
                                                onChange={(e) => updateAction(rule.id, 'action', e.target.value)}
                                            >
                                                <option value={LogicAction.SKIP_TO_QUESTION}>Skip to...</option>
                                                <option value={LogicAction.SKIP_TO_END}>End Survey</option>
                                                <option value={LogicAction.SHOW_QUESTION}>Show Question</option>
                                                <option value={LogicAction.HIDE_QUESTION}>Hide Question</option>
                                            </select>

                                            {rule.actions.action !== LogicAction.SKIP_TO_END && (
                                                <select
                                                    className="block w-40 pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                                    value={rule.actions.targetQuestionId || ''}
                                                    onChange={(e) => updateAction(rule.id, 'targetQuestionId', e.target.value)}
                                                >
                                                    <option value="">Select question...</option>
                                                    {getAvailableTargets(selectedQuestion!.id).map(q => (
                                                        <option key={q.id} value={q.id}>
                                                            {q.text.length > 20 ? q.text.substring(0, 20) + '...' : q.text}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {(!selectedQuestion.logic || selectedQuestion.logic.length === 0) && (
                                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <p className="text-slate-500 dark:text-slate-400 mb-2">No logic rules defined yet.</p>
                                    <button
                                        onClick={handleAddRule}
                                        className="btn btn-primary btn-sm"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Logic Rule
                                    </button>
                                </div>
                            )}

                            {/* Add Rule Button (if rules exist) */}
                            {selectedQuestion.logic && selectedQuestion.logic.length > 0 && (
                                <button
                                    onClick={handleAddRule}
                                    className="btn btn-secondary btn-sm mt-4"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Another Rule
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                        Select a question to edit its logic
                    </div>
                )}
            </div>
        </div>
    );
}
