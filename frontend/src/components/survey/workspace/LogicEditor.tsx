import { GitBranch } from 'lucide-react';
import { Question, SurveyLogic } from '../../../types';
import LogicRulesPanel from './LogicRulesPanel';

interface LogicEditorProps {
    surveyId: string;
    questions: Question[];
    onUpdateLogic: (questionId: string, logic: SurveyLogic[]) => void;
    selectedQuestionId: string | null;
    onSelectQuestion: (id: string) => void;
}

export default function LogicEditor({
    surveyId,
    questions,
    onUpdateLogic,
    selectedQuestionId,
    onSelectQuestion
}: LogicEditorProps) {
    const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-900">
            {/* Sidebar: Question List */}
            <div className="w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto shrink-0">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-medium text-slate-900 dark:text-white">Select Question</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Choose the question whose answer drives the logic
                    </p>
                </div>
                <div className="p-2">
                    {questions.map((q, index) => (
                        <div
                            key={q.id}
                            onClick={() => onSelectQuestion(q.id)}
                            className={`
                                p-3 mb-1 rounded-lg cursor-pointer text-sm flex items-start
                                ${selectedQuestionId === q.id
                                    ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}
                            `}
                        >
                            <span className="mr-2 text-slate-400 dark:text-slate-500 shrink-0">{index + 1}.</span>
                            <span className="min-w-0 break-words flex-1">{q.text || 'Untitled'}</span>
                            {q.logic && q.logic.length > 0 && (
                                <span className="ml-2 shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                                    <GitBranch className="w-3 h-3 mr-0.5" />
                                    {q.logic.length}
                                </span>
                            )}
                        </div>
                    ))}
                    {questions.length === 0 && (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
                            Add questions in the Design view first
                        </p>
                    )}
                </div>
            </div>

            {/* Main Area: Logic Builder */}
            <div className="flex-1 p-6 overflow-y-auto">
                {selectedQuestion ? (
                    <div className="max-w-2xl">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                Logic for: {selectedQuestion.text || 'Untitled'}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Skip, show, or hide questions based on the answer to this question.
                                Rules are evaluated live while respondents take the survey.
                            </p>
                        </div>

                        <LogicRulesPanel
                            surveyId={surveyId}
                            question={selectedQuestion}
                            questions={questions}
                            onLogicChanged={onUpdateLogic}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                        <GitBranch className="w-10 h-10 mb-3" />
                        <p>Select a question to edit its logic</p>
                    </div>
                )}
            </div>
        </div>
    );
}
