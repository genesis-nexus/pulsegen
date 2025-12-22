import { useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Question, QuestionType } from '../../../types';
import StepTypeSelection from './StepTypeSelection';
import StepGeneralSettings from './StepGeneralSettings';
import StepOptions from './StepOptions';

interface QuestionWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (question: Partial<Question>) => void;
    initialData?: Partial<Question>;
}

enum WizardStep {
    TYPE = 0,
    GENERAL = 1,
    OPTIONS = 2,
    SETTINGS = 3,
}

export default function QuestionWizard({
    isOpen,
    onClose,
    onSave,
    initialData,
}: QuestionWizardProps) {
    const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.TYPE);
    const [questionData, setQuestionData] = useState<Partial<Question>>(
        initialData || {
            type: QuestionType.MULTIPLE_CHOICE,
            text: '',
            isRequired: false,
            options: [],
        }
    );

    const steps = [
        { id: WizardStep.TYPE, title: 'Question Type' },
        { id: WizardStep.GENERAL, title: 'General Settings' },
        { id: WizardStep.OPTIONS, title: 'Options' },
        { id: WizardStep.SETTINGS, title: 'Advanced' },
    ];

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onSave(questionData);
            onClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const showOptionsStep =
        questionData.type === QuestionType.MULTIPLE_CHOICE ||
        questionData.type === QuestionType.CHECKBOXES ||
        questionData.type === QuestionType.DROPDOWN ||
        questionData.type === QuestionType.RANKING ||
        questionData.type === QuestionType.IMAGE_SELECT ||
        questionData.type === QuestionType.LIKERT_SCALE ||
        questionData.type === QuestionType.MATRIX ||
        questionData.type === QuestionType.ARRAY_DUAL_SCALE ||
        questionData.type === QuestionType.GENDER ||
        questionData.type === QuestionType.SEMANTIC_DIFFERENTIAL ||
        questionData.type === QuestionType.MULTIPLE_NUMERICAL ||
        questionData.type === QuestionType.RATING_SCALE;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                    &#8203;
                </span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {initialData ? 'Edit Question' : 'Add New Question'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        {/* Progress Steps */}
                        <div className="mt-6">
                            <nav aria-label="Progress">
                                <ol className="flex items-center">
                                    {steps.map((step, index) => {
                                        if (step.id === WizardStep.OPTIONS && !showOptionsStep) return null;

                                        return (
                                            <li
                                                key={step.id}
                                                className={`${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''
                                                    } relative`}
                                            >
                                                <div className="flex items-center">
                                                    <div
                                                        className={`${currentStep >= step.id
                                                            ? 'bg-primary-600'
                                                            : 'bg-gray-200'
                                                            } h-8 w-8 rounded-full flex items-center justify-center`}
                                                    >
                                                        <span className="text-white text-sm font-medium">
                                                            {index + 1}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className={`ml-4 text-sm font-medium ${currentStep >= step.id
                                                            ? 'text-primary-600'
                                                            : 'text-gray-500'
                                                            }`}
                                                    >
                                                        {step.title}
                                                    </span>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </nav>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-4 py-5 sm:p-6 min-h-[400px]">
                        {currentStep === WizardStep.TYPE && (
                            <StepTypeSelection
                                value={questionData.type}
                                onChange={(type: QuestionType) => setQuestionData({ ...questionData, type })}
                            />
                        )}
                        {currentStep === WizardStep.GENERAL && (
                            <StepGeneralSettings
                                data={questionData}
                                onChange={(data: Partial<Question>) => setQuestionData({ ...questionData, ...data })}
                            />
                        )}
                        {currentStep === WizardStep.OPTIONS && showOptionsStep && (
                            <StepOptions
                                options={questionData.options || []}
                                onChange={(options: any[]) => setQuestionData({ ...questionData, options })}
                            />
                        )}
                        {currentStep === WizardStep.SETTINGS && (
                            <div className="text-center py-12 text-gray-500">
                                Advanced settings (Logic, Validation) coming soon...
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse justify-between">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={handleNext}
                        >
                            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                            {currentStep !== steps.length - 1 && (
                                <ChevronRight className="w-4 h-4 ml-2" />
                            )}
                        </button>
                        {currentStep > 0 && (
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                onClick={handleBack}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Back
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
