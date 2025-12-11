import { Question } from '../../../types';

interface StepGeneralSettingsProps {
    data: Partial<Question>;
    onChange: (data: Partial<Question>) => void;
}

export default function StepGeneralSettings({ data, onChange }: StepGeneralSettingsProps) {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2 px-3 border"
                    value={data.text || ''}
                    onChange={(e) => onChange({ text: e.target.value })}
                    placeholder="e.g., What is your favorite color?"
                    autoFocus
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description / Help Text
                </label>
                <textarea
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2 px-3 border"
                    value={data.description || ''}
                    onChange={(e) => onChange({ description: e.target.value })}
                    placeholder="Additional context for the respondent..."
                />
            </div>

            <div className="flex items-center space-x-4">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4 border-gray-300"
                        checked={data.isRequired || false}
                        onChange={(e) => onChange({ isRequired: e.target.checked })}
                    />
                    <span className="ml-2 text-sm text-gray-700">Required Answer</span>
                </label>

                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4 border-gray-300"
                        checked={data.isRandomized || false}
                        onChange={(e) => onChange({ isRandomized: e.target.checked })}
                    />
                    <span className="ml-2 text-sm text-gray-700">Randomize Options</span>
                </label>
            </div>
        </div>
    );
}
