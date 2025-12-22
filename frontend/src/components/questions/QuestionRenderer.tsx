import { Question, QuestionType } from '../../types';
import {
    ImageSelectQuestion,
    SemanticDifferentialQuestion,
    GeoLocationQuestion,
    MultipleNumericalQuestion,
    ArrayDualScaleQuestion,
    EquationQuestion,
    BoilerplateQuestion,
    HiddenQuestion,
    GenderQuestion,
    LanguageSwitcherQuestion,
    SignatureQuestion,
    RankingQuestion,
} from './index';

interface QuestionRendererProps {
    question: Question;
    onChange?: (value: any) => void;
    value?: any;
    disabled?: boolean;
}

export default function QuestionRenderer({
    question,
    onChange,
    value,
    disabled = false,
}: QuestionRendererProps) {
    // Render question based on type
    switch (question.type) {
        // New question types
        case QuestionType.IMAGE_SELECT:
            return (
                <ImageSelectQuestion
                    question={question}
                    onChange={onChange}
                    value={value}
                    disabled={disabled}
                />
            );

        case QuestionType.SEMANTIC_DIFFERENTIAL:
            return (
                <SemanticDifferentialQuestion
                    question={question}
                    onChange={onChange}
                    value={value}
                    disabled={disabled}
                />
            );

        case QuestionType.GEO_LOCATION:
            return (
                <GeoLocationQuestion
                    question={question}
                    onChange={onChange}
                    value={value}
                    disabled={disabled}
                />
            );

        case QuestionType.MULTIPLE_NUMERICAL:
            return (
                <MultipleNumericalQuestion
                    question={question}
                    onChange={onChange}
                    value={value}
                    disabled={disabled}
                />
            );

        case QuestionType.ARRAY_DUAL_SCALE:
            return (
                <ArrayDualScaleQuestion
                    question={question}
                    onChange={onChange}
                    value={value}
                    disabled={disabled}
                />
            );

        case QuestionType.EQUATION:
            return (
                <EquationQuestion
                    question={question}
                    value={value}
                />
            );

        case QuestionType.BOILERPLATE:
            return (
                <BoilerplateQuestion
                    question={question}
                />
            );

        case QuestionType.HIDDEN:
            return (
                <HiddenQuestion
                    question={question}
                    onChange={onChange}
                    value={value}
                />
            );

        case QuestionType.GENDER:
            return (
                <GenderQuestion
                    question={question}
                    onChange={onChange}
                    value={value}
                    disabled={disabled}
                />
            );

        case QuestionType.LANGUAGE_SWITCHER:
            return (
                <LanguageSwitcherQuestion
                    question={question}
                    onChange={onChange}
                    value={value}
                    disabled={disabled}
                />
            );

        case QuestionType.SIGNATURE:
            return (
                <SignatureQuestion
                    question={question}
                    onChange={onChange}
                    value={value}
                    disabled={disabled}
                />
            );

        case QuestionType.RANKING:
            return (
                <RankingQuestion
                    question={question}
                    onChange={onChange}
                    value={value}
                    disabled={disabled}
                />
            );

        // Existing question types (placeholders - to be implemented or already exist)
        case QuestionType.SHORT_TEXT:
            return (
                <input
                    type="text"
                    value={value?.textValue || ''}
                    onChange={(e) => onChange?.({ textValue: e.target.value })}
                    disabled={disabled}
                    placeholder={question.settings?.placeholder}
                    maxLength={question.settings?.maxLength}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
            );

        case QuestionType.LONG_TEXT:
            return (
                <textarea
                    value={value?.textValue || ''}
                    onChange={(e) => onChange?.({ textValue: e.target.value })}
                    disabled={disabled}
                    placeholder={question.settings?.placeholder}
                    maxLength={question.settings?.maxLength}
                    rows={question.settings?.rows || 5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
            );

        case QuestionType.EMAIL:
            return (
                <input
                    type="email"
                    value={value?.textValue || ''}
                    onChange={(e) => onChange?.({ textValue: e.target.value })}
                    disabled={disabled}
                    placeholder={question.settings?.placeholder || 'email@example.com'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
            );

        case QuestionType.NUMBER:
            return (
                <input
                    type="number"
                    value={value?.numberValue ?? ''}
                    onChange={(e) => onChange?.({ numberValue: parseFloat(e.target.value) || null })}
                    disabled={disabled}
                    min={question.settings?.min}
                    max={question.settings?.max}
                    step={question.settings?.step || 1}
                    className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
            );

        case QuestionType.DATE:
            return (
                <input
                    type="date"
                    value={value?.dateValue ? new Date(value.dateValue).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                        // Prevent years > 9999
                        const val = e.target.value;
                        if (val && val.split('-')[0].length > 4) return;
                        onChange?.({ dateValue: val });
                    }}
                    disabled={disabled}
                    min={question.settings?.minDate}
                    max={question.settings?.maxDate || '9999-12-31'}
                    className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
            );

        case QuestionType.TIME:
            return (
                <input
                    type="time"
                    value={value?.textValue || ''}
                    onChange={(e) => {
                        // Basic validity check
                        if (e.target.validity.valid) {
                            onChange?.({ textValue: e.target.value });
                        }
                    }}
                    disabled={disabled}
                    className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
            );

        case QuestionType.MULTIPLE_CHOICE:
            return (
                <div className="space-y-2">
                    {question.options.map((option) => (
                        <label key={option.id} className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={option.id}
                                checked={value?.optionId === option.id}
                                onChange={() => onChange?.({ optionId: option.id, textValue: option.text })}
                                disabled={disabled}
                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                            />
                            <span className="ml-3 text-gray-700">{option.text}</span>
                        </label>
                    ))}
                </div>
            );

        case QuestionType.CHECKBOXES:
            return (
                <div className="space-y-2">
                    {question.options.map((option) => {
                        const selected = value?.metadata?.selectedOptions || [];
                        const isChecked = selected.includes(option.id);

                        return (
                            <label key={option.id} className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                        const newSelected = e.target.checked
                                            ? [...selected, option.id]
                                            : selected.filter((id: string) => id !== option.id);
                                        onChange?.({ metadata: { selectedOptions: newSelected } });
                                    }}
                                    disabled={disabled}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <span className="ml-3 text-gray-700">{option.text}</span>
                            </label>
                        );
                    })}
                </div>
            );

        case QuestionType.YES_NO:
            return (
                <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            name={`question-${question.id}`}
                            value="yes"
                            checked={value?.textValue === 'yes'}
                            onChange={() => onChange?.({ textValue: 'yes' })}
                            disabled={disabled}
                            className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <span className="ml-3 text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            name={`question-${question.id}`}
                            value="no"
                            checked={value?.textValue === 'no'}
                            onChange={() => onChange?.({ textValue: 'no' })}
                            disabled={disabled}
                            className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <span className="ml-3 text-gray-700">No</span>
                    </label>
                </div>
            );

        // Placeholder for other existing types
        default:
            return (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                        Question type "{question.type}" is not yet implemented in the renderer.
                    </p>
                </div>
            );
    }
}
