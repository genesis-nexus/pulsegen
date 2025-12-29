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
        <div className="bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 w-64 flex flex-col h-full">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('tools')}
                    className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'tools' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Add
                </button>
                <button
                    onClick={() => setActiveTab('outline')}
                    className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'outline' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
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
                                    <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 px-2">{category}</h3>
                                    <div className="space-y-1">
                                        {categoryItems.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={item.type}
                                                    onClick={() => onAddQuestion(item.type)}
                                                    className="w-full flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                                                >
                                                    <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 mr-2 group-hover:text-slate-400 dark:group-hover:text-slate-500" />
                                                    <Icon className="w-4 h-4 mr-3 text-slate-400 dark:text-slate-500 group-hover:text-primary-500 dark:group-hover:text-primary-400" />
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
                            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No questions yet</p>
                        ) : (
                            questions.map((q, index) => (
                                <div
                                    key={q.id}
                                    onClick={() => onSelectQuestion?.(q.id)}
                                    className={`
                                        flex items-center px-3 py-2 text-sm rounded cursor-pointer transition-colors
                                        ${selectedQuestionId === q.id
                                            ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}
                                    `}
                                >
                                    <span className="text-slate-400 dark:text-slate-500 mr-2 font-mono text-xs">{index + 1}</span>
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
