import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, FileText, BarChart, Users, Sparkles } from 'lucide-react';
import api from '../lib/api';
import { Survey } from '../types';

export default function Dashboard() {
  const { data: surveys } = useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const response = await api.get('/surveys');
      return response.data.data as Survey[];
    },
  });

  const totalSurveys = surveys?.length || 0;
  const activeSurveys = surveys?.filter((s) => s.status === 'ACTIVE').length || 0;
  const totalResponses = surveys?.reduce((acc, s) => acc + (s._count?.responses || 0), 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            to="/surveys/create-ai"
            className="btn bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-700 hover:to-purple-700 inline-flex items-center"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Create with AI
          </Link>
          <Link to="/surveys/new" className="btn btn-secondary inline-flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Blank Survey
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Surveys</p>
              <p className="text-2xl font-bold text-gray-900">{totalSurveys}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Surveys</p>
              <p className="text-2xl font-bold text-gray-900">{activeSurveys}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Responses</p>
              <p className="text-2xl font-bold text-gray-900">{totalResponses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent surveys */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Surveys</h2>
        {surveys && surveys.length > 0 ? (
          <div className="space-y-4">
            {surveys.slice(0, 5).map((survey) => (
              <Link
                key={survey.id}
                to={`/surveys/${survey.id}/edit`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{survey.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {survey._count?.questions || 0} questions • {survey._count?.responses || 0}{' '}
                      responses
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      survey.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : survey.status === 'DRAFT'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {survey.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No surveys yet</p>
            <Link to="/surveys/new" className="btn btn-primary">
              Create Your First Survey
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
