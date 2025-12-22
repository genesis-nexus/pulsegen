import { QuestionType } from '../../../types';
import {
    CheckSquare,
    AlignLeft,
    List,
    Star,
    Calendar,
    Hash,
    Mail,
    Image,
    GitCommit,
    MapPin,
    Calculator,
    Columns,
    FunctionSquare,
    FileText,
    EyeOff,
    Users,
    Globe,
    Edit3,
    ChevronDown,
    BarChart,
    Sliders,
    ToggleRight,
    Grid,
    ListOrdered,
    Upload,
    Clock
} from 'lucide-react';

interface StepTypeSelectionProps {
    value?: QuestionType;
    onChange: (type: QuestionType) => void;
}

const QUESTION_TYPES = [
    // Input Types
    {
        id: QuestionType.SHORT_TEXT,
        label: 'Short Text',
        icon: AlignLeft,
        description: 'Single line text input',
        category: 'Input'
    },
    {
        id: QuestionType.LONG_TEXT,
        label: 'Long Text',
        icon: AlignLeft,
        description: 'Multi-line text area',
        category: 'Input'
    },
    {
        id: QuestionType.EMAIL,
        label: 'Email',
        icon: Mail,
        description: 'Email address validation',
        category: 'Input'
    },
    {
        id: QuestionType.NUMBER,
        label: 'Number',
        icon: Hash,
        description: 'Numeric input',
        category: 'Input'
    },
    {
        id: QuestionType.DATE,
        label: 'Date',
        icon: Calendar,
        description: 'Date picker',
        category: 'Input'
    },
    {
        id: QuestionType.TIME,
        label: 'Time',
        icon: Clock,
        description: 'Time picker',
        category: 'Input'
    },

    // Choice Types
    {
        id: QuestionType.MULTIPLE_CHOICE,
        label: 'Multiple Choice',
        icon: List,
        description: 'Select one option from a list',
        category: 'Choice'
    },
    {
        id: QuestionType.CHECKBOXES,
        label: 'Checkboxes',
        icon: CheckSquare,
        description: 'Select multiple options',
        category: 'Choice'
    },
    {
        id: QuestionType.DROPDOWN,
        label: 'Dropdown',
        icon: ChevronDown,
        description: 'Dropdown selection',
        category: 'Choice'
    },
    {
        id: QuestionType.YES_NO,
        label: 'Yes/No',
        icon: ToggleRight,
        description: 'Binary choice question',
        category: 'Choice'
    },
    {
        id: QuestionType.IMAGE_SELECT,
        label: 'Image Select',
        icon: Image,
        description: 'Select from image options',
        category: 'Choice'
    },
    {
        id: QuestionType.RANKING,
        label: 'Ranking',
        icon: ListOrdered,
        description: 'Rank items in order',
        category: 'Choice'
    },

    // Rating/Scale Types
    {
        id: QuestionType.RATING_SCALE,
        label: 'Rating Scale',
        icon: Star,
        description: 'Star or number rating',
        category: 'Rating'
    },
    {
        id: QuestionType.NPS,
        label: 'Net Promoter Score',
        icon: BarChart,
        description: '0-10 recommendation scale',
        category: 'Rating'
    },
    {
        id: QuestionType.LIKERT_SCALE,
        label: 'Likert Scale',
        icon: Sliders,
        description: 'Agreement scale',
        category: 'Rating'
    },
    {
        id: QuestionType.SLIDER,
        label: 'Slider',
        icon: Sliders,
        description: 'Continuous value slider',
        category: 'Rating'
    },
    {
        id: QuestionType.SEMANTIC_DIFFERENTIAL,
        label: 'Semantic Differential',
        icon: GitCommit,
        description: 'Bipolar scale between opposing adjectives',
        category: 'Rating'
    },

    // Matrix Types
    {
        id: QuestionType.MATRIX,
        label: 'Matrix',
        icon: Grid,
        description: 'Grid of questions and options',
        category: 'Matrix'
    },
    {
        id: QuestionType.ARRAY_DUAL_SCALE,
        label: 'Array Dual Scale',
        icon: Columns,
        description: 'Matrix with two independent scales',
        category: 'Matrix'
    },

    // Advanced Types
    {
        id: QuestionType.GEO_LOCATION,
        label: 'Geo Location',
        icon: MapPin,
        description: 'Location picker with map',
        category: 'Advanced'
    },
    {
        id: QuestionType.MULTIPLE_NUMERICAL,
        label: 'Multiple Numerical',
        icon: Calculator,
        description: 'Multiple number inputs',
        category: 'Advanced'
    },
    {
        id: QuestionType.EQUATION,
        label: 'Equation',
        icon: FunctionSquare,
        description: 'Calculated value from other answers',
        category: 'Advanced'
    },
    {
        id: QuestionType.SIGNATURE,
        label: 'Signature',
        icon: Edit3,
        description: 'Digital signature pad',
        category: 'Advanced'
    },
    {
        id: QuestionType.FILE_UPLOAD,
        label: 'File Upload',
        icon: Upload,
        description: 'File upload field',
        category: 'Advanced'
    },

    // Special Types
    {
        id: QuestionType.BOILERPLATE,
        label: 'Boilerplate Text',
        icon: FileText,
        description: 'Display-only text block',
        category: 'Special'
    },
    {
        id: QuestionType.HIDDEN,
        label: 'Hidden Field',
        icon: EyeOff,
        description: 'Hidden data field',
        category: 'Special'
    },
    {
        id: QuestionType.GENDER,
        label: 'Gender',
        icon: Users,
        description: 'Gender selection field',
        category: 'Special'
    },
    {
        id: QuestionType.LANGUAGE_SWITCHER,
        label: 'Language Switcher',
        icon: Globe,
        description: 'Survey language selector',
        category: 'Special'
    },
];

export default function StepTypeSelection({ value, onChange }: StepTypeSelectionProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUESTION_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = value === type.id;

                return (
                    <div
                        key={type.id}
                        onClick={() => onChange(type.id)}
                        className={`
              relative rounded-lg border p-4 cursor-pointer hover:shadow-md transition-all
              ${isSelected
                                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                                : 'border-gray-200 hover:border-primary-300'
                            }
            `}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center">
                                <div className={`
                  p-2 rounded-md mr-3
                  ${isSelected ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}
                `}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className={`text-sm font-medium ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                                        {type.label}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {type.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
