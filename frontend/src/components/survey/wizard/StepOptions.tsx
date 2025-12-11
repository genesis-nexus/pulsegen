import { Plus, Trash2, GripVertical } from 'lucide-react';
import { QuestionOption } from '../../../types';

interface StepOptionsProps {
    options: QuestionOption[];
    onChange: (options: QuestionOption[]) => void;
}

export default function StepOptions({ options, onChange }: StepOptionsProps) {
    const handleAddOption = () => {
        const newOption: QuestionOption = {
            id: Math.random().toString(36).substr(2, 9), // Temp ID
            questionId: '',
            text: '',
            value: `option${options.length + 1}`,
            order: options.length,
        };
        onChange([...options, newOption]);
    };

    const handleUpdateOption = (index: number, text: string) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], text, value: text }; // Auto-sync value for now
        onChange(newOptions);
    };

    const handleRemoveOption = (index: number) => {
        const newOptions = options.filter((_, i) => i !== index);
        onChange(newOptions);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-4 flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Answer Options</h3>
                <button
                    onClick={handleAddOption}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                </button>
            </div>

            <div className="space-y-3">
                {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                        <GripVertical className="w-5 h-5 text-gray-300 cursor-move" />
                        <div className="flex-1">
                            <input
                                type="text"
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2 px-3 border"
                                value={option.text}
                                onChange={(e) => handleUpdateOption(index, e.target.value)}
                                placeholder={`Option ${index + 1}`}
                                autoFocus={index === options.length - 1}
                            />
                        </div>
                        <button
                            onClick={() => handleRemoveOption(index)}
                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {options.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500 text-sm">No options added yet.</p>
                        <button
                            onClick={handleAddOption}
                            className="mt-2 text-primary-600 text-sm font-medium hover:underline"
                        >
                            Add your first option
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
