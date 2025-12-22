import { Question } from '../../types';

interface EquationQuestionProps {
  question: Question;
  value?: any;
}

export default function EquationQuestion({ question, value }: EquationQuestionProps) {
  const settings = question.settings || {};
  const displayFormat = settings.displayFormat || 'number';
  const precision = settings.precision || 2;
  const prefix = settings.prefix || '';
  const suffix = settings.suffix || '';

  // In a real implementation, this would calculate based on other answers
  // For now, we'll just display the calculated value if available
  const calculatedValue = value?.numberValue ?? 0;

  const formatValue = (val: number): string => {
    if (displayFormat === 'currency') {
      return val.toFixed(precision);
    } else if (displayFormat === 'percentage') {
      return `${(val * 100).toFixed(precision)}%`;
    } else {
      return val.toFixed(precision);
    }
  };

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="text-sm text-gray-500 mb-2">Calculated Value</div>
      <div className="text-2xl font-bold text-gray-900">
        {prefix}
        {formatValue(calculatedValue)}
        {suffix}
      </div>
      {settings.formula && (
        <div className="mt-3 text-xs text-gray-400">
          Formula: <code className="bg-gray-100 px-2 py-1 rounded">{settings.formula}</code>
        </div>
      )}
    </div>
  );
}
