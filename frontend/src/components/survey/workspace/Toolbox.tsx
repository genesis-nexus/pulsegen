import {
    Type,
    CheckSquare,
    List,
    Star,
    Calendar,
    Hash,
    Mail,
    AlignLeft,
    GripVertical,
    ChevronDown,
    ToggleRight,
    Image,
    ListOrdered,
    BarChart,
    Sliders,
    Grid,
    GitCommit,
    Columns,
    MapPin,
    Calculator,
    FunctionSquare,
    Edit3,
    Upload,
    FileText,
    EyeOff,
    Users,
    Globe,
    Clock
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
    // Input Types
    { type: QuestionType.SHORT_TEXT, label: 'Short Text', icon: Type, category: 'Input' },
    { type: QuestionType.LONG_TEXT, label: 'Long Text', icon: AlignLeft, category: 'Input' },
    { type: QuestionType.EMAIL, label: 'Email', icon: Mail, category: 'Input' },
    { type: QuestionType.NUMBER, label: 'Number', icon: Hash, category: 'Input' },
    { type: QuestionType.DATE, label: 'Date', icon: Calendar, category: 'Input' },
    { type: QuestionType.TIME, label: 'Time', icon: Clock, category: 'Input' },

    // Choice Types
    { type: QuestionType.MULTIPLE_CHOICE, label: 'Multiple Choice', icon: List, category: 'Choice' },
    { type: QuestionType.CHECKBOXES, label: 'Checkboxes', icon: CheckSquare, category: 'Choice' },
    { type: QuestionType.DROPDOWN, label: 'Dropdown', icon: ChevronDown, category: 'Choice' },
    { type: QuestionType.YES_NO, label: 'Yes/No', icon: ToggleRight, category: 'Choice' },
    { type: QuestionType.IMAGE_SELECT, label: 'Image Select', icon: Image, category: 'Choice' },
    { type: QuestionType.RANKING, label: 'Ranking', icon: ListOrdered, category: 'Choice' },

    // Rating/Scale Types
    { type: QuestionType.RATING_SCALE, label: 'Rating Scale', icon: Star, category: 'Rating' },
    { type: QuestionType.NPS, label: 'NPS', icon: BarChart, category: 'Rating' },
    { type: QuestionType.LIKERT_SCALE, label: 'Likert Scale', icon: Sliders, category: 'Rating' },
    { type: QuestionType.SLIDER, label: 'Slider', icon: Sliders, category: 'Rating' },
    { type: QuestionType.SEMANTIC_DIFFERENTIAL, label: 'Semantic Differential', icon: GitCommit, category: 'Rating' },

    // Matrix Types
    { type: QuestionType.MATRIX, label: 'Matrix', icon: Grid, category: 'Matrix' },
    { type: QuestionType.ARRAY_DUAL_SCALE, label: 'Array Dual Scale', icon: Columns, category: 'Matrix' },

    // Advanced Types
    { type: QuestionType.GEO_LOCATION, label: 'Geo Location', icon: MapPin, category: 'Advanced' },
    { type: QuestionType.MULTIPLE_NUMERICAL, label: 'Multiple Numerical', icon: Calculator, category: 'Advanced' },
    { type: QuestionType.EQUATION, label: 'Equation', icon: FunctionSquare, category: 'Advanced' },
    { type: QuestionType.SIGNATURE, label: 'Signature', icon: Edit3, category: 'Advanced' },
    { type: QuestionType.FILE_UPLOAD, label: 'File Upload', icon: Upload, category: 'Advanced' },

    // Special Types
    { type: QuestionType.BOILERPLATE, label: 'Boilerplate Text', icon: FileText, category: 'Special' },
    { type: QuestionType.HIDDEN, label: 'Hidden Field', icon: EyeOff, category: 'Special' },
    { type: QuestionType.GENDER, label: 'Gender', icon: Users, category: 'Special' },
    { type: QuestionType.LANGUAGE_SWITCHER, label: 'Language Switcher', icon: Globe, category: 'Special' },
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
                        {['Input', 'Choice', 'Rating', 'Matrix', 'Advanced', 'Special'].map(category => {
                            const categoryItems = TOOLBOX_ITEMS.filter(item => item.category === category);
                            if (categoryItems.length === 0) return null;

                            return (
                                <div key={category}>
                                    <h3 className="text-xs font-medium text-gray-500 mb-2 px-2">{category}</h3>
                                    <div className="space-y-1">
                                        {categoryItems.map((item) => {
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
                            );
                        })}
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
