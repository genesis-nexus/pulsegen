import { useState } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Question, QuestionType } from '../../../types';
import {
    AlignLeft,
    BarChart,
    CheckSquare,
    ChevronDown,
    Copy,
    GripVertical,
    Hash,
    List,
    Plus,
    Sliders,
    Sparkles,
    Star,
    ToggleRight,
    Trash2,
    Type,
    Wand2,
} from 'lucide-react';

interface CanvasProps {
    title: string;
    description: string;
    questions: Question[];
    selectedQuestionId: string | null;
    onSelectQuestion: (id: string) => void;
    onUpdateQuestion: (id: string, data: Partial<Question>) => void;
    onDeleteQuestion: (id: string) => void;
    onDuplicateQuestion: (id: string) => void;
    onOptimizeQuestion: (question: Question) => void;
    onAddQuestion: (type: QuestionType, insertIndex?: number) => void;
    onSuggestQuestions?: () => void;
}

const QUICK_ADD_TYPES = [
    { type: QuestionType.MULTIPLE_CHOICE, label: 'Multiple Choice', icon: List },
    { type: QuestionType.CHECKBOXES, label: 'Checkboxes', icon: CheckSquare },
    { type: QuestionType.SHORT_TEXT, label: 'Short Text', icon: Type },
    { type: QuestionType.LONG_TEXT, label: 'Long Text', icon: AlignLeft },
    { type: QuestionType.RATING_SCALE, label: 'Rating', icon: Star },
    { type: QuestionType.NPS, label: 'NPS', icon: BarChart },
    { type: QuestionType.DROPDOWN, label: 'Dropdown', icon: ChevronDown },
    { type: QuestionType.YES_NO, label: 'Yes/No', icon: ToggleRight },
    { type: QuestionType.NUMBER, label: 'Number', icon: Hash },
    { type: QuestionType.SLIDER, label: 'Slider', icon: Sliders },
];

export default function Canvas({
    title,
    description,
    questions,
    selectedQuestionId,
    onSelectQuestion,
    onUpdateQuestion,
    onDeleteQuestion,
    onDuplicateQuestion,
    onOptimizeQuestion,
    onAddQuestion,
    onSuggestQuestions,
}: CanvasProps) {
    return (
        <div className="flex-1 bg-slate-100 dark:bg-slate-900 overflow-y-auto h-full p-8 flex justify-center">
            <div className="w-full max-w-3xl">
                <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl p-8 border border-slate-200 dark:border-slate-700 mb-4">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        {title || <span className="text-slate-300 dark:text-slate-600">Untitled Survey</span>}
                    </h1>
                    {description ? (
                        <p className="text-slate-500 dark:text-slate-400">{description}</p>
                    ) : (
                        <p className="text-slate-300 dark:text-slate-600 text-sm">
                            Add a description in the survey settings panel →
                        </p>
                    )}
                </div>

                <Droppable droppableId="canvas-questions">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                            {questions.length === 0 ? (
                                <EmptyState onAddQuestion={onAddQuestion} onSuggestQuestions={onSuggestQuestions} />
                            ) : (
                                questions.map((question, index) => (
                                    <div key={question.id}>
                                        <InsertPoint index={index} onAddQuestion={onAddQuestion} />
                                        <Draggable draggableId={question.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    style={{ ...provided.draggableProps.style }}
                                                    onClick={() => onSelectQuestion(question.id)}
                                                    className={`
                                                        relative group rounded-xl border-2 transition-all cursor-pointer p-5 bg-white dark:bg-slate-800
                                                        ${selectedQuestionId === question.id
                                                            ? 'border-primary-500 ring-4 ring-primary-50 dark:ring-primary-900/50 z-10'
                                                            : 'border-transparent hover:border-slate-200 dark:hover:border-slate-600 shadow-sm'
                                                        }
                                                        ${snapshot.isDragging ? 'shadow-xl border-primary-500' : ''}
                                                    `}
                                                >
                                                    <QuestionCard
                                                        question={question}
                                                        index={index}
                                                        isSelected={selectedQuestionId === question.id}
                                                        onUpdateQuestion={onUpdateQuestion}
                                                        onDeleteQuestion={onDeleteQuestion}
                                                        onDuplicateQuestion={onDuplicateQuestion}
                                                        onOptimizeQuestion={onOptimizeQuestion}
                                                        dragHandleProps={provided.dragHandleProps}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    </div>
                                ))
                            )}
                            {provided.placeholder}
                            {questions.length > 0 && (
                                <InsertPoint
                                    index={questions.length}
                                    onAddQuestion={onAddQuestion}
                                    alwaysVisible
                                />
                            )}
                        </div>
                    )}
                </Droppable>
            </div>
        </div>
    );
}

function QuestionCard({
    question,
    index,
    isSelected,
    onUpdateQuestion,
    onDeleteQuestion,
    onDuplicateQuestion,
    onOptimizeQuestion,
    dragHandleProps,
}: {
    question: Question;
    index: number;
    isSelected: boolean;
    onUpdateQuestion: (id: string, data: Partial<Question>) => void;
    onDeleteQuestion: (id: string) => void;
    onDuplicateQuestion: (id: string) => void;
    onOptimizeQuestion: (question: Question) => void;
    dragHandleProps: any;
}) {
    return (
        <div className="flex items-start">
            {/* Question Number */}
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium rounded-lg text-sm mr-4 mt-1">
                {index + 1}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-24">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        {question.type.replace(/_/g, ' ')}
                    </span>
                    {question.isRequired && (
                        <span className="text-[11px] font-medium text-red-500">Required</span>
                    )}
                </div>

                {isSelected ? (
                    <textarea
                        value={question.text}
                        onChange={(e) => onUpdateQuestion(question.id, { text: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Type your question..."
                        rows={Math.max(1, Math.ceil((question.text?.length || 1) / 70))}
                        className="w-full text-lg font-medium text-slate-900 dark:text-white bg-transparent border-none p-0 focus:ring-0 resize-none placeholder-slate-300 dark:placeholder-slate-600 mb-1"
                    />
                ) : (
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white break-words mb-1">
                        {question.text || (
                            <span className="text-slate-400 dark:text-slate-500 italic">Untitled Question</span>
                        )}
                    </h3>
                )}

                {question.description && !isSelected && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{question.description}</p>
                )}
                {isSelected && (
                    <input
                        type="text"
                        value={question.description || ''}
                        onChange={(e) => onUpdateQuestion(question.id, { description: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Add a description (optional)"
                        className="w-full text-sm text-slate-500 dark:text-slate-400 bg-transparent border-none p-0 focus:ring-0 placeholder-slate-300 dark:placeholder-slate-600 mb-3"
                    />
                )}

                {/* Preview Area */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 pointer-events-none">
                    {renderPreview(question)}
                </div>
            </div>

            {/* Actions */}
            <div
                className={`
                    absolute top-3 right-3 flex items-center space-x-0.5 bg-white dark:bg-slate-800 rounded-lg
                    ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                    transition-opacity
                `}
            >
                <div
                    {...dragHandleProps}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-md text-slate-400 dark:text-slate-500 cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                >
                    <GripVertical className="w-4 h-4" />
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onOptimizeQuestion(question);
                    }}
                    className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 rounded-md"
                    title="Improve with AI"
                >
                    <Wand2 className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateQuestion(question.id);
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-md"
                    title="Duplicate"
                >
                    <Copy className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteQuestion(question.id);
                    }}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-md"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

/** Hover-revealed "+" between questions that opens a quick type picker. */
function InsertPoint({
    index,
    onAddQuestion,
    alwaysVisible = false,
}: {
    index: number;
    onAddQuestion: (type: QuestionType, insertIndex?: number) => void;
    alwaysVisible?: boolean;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`relative flex items-center justify-center ${alwaysVisible ? 'py-4' : 'h-6 group/insert'}`}>
            <button
                onClick={() => setOpen(!open)}
                className={`
                    inline-flex items-center text-xs font-medium rounded-full transition-all z-10
                    ${alwaysVisible
                        ? 'px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400'
                        : 'px-2.5 py-1 bg-primary-600 text-white shadow-sm opacity-0 group-hover/insert:opacity-100 ' + (open ? '!opacity-100' : '')}
                `}
            >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add question
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
                    <div className="absolute top-full mt-1 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 grid grid-cols-2 gap-1 w-72">
                        {QUICK_ADD_TYPES.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.type}
                                    onClick={() => {
                                        setOpen(false);
                                        onAddQuestion(item.type, index);
                                    }}
                                    className="flex items-center px-2.5 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left"
                                >
                                    <Icon className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

function EmptyState({
    onAddQuestion,
    onSuggestQuestions,
}: {
    onAddQuestion: (type: QuestionType, insertIndex?: number) => void;
    onSuggestQuestions?: () => void;
}) {
    return (
        <div className="text-center py-16 px-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Add your first question</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Pick a question type below, or browse all types in the left panel.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                {QUICK_ADD_TYPES.slice(0, 6).map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.type}
                            onClick={() => onAddQuestion(item.type)}
                            className="inline-flex items-center px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors shadow-sm"
                        >
                            <Icon className="w-4 h-4 mr-2 text-slate-400" />
                            {item.label}
                        </button>
                    );
                })}
            </div>
            {onSuggestQuestions && (
                <button
                    onClick={onSuggestQuestions}
                    className="mt-6 inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Or let AI suggest questions for you
                </button>
            )}
        </div>
    );
}

function renderPreview(question: Question) {
    const inputMock = (
        <div className="h-9 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 w-full max-w-md" />
    );

    switch (question.type) {
        case QuestionType.MULTIPLE_CHOICE:
        case QuestionType.CHECKBOXES:
            return (
                <div className="space-y-2">
                    {question.options.map((opt, i) => (
                        <div key={i} className="flex items-center">
                            <div
                                className={`w-4 h-4 border border-slate-300 dark:border-slate-500 ${question.type === QuestionType.MULTIPLE_CHOICE ? 'rounded-full' : 'rounded'} bg-white dark:bg-slate-600 mr-3 shrink-0`}
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-300">{opt.text}</span>
                        </div>
                    ))}
                    {question.options.length === 0 && (
                        <span className="text-slate-400 dark:text-slate-500 text-sm italic">
                            No options yet — add them in the panel on the right
                        </span>
                    )}
                </div>
            );

        case QuestionType.DROPDOWN:
            return (
                <div className="h-9 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 w-full max-w-md flex items-center justify-between px-3">
                    <span className="text-sm text-slate-400 dark:text-slate-500">
                        {question.options[0]?.text || 'Select an option...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
            );

        case QuestionType.NPS:
            return (
                <div>
                    <div className="flex gap-1">
                        {Array.from({ length: 11 }, (_, i) => (
                            <div
                                key={i}
                                className="flex-1 h-8 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400"
                            >
                                {i}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        <span>Not likely</span>
                        <span>Extremely likely</span>
                    </div>
                </div>
            );

        case QuestionType.RATING_SCALE:
            return (
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className="w-6 h-6 text-slate-300 dark:text-slate-500" />
                    ))}
                </div>
            );

        case QuestionType.YES_NO:
            return (
                <div className="flex gap-3 max-w-sm">
                    {['Yes', 'No'].map((label) => (
                        <div
                            key={label}
                            className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-center text-sm text-slate-600 dark:text-slate-300"
                        >
                            {label}
                        </div>
                    ))}
                </div>
            );

        case QuestionType.LIKERT_SCALE:
        case QuestionType.RANKING:
            return (
                <div className="space-y-2">
                    {(question.options.length > 0 ? question.options : []).map((opt, i) => (
                        <div key={i} className="flex items-center">
                            {question.type === QuestionType.RANKING ? (
                                <span className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-600 text-[11px] font-medium text-slate-500 dark:text-slate-300 flex items-center justify-center mr-3 shrink-0">
                                    {i + 1}
                                </span>
                            ) : (
                                <div className="w-4 h-4 border border-slate-300 dark:border-slate-500 rounded-full bg-white dark:bg-slate-600 mr-3 shrink-0" />
                            )}
                            <span className="text-sm text-slate-600 dark:text-slate-300">{opt.text}</span>
                        </div>
                    ))}
                    {question.options.length === 0 && (
                        <span className="text-slate-400 dark:text-slate-500 text-sm italic">No options yet</span>
                    )}
                </div>
            );

        case QuestionType.SLIDER:
            return (
                <div className="max-w-md">
                    <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full relative">
                        <div className="absolute left-1/2 -top-1 w-4 h-4 rounded-full bg-primary-500 shadow" />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                        <span>0</span>
                        <span>100</span>
                    </div>
                </div>
            );

        case QuestionType.LONG_TEXT:
            return (
                <div className="h-20 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 w-full" />
            );

        case QuestionType.SHORT_TEXT:
        case QuestionType.EMAIL:
        case QuestionType.NUMBER:
        case QuestionType.DATE:
        case QuestionType.TIME:
            return inputMock;

        default:
            return (
                <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    {question.type.replace(/_/g, ' ')} preview
                </div>
            );
    }
}
