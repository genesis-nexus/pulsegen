import { Question } from '../../types';

interface BoilerplateQuestionProps {
  question: Question;
  onChange?: (value: any) => void;
  value?: any;
  disabled?: boolean;
}

export default function BoilerplateQuestion({ question }: BoilerplateQuestionProps) {
  const settings = question.settings || {};
  const style = settings.style || 'default';

  const styleClasses = {
    default: 'bg-gray-50 border-gray-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200',
    success: 'bg-green-50 border-green-200',
  };

  return (
    <div
      className={`p-4 rounded-lg border ${styleClasses[style as keyof typeof styleClasses] || styleClasses.default}`}
    >
      {settings.allowHtml ? (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: settings.content || question.text }}
        />
      ) : (
        <div className="text-gray-700 whitespace-pre-wrap">
          {settings.content || question.text}
        </div>
      )}
    </div>
  );
}
