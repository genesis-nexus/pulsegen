import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Copy, BarChart, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Survey } from '../../types';

export default function SurveyList() {
  const queryClient = useQueryClient();

  const { data: surveys, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const response = await api.get('/surveys');
      return response.data.data as Survey[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/surveys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success('Survey deleted');
    },
    onError: () => {
      toast.error('Failed to delete survey');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/surveys/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success('Survey duplicated');
    },
    onError: () => {
      toast.error('Failed to duplicate survey');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Surveys</h1>
        <Link to="/surveys/new" className="btn btn-primary inline-flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Create Survey
        </Link>
      </div>

      {surveys && surveys.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <div key={survey.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{survey.title}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${survey.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : survey.status === 'DRAFT'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                >
                  {survey.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {survey.description || 'No description'}
              </p>

              <div className="flex items-center text-sm mb-4">
                <span className={survey._count?.questions === 0 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                  {survey._count?.questions || 0} questions
                  {survey._count?.questions === 0 && ' ⚠️'}
                </span>
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-gray-500">{survey._count?.responses || 0} responses</span>
              </div>
              {survey._count?.questions === 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded p-2 mb-4">
                  <p className="text-xs text-orange-800">
                    This survey has no questions. Add questions before publishing.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  to={`/surveys/${survey.id}/edit`}
                  className="flex-1 btn btn-secondary text-sm inline-flex items-center justify-center"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Link>
                <Link
                  to={`/surveys/${survey.id}/analytics`}
                  className="flex-1 btn btn-secondary text-sm inline-flex items-center justify-center"
                >
                  <BarChart className="w-4 h-4 mr-1" />
                  Analytics
                </Link>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => duplicateMutation.mutate(survey.id)}
                  className="flex-1 btn btn-secondary text-sm inline-flex items-center justify-center"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this survey?')) {
                      deleteMutation.mutate(survey.id);
                    }
                  }}
                  className="flex-1 btn btn-danger text-sm inline-flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys yet</h3>
          <p className="text-gray-600 mb-4">Create your first survey to get started</p>
          <Link to="/surveys/new" className="btn btn-primary">
            Create Survey
          </Link>
        </div>
      )}
    </div>
  );
}
