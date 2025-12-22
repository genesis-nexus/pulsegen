import { useState } from 'react';
import { Question, QuestionOption } from '../../types';
import { Check } from 'lucide-react';

interface ImageSelectQuestionProps {
  question: Question;
  onChange?: (value: any) => void;
  value?: any;
  disabled?: boolean;
}

export default function ImageSelectQuestion({ question, onChange, value, disabled }: ImageSelectQuestionProps) {
  const settings = question.settings || {};
  const multiple = settings.multiple || false;
  const columns = settings.columns || 3;
  const imageSize = settings.imageSize || 'medium';
  const showLabels = settings.showLabels !== false;

  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    value?.metadata?.selectedOptions || (value?.optionId ? [value.optionId] : [])
  );

  const sizeClasses = {
    small: 'h-32',
    medium: 'h-48',
    large: 'h-64',
  };

  const handleSelect = (optionId: string) => {
    if (disabled) return;

    let newSelected: string[];

    if (multiple) {
      if (selectedOptions.includes(optionId)) {
        newSelected = selectedOptions.filter(id => id !== optionId);
      } else {
        newSelected = [...selectedOptions, optionId];
      }
    } else {
      newSelected = [optionId];
    }

    setSelectedOptions(newSelected);

    if (onChange) {
      if (multiple) {
        onChange({
          metadata: {
            selectedOptions: newSelected,
          },
        });
      } else {
        onChange({
          optionId: newSelected[0] || null,
          textValue: question.options.find(o => o.id === newSelected[0])?.text || '',
        });
      }
    }
  };

  // Responsive grid columns: 1 col on mobile, scales up on larger screens
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  };

  return (
    <div className={`grid ${gridCols[columns as keyof typeof gridCols] || 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'} gap-3 sm:gap-4`}>
      {question.options.map((option: QuestionOption) => {
        const isSelected = selectedOptions.includes(option.id);

        return (
          <div
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={`
              relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all
              ${isSelected
                ? 'border-primary-500 ring-2 ring-primary-200'
                : 'border-gray-200 hover:border-primary-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {option.imageUrl ? (
              <img
                src={option.imageUrl}
                alt={option.text}
                className={`w-full object-cover ${sizeClasses[imageSize as keyof typeof sizeClasses]}`}
              />
            ) : (
              <div className={`w-full ${sizeClasses[imageSize as keyof typeof sizeClasses]} bg-gray-100 flex items-center justify-center`}>
                <span className="text-gray-400">No image</span>
              </div>
            )}

            {isSelected && (
              <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}

            {showLabels && (
              <div className="p-3 bg-white border-t border-gray-200">
                <p className="text-sm font-medium text-gray-900 text-center">
                  {option.text}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
