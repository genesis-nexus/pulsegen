import { useState, useEffect } from 'react';
import { Question } from '../../types';

interface NumericalField {
  name: string;
  label: string;
  min?: number;
  max?: number;
  suffix?: string;
}

interface MultipleNumericalQuestionProps {
  question: Question;
  onChange?: (value: any) => void;
  value?: any;
  disabled?: boolean;
}

export default function MultipleNumericalQuestion({
  question,
  onChange,
  value,
  disabled,
}: MultipleNumericalQuestionProps) {
  const settings = question.settings || {};
  const fields: NumericalField[] = (settings.fields || []).map((f: any, i: number) => ({
    ...f,
    name: f.name || `field_${i}`
  }));

  if (fields.length === 0) {
    fields.push({ name: 'field1', label: 'Field 1', min: undefined, max: undefined, suffix: '' });
  }
  const validateSum = settings.validateSum || false;
  const targetSum = settings.targetSum || null;

  const [values, setValues] = useState<Record<string, number>>(
    value?.metadata?.numericalValues || {}
  );
  const [sumError, setSumError] = useState<string>('');

  const currentSum = Object.values(values).reduce((acc, val) => acc + (val || 0), 0);

  useEffect(() => {
    if (validateSum && targetSum !== null) {
      if (currentSum !== targetSum) {
        setSumError(`Values must sum to ${targetSum} (current: ${currentSum})`);
      } else {
        setSumError('');
      }
    }
  }, [values, validateSum, targetSum, currentSum]);

  const handleChange = (fieldName: string, inputValue: string) => {
    const numValue = inputValue === '' ? 0 : parseFloat(inputValue);
    const newValues = { ...values, [fieldName]: numValue };
    setValues(newValues);

    if (onChange) {
      onChange({
        metadata: {
          numericalValues: newValues,
        },
      });
    }
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="flex items-center gap-3">
          <label className="flex-1 text-sm font-medium text-gray-700">
            {field.label}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={values[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              min={field.min}
              max={field.max}
              disabled={disabled}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            {field.suffix && (
              <span className="text-sm text-gray-500">{field.suffix}</span>
            )}
          </div>
        </div>
      ))}

      {validateSum && targetSum !== null && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-gray-700">Total Sum:</span>
            <span
              className={`font-bold ${currentSum === targetSum ? 'text-green-600' : 'text-orange-600'
                }`}
            >
              {currentSum} / {targetSum}
            </span>
          </div>
          {sumError && (
            <p className="mt-1 text-xs text-orange-600">{sumError}</p>
          )}
        </div>
      )}
    </div>
  );
}
