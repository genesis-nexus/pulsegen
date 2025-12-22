import { useState } from 'react';
import { Question } from '../../types';

interface GenderQuestionProps {
  question: Question;
  onChange?: (value: any) => void;
  value?: any;
  disabled?: boolean;
}

export default function GenderQuestion({ question, onChange, value, disabled }: GenderQuestionProps) {
  const settings = question.settings || {};
  const options: string[] = settings.options || ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
  const allowCustom = settings.allowCustom !== false;
  const customLabel = settings.customLabel || 'Other (please specify)';

  const [selectedOption, setSelectedOption] = useState(value?.textValue || '');
  const [customValue, setCustomValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(
    value?.textValue && !options.includes(value.textValue)
  );

  const handleChange = (option: string) => {
    setSelectedOption(option);

    if (option === 'custom') {
      setShowCustomInput(true);
      if (onChange && customValue) {
        onChange({ textValue: customValue });
      }
    } else {
      setShowCustomInput(false);
      if (onChange) {
        onChange({ textValue: option });
      }
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomValue(val);
    if (onChange) {
      onChange({ textValue: val });
    }
  };

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <label key={option} className="flex items-center cursor-pointer">
          <input
            type="radio"
            name={`gender-${question.id}`}
            value={option}
            checked={selectedOption === option && !showCustomInput}
            onChange={() => handleChange(option)}
            disabled={disabled}
            className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
          />
          <span className="ml-3 text-gray-700">{option}</span>
        </label>
      ))}

      {allowCustom && (
        <>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name={`gender-${question.id}`}
              value="custom"
              checked={showCustomInput}
              onChange={() => handleChange('custom')}
              disabled={disabled}
              className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
            />
            <span className="ml-3 text-gray-700">{customLabel}</span>
          </label>

          {showCustomInput && (
            <input
              type="text"
              value={customValue}
              onChange={handleCustomChange}
              disabled={disabled}
              placeholder="Please specify..."
              className="ml-7 mt-2 block w-full md:w-96 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          )}
        </>
      )}
    </div>
  );
}
