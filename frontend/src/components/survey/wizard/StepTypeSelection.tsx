import { QuestionType } from '../../../types';
import {
    CheckSquare,
    AlignLeft,
    List,
    Star,
    Calendar,
    Hash,
    Mail
} from 'lucide-react';

interface StepTypeSelectionProps {
    value?: QuestionType;
    onChange: (type: QuestionType) => void;
}

const QUESTION_TYPES = [
    {
        id: QuestionType.MULTIPLE_CHOICE,
        label: 'Multiple Choice',
        icon: List,
        description: 'Select one option from a list'
    },
    {
        id: QuestionType.CHECKBOXES,
        label: 'Checkboxes',
        icon: CheckSquare,
        description: 'Select multiple options'
    },
    {
        id: QuestionType.SHORT_TEXT,
        label: 'Short Text',
        icon: AlignLeft,
        description: 'Single line text input'
    },
    {
        id: QuestionType.LONG_TEXT,
        label: 'Long Text',
        icon: AlignLeft,
        description: 'Multi-line text area'
    },
    {
        id: QuestionType.RATING_SCALE,
        label: 'Rating',
        icon: Star,
        description: 'Star or number rating'
    },
    {
        id: QuestionType.DATE,
        label: 'Date',
        icon: Calendar,
        description: 'Date picker'
    },
    {
        id: QuestionType.NUMBER,
        label: 'Number',
        icon: Hash,
        description: 'Numeric input'
    },
    {
        id: QuestionType.EMAIL,
        label: 'Email',
        icon: Mail,
        description: 'Email address validation'
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
