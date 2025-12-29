import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, FileText, BarChart, Users, Sparkles, TrendingUp, ArrowUpRight } from 'lucide-react';
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
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back! Here's an overview of your surveys.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/surveys/create-ai"
            className="btn btn-primary"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Create with AI
          </Link>
          <Link to="/surveys/new" className="btn btn-secondary">
            <Plus className="w-5 h-5 mr-2" />
            Blank Survey
          </Link>
        </div>
      </div>

      {/* Stats Cards - matching hero banner style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="stats-card group hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Surveys</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalSurveys}</p>
            <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors">
              <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div className="stats-card group hover:shadow-md hover:border-green-300 dark:hover:border-green-700 transition-all">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Active Surveys</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{activeSurveys}</p>
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
              <BarChart className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          {activeSurveys > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Collecting responses
            </p>
          )}
        </div>

        <div className="stats-card group hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Responses</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalResponses.toLocaleString()}</p>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="stats-card group hover:shadow-md hover:border-accent-300 dark:hover:border-accent-700 transition-all bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">AI Insights</p>
            <span className="badge-accent">AI</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {totalResponses > 0 ? 'Analyze responses with AI' : 'Create surveys to unlock insights'}
          </p>
          <Link
            to="/ai/chat"
            className="inline-flex items-center text-xs text-primary-600 dark:text-primary-400 mt-2 hover:underline"
          >
            Open AI Chat <ArrowUpRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </div>

      {/* Recent surveys */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-heading">Recent Surveys</h2>
          {surveys && surveys.length > 5 && (
            <Link to="/surveys" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              View all
            </Link>
          )}
        </div>

        {surveys && surveys.length > 0 ? (
          <div className="space-y-3">
            {surveys.slice(0, 5).map((survey) => (
              <Link
                key={survey.id}
                to={`/surveys/${survey.id}/edit`}
                className="block p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white">{survey.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {survey._count?.questions || 0} questions • {survey._count?.responses || 0} responses
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      survey.status === 'ACTIVE'
                        ? 'badge-success'
                        : survey.status === 'DRAFT'
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        : 'badge-danger'
                    }`}
                  >
                    {survey.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No surveys yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              Get started by creating your first survey. Use AI to generate questions or start from scratch.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/surveys/create-ai" className="btn btn-primary">
                <Sparkles className="w-4 h-4 mr-2" />
                Create with AI
              </Link>
              <Link to="/surveys/new" className="btn btn-secondary">
                <Plus className="w-4 h-4 mr-2" />
                Blank Survey
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
