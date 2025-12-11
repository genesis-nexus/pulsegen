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
    if (!survey) return <div className="flex-1 bg-gray-50 flex items-center justify-center">Loading...</div>;

    return (
        <div className="flex-1 bg-gray-100 overflow-y-auto h-full p-8 flex justify-center">
            <div className="w-full max-w-3xl bg-white shadow-sm min-h-[800px] rounded-lg p-8">
                <div className="mb-8 border-b pb-4">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.title || 'Untitled Survey'}</h1>
                    <p className="text-gray-500">{survey.description || 'No description provided'}</p>
                </div>

                <Droppable droppableId="canvas-questions">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-6"
                        >
                            {questions.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-lg">
                                    <p className="text-gray-400">Drag items from the toolbox or click to add questions</p>
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
                                                    relative group rounded-lg border-2 transition-all cursor-pointer p-4 bg-white
                                                    ${selectedQuestionId === question.id
                                                        ? 'border-primary-500 ring-4 ring-primary-50 z-10'
                                                        : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                                                    }
                                                    ${snapshot.isDragging ? 'shadow-lg border-primary-500' : ''}
                                                `}
                                            >
                                                <div className="flex items-start">
                                                    {/* Question Number */}
                                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 font-medium rounded text-sm mr-4 mt-1">
                                                        {index + 1}
                                                    </span>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-medium text-gray-900 break-words mb-1">
                                                            {question.text || <span className="text-gray-400 italic">Untitled Question</span>}
                                                        </h3>

                                                        {question.description && (
                                                            <p className="text-sm text-gray-500 mb-4">{question.description}</p>
                                                        )}

                                                        {/* Preview Area */}
                                                        <div className="bg-gray-50 rounded p-4 pointer-events-none opacity-75">
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
                                                            className="p-1 hover:bg-gray-200 rounded text-gray-400 cursor-grab active:cursor-grabbing"
                                                            title="Move"
                                                        >
                                                            <GripVertical className="w-4 h-4" />
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteQuestion(question.id);
                                                            }}
                                                            className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded"
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
                            <div className={`w-4 h-4 border border-gray-300 ${question.type === QuestionType.MULTIPLE_CHOICE ? 'rounded-full' : 'rounded'} bg-white mr-3`} />
                            <span className="text-sm text-gray-600">{opt.text}</span>
                        </div>
                    ))}
                    {question.options.length === 0 && <span className="text-gray-400 text-sm italic">No options added</span>}
                </div>
            );
        case QuestionType.SHORT_TEXT:
            return <div className="h-10 border border-gray-300 rounded bg-white w-full max-w-md" />;
        case QuestionType.LONG_TEXT:
            return <div className="h-24 border border-gray-300 rounded bg-white w-full" />;
        default:
            return <div className="text-xs text-gray-400 uppercase tracking-wide">{question.type} Input Preview</div>;
    }
}
