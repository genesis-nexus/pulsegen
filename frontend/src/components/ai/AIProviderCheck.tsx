import { useQuery } from '@tanstack/react-query';
import { Sparkles, Settings, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface AIProviderCheckProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AIProviderCheck({ children, fallback }: AIProviderCheckProps) {
  const { data: providers, isLoading } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: async () => {
      const response = await api.get('/ai/providers');
      return response.data.data;
    },
  });

  const hasActiveProvider = providers && providers.length > 0 && providers.some((p: any) => p.isActive);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse flex items-center gap-2 text-gray-500">
          <Sparkles className="w-5 h-5" />
          <span>Checking AI configuration...</span>
        </div>
      </div>
    );
  }

  if (!hasActiveProvider) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-amber-800">AI Not Configured</h3>
            <p className="mt-1 text-sm text-amber-700">
              To use AI features, you need to configure an AI provider with your API key.
              We recommend OpenRouter for its free tier options.
            </p>
            <Link
              to="/settings/ai"
              className="mt-4 inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-medium"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure AI Provider
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
