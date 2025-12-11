import {
    Type,
    CheckSquare,
    List,
    Star,
    Calendar,
    Hash,
    Mail,
    AlignLeft,
    GripVertical
} from 'lucide-react';
import { useState } from 'react';
import { QuestionType } from '../../../types';

interface ToolboxProps {
    onAddQuestion: (type: QuestionType) => void;
    // Optional questions for outline view
    questions?: any[];
    onSelectQuestion?: (id: string) => void;
    selectedQuestionId?: string | null;
}

const TOOLBOX_ITEMS = [
    { type: QuestionType.MULTIPLE_CHOICE, label: 'Multiple Choice', icon: List },
    { type: QuestionType.CHECKBOXES, label: 'Checkboxes', icon: CheckSquare },
    { type: QuestionType.SHORT_TEXT, label: 'Short Text', icon: Type },
    { type: QuestionType.LONG_TEXT, label: 'Long Text', icon: AlignLeft },
    { type: QuestionType.RATING_SCALE, label: 'Rating', icon: Star },
    { type: QuestionType.DATE, label: 'Date', icon: Calendar },
    { type: QuestionType.NUMBER, label: 'Number', icon: Hash },
    { type: QuestionType.EMAIL, label: 'Email', icon: Mail },
];

export default function Toolbox({
    onAddQuestion,
    questions = [],
    onSelectQuestion,
    selectedQuestionId
}: ToolboxProps) {
    const [activeTab, setActiveTab] = useState<'tools' | 'outline'>('tools');

    return (
        <div className="bg-white border-r border-gray-200 w-64 flex flex-col h-full">
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('tools')}
                    className={`flex-1 py-3 text-sm font-medium text-center ${activeTab === 'tools' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Add
                </button>
                <button
                    onClick={() => setActiveTab('outline')}
                    className={`flex-1 py-3 text-sm font-medium text-center ${activeTab === 'outline' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Outline
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'tools' ? (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xs font-medium text-gray-500 mb-3 px-2">Question Types</h3>
                            <div className="space-y-1">
                                {TOOLBOX_ITEMS.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.type}
                                            onClick={() => onAddQuestion(item.type)}
                                            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 hover:text-primary-600 transition-colors group border border-transparent hover:border-gray-200"
                                        >
                                            <GripVertical className="w-4 h-4 text-gray-300 mr-2 group-hover:text-gray-400" />
                                            <Icon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-primary-500" />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {questions.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No questions yet</p>
                        ) : (
                            questions.map((q, index) => (
                                <div
                                    key={q.id}
                                    onClick={() => onSelectQuestion?.(q.id)}
                                    className={`
                                        flex items-center px-3 py-2 text-sm rounded cursor-pointer
                                        ${selectedQuestionId === q.id ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}
                                    `}
                                >
                                    <span className="text-gray-400 mr-2 font-mono text-xs">{index + 1}</span>
                                    <span className="truncate">{q.text || 'Untitled'}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
