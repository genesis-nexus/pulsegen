import { Loader2, Sparkles } from 'lucide-react';

interface AILoadingStateProps {
  message?: string;
  subMessage?: string;
}

export default function AILoadingState({
  message = 'AI is thinking...',
  subMessage = 'This may take a few seconds'
}: AILoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative">
        <div className="absolute inset-0 animate-ping">
          <Sparkles className="w-12 h-12 text-primary-300" />
        </div>
        <Sparkles className="w-12 h-12 text-primary-600" />
      </div>
      <div className="mt-6 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
        <span className="text-lg font-medium text-gray-900">{message}</span>
      </div>
      {subMessage && (
        <p className="mt-2 text-sm text-gray-500">{subMessage}</p>
      )}
    </div>
  );
}
