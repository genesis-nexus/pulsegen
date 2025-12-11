import { AlertCircle, RefreshCw } from 'lucide-react';

interface AIErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function AIErrorState({
  title = 'AI Error',
  message,
  onRetry
}: AIErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 text-center max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      )}
    </div>
  );
}
