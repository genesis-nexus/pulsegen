import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Survey, Question, QuestionType } from '../../../types';
import { GripVertical, Trash2 } from 'lucide-react';

interface CanvasProps {
    survey: Survey | null;
    questions: Question[];
    selectedQuestionId: string | null;
    onSelectQuestion: (id: string) => void;
    onDeleteQuestion: (id: string) => void;
}

export default function Canvas({
    survey,
    questions,
    selectedQuestionId,
    onSelectQuestion,
    onDeleteQuestion
}: CanvasProps) {
    if (!survey) return <div className="flex-1 bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">Loading...</div>;

    return (
        <div className="flex-1 bg-slate-100 dark:bg-slate-900 overflow-y-auto h-full p-8 flex justify-center">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-800 shadow-sm min-h-[800px] rounded-lg p-8 border border-slate-200 dark:border-slate-700">
                <div className="mb-8 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{survey.title || 'Untitled Survey'}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{survey.description || 'No description provided'}</p>
                </div>

                <Droppable droppableId="canvas-questions">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-6"
                        >
                            {questions.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                    <p className="text-slate-400 dark:text-slate-500">Drag items from the toolbox or click to add questions</p>
                                </div>
                            ) : (
                                questions.map((question, index) => (
                                    <Draggable key={question.id} draggableId={question.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                style={{ ...provided.draggableProps.style }}
                                                onClick={() => onSelectQuestion(question.id)}
                                                className={`
                                                    relative group rounded-lg border-2 transition-all cursor-pointer p-4 bg-white dark:bg-slate-800
                                                    ${selectedQuestionId === question.id
                                                        ? 'border-primary-500 ring-4 ring-primary-50 dark:ring-primary-900/50 z-10'
                                                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                                                    }
                                                    ${snapshot.isDragging ? 'shadow-lg border-primary-500' : ''}
                                                `}
                                            >
                                                <div className="flex items-start">
                                                    {/* Question Number */}
                                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium rounded text-sm mr-4 mt-1">
                                                        {index + 1}
                                                    </span>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-medium text-slate-900 dark:text-white break-words mb-1">
                                                            {question.text || <span className="text-slate-400 dark:text-slate-500 italic">Untitled Question</span>}
                                                        </h3>

                                                        {question.description && (
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{question.description}</p>
                                                        )}

                                                        {/* Preview Area */}
                                                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded p-4 pointer-events-none opacity-75">
                                                            {renderPreview(question)}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className={`
                                                        absolute top-2 right-2 flex items-center space-x-1
                                                        ${selectedQuestionId === question.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                                        transition-opacity
                                                    `}>
                                                        <div
                                                            {...provided.dragHandleProps}
                                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400 dark:text-slate-500 cursor-grab active:cursor-grabbing"
                                                            title="Move"
                                                        >
                                                            <GripVertical className="w-4 h-4" />
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteQuestion(question.id);
                                                            }}
                                                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        </div>
    );
}

function renderPreview(question: Question) {
    switch (question.type) {
        case QuestionType.MULTIPLE_CHOICE:
        case QuestionType.CHECKBOXES: // Fallthrough
            return (
                <div className="space-y-2">
                    {question.options.map((opt, i) => (
                        <div key={i} className="flex items-center">
                            <div className={`w-4 h-4 border border-slate-300 dark:border-slate-600 ${question.type === QuestionType.MULTIPLE_CHOICE ? 'rounded-full' : 'rounded'} bg-white dark:bg-slate-700 mr-3`} />
                            <span className="text-sm text-slate-600 dark:text-slate-300">{opt.text}</span>
                        </div>
                    ))}
                    {question.options.length === 0 && <span className="text-slate-400 dark:text-slate-500 text-sm italic">No options added</span>}
                </div>
            );
        case QuestionType.SHORT_TEXT:
            return <div className="h-10 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 w-full max-w-md" />;
        case QuestionType.LONG_TEXT:
            return <div className="h-24 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 w-full" />;
        default:
            return <div className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">{question.type} Input Preview</div>;
    }
}
