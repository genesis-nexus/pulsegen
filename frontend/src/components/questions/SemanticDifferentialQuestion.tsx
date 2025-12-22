import { useState } from 'react';
import { Question } from '../../types';

interface SemanticDifferentialQuestionProps {
  question: Question;
  onChange?: (value: any) => void;
  value?: any;
  disabled?: boolean;
}

export default function SemanticDifferentialQuestion({
  question,
  onChange,
  value,
  disabled,
}: SemanticDifferentialQuestionProps) {
  const settings = question.settings || {};
  const leftLabel = settings.leftLabel || 'Strongly Disagree';
  const rightLabel = settings.rightLabel || 'Strongly Agree';
  const steps = settings.steps || 7;
  const showMiddleLabel = settings.showMiddleLabel || false;
  const middleLabel = settings.middleLabel || 'Neutral';

  const [selectedValue, setSelectedValue] = useState<number | null>(
    value?.numberValue ?? null
  );

  const handleSelect = (stepValue: number) => {
    if (disabled) return;
    setSelectedValue(stepValue);
    if (onChange) {
      onChange({ numberValue: stepValue });
    }
  };

  const midpoint = Math.floor(steps / 2);

  return (
    <div className="space-y-4">
      {/* Labels */}
      <div className="flex justify-between items-center text-sm font-medium text-gray-700">
        <span>{leftLabel}</span>
        {showMiddleLabel && steps % 2 === 1 && (
          <span className="text-gray-500">{middleLabel}</span>
        )}
        <span>{rightLabel}</span>
      </div>

      {/* Scale */}
      <div className="flex justify-between items-center gap-2">
        {Array.from({ length: steps }, (_, i) => {
          const stepValue = i + 1;
          const isSelected = selectedValue === stepValue;
          const isMidpoint = steps % 2 === 1 && i === midpoint;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(stepValue)}
              disabled={disabled}
              className={`
                flex-1 h-12 rounded-lg border-2 transition-all
                ${isSelected
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'bg-white border-gray-300 hover:border-primary-300 text-gray-700'
                }
                ${isMidpoint ? 'border-dashed' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              aria-label={`Select ${stepValue} of ${steps}`}
            >
              {stepValue}
            </button>
          );
        })}
      </div>

      {/* Step indicators */}
      <div className="flex justify-between items-center text-xs text-gray-400">
        {Array.from({ length: steps }, (_, i) => (
          <span key={i} className="flex-1 text-center">
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
