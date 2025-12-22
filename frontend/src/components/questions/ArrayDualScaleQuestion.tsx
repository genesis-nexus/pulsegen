import { useState } from 'react';
import { Question } from '../../types';

interface ArrayDualScaleQuestionProps {
  question: Question;
  onChange?: (value: any) => void;
  value?: any;
  disabled?: boolean;
}

export default function ArrayDualScaleQuestion({
  question,
  onChange,
  value,
  disabled,
}: ArrayDualScaleQuestionProps) {
  const settings = question.settings || {};
  const rows: string[] = settings.rows || ['Row 1', 'Row 2'];
  const scale1Label = settings.scale1Label || 'Importance';
  const scale2Label = settings.scale2Label || 'Satisfaction';
  const steps = settings.steps || 5;
  const scale1Options: string[] = settings.scale1Options || [];
  const scale2Options: string[] = settings.scale2Options || [];

  const [selections, setSelections] = useState<Record<string, { scale1: number | null; scale2: number | null }>>(
    value?.metadata?.dualScaleMatrix || {}
  );

  const handleSelect = (rowIndex: number, scale: 'scale1' | 'scale2', stepValue: number) => {
    if (disabled) return;

    const newSelections = {
      ...selections,
      [rowIndex]: {
        ...selections[rowIndex],
        [scale]: stepValue,
      },
    };

    setSelections(newSelections);

    if (onChange) {
      onChange({
        metadata: {
          dualScaleMatrix: newSelections,
        },
      });
    }
  };

  const getOptionLabel = (options: string[], index: number): string => {
    return options[index] || `${index + 1}`;
  };

  return (
    <>
      {/* Desktop: Table layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th
                colSpan={steps}
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300"
              >
                {scale1Label}
              </th>
              <th
                colSpan={steps}
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {scale2Label}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {row}
                </td>

                {/* Scale 1 */}
                {Array.from({ length: steps }, (_, i) => {
                  const stepValue = i + 1;
                  const isSelected = selections[rowIndex]?.scale1 === stepValue;

                  return (
                    <td key={`scale1-${i}`} className="px-2 py-3 text-center border-r border-gray-300">
                      <button
                        type="button"
                        onClick={() => handleSelect(rowIndex, 'scale1', stepValue)}
                        disabled={disabled}
                        className={`
                          w-8 h-8 rounded-full transition-all
                          ${isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-blue-100 text-gray-600'
                          }
                          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        title={getOptionLabel(scale1Options, i)}
                      >
                        {stepValue}
                      </button>
                    </td>
                  );
                })}

                {/* Scale 2 */}
                {Array.from({ length: steps }, (_, i) => {
                  const stepValue = i + 1;
                  const isSelected = selections[rowIndex]?.scale2 === stepValue;

                  return (
                    <td key={`scale2-${i}`} className="px-2 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleSelect(rowIndex, 'scale2', stepValue)}
                        disabled={disabled}
                        className={`
                          w-8 h-8 rounded-full transition-all
                          ${isSelected
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 hover:bg-green-100 text-gray-600'
                          }
                          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        title={getOptionLabel(scale2Options, i)}
                      >
                        {stepValue}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Desktop Legend */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <div className="font-medium mb-1">{scale1Label}:</div>
            {scale1Options.map((label, i) => (
              <div key={i}>{i + 1} = {label}</div>
            ))}
          </div>
          <div>
            <div className="font-medium mb-1">{scale2Label}:</div>
            {scale2Options.map((label, i) => (
              <div key={i}>{i + 1} = {label}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: Card-based layout */}
      <div className="md:hidden space-y-4">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="bg-gray-50 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-4">{row}</div>

            {/* Scale 1 */}
            <div className="mb-4">
              <div className="text-sm font-medium text-blue-600 mb-2">{scale1Label}</div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: steps }, (_, i) => {
                  const stepValue = i + 1;
                  const isSelected = selections[rowIndex]?.scale1 === stepValue;
                  return (
                    <button
                      key={`scale1-${i}`}
                      type="button"
                      onClick={() => handleSelect(rowIndex, 'scale1', stepValue)}
                      disabled={disabled}
                      className={`
                        min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 active:bg-blue-50'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {stepValue}
                      {scale1Options[i] && (
                        <span className="block text-xs mt-0.5 opacity-80">{scale1Options[i]}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scale 2 */}
            <div>
              <div className="text-sm font-medium text-green-600 mb-2">{scale2Label}</div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: steps }, (_, i) => {
                  const stepValue = i + 1;
                  const isSelected = selections[rowIndex]?.scale2 === stepValue;
                  return (
                    <button
                      key={`scale2-${i}`}
                      type="button"
                      onClick={() => handleSelect(rowIndex, 'scale2', stepValue)}
                      disabled={disabled}
                      className={`
                        min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${isSelected
                          ? 'bg-green-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300 active:bg-green-50'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {stepValue}
                      {scale2Options[i] && (
                        <span className="block text-xs mt-0.5 opacity-80">{scale2Options[i]}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
