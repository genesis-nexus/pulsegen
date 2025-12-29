import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Copy,
  BarChart,
  Edit,
  Sparkles,
  Users,
  Search,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Survey } from '../../types';

export default function SurveyList() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  // Filter surveys based on search query
  const filteredSurveys = useMemo(() => {
    if (!surveys) return [];
    if (!searchQuery.trim()) return surveys;

    const query = searchQuery.toLowerCase();
    return surveys.filter(
      (survey) =>
        survey.title.toLowerCase().includes(query) ||
        (survey.description && survey.description.toLowerCase().includes(query))
    );
  }, [surveys, searchQuery]);

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Surveys</h1>
        <div className="flex gap-3">
          <Link to="/surveys/create-ai" className="btn btn-primary">
            <Sparkles className="w-5 h-5 mr-2" />
            Create with AI
          </Link>
          <Link to="/surveys/new" className="btn btn-secondary">
            <Plus className="w-5 h-5 mr-2" />
            Blank Survey
          </Link>
        </div>
      </div>

      {/* Search and View Toggle */}
      {surveys && surveys.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search surveys by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Search Results Count */}
      {searchQuery && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {filteredSurveys.length} {filteredSurveys.length === 1 ? 'survey' : 'surveys'} found
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      )}

      {surveys && surveys.length > 0 ? (
        filteredSurveys.length > 0 ? (
          viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSurveys.map((survey) => (
                <div key={survey.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{survey.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        survey.status === 'ACTIVE'
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                          : survey.status === 'DRAFT'
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                          : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                      }`}
                    >
                      {survey.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {survey.description || 'No description'}
                  </p>

                  <div className="flex items-center text-sm mb-4">
                    <span
                      className={
                        survey._count?.questions === 0
                          ? 'text-amber-600 dark:text-amber-400 font-medium'
                          : 'text-slate-500 dark:text-slate-400'
                      }
                    >
                      {survey._count?.questions || 0} questions
                      {survey._count?.questions === 0 && ' ⚠️'}
                    </span>
                    <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {survey._count?.responses || 0} responses
                    </span>
                  </div>
                  {survey._count?.questions === 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-2 mb-4">
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        This survey has no questions. Add questions before publishing.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 justify-center">
                    <Link
                      to={`/surveys/${survey.id}/edit`}
                      className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors"
                      title="Edit survey"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/surveys/${survey.id}/analytics`}
                      className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors"
                      title="View analytics"
                    >
                      <BarChart className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/surveys/${survey.id}/participants`}
                      className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors"
                      title="Manage participants"
                    >
                      <Users className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => duplicateMutation.mutate(survey.id)}
                      className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors"
                      title="Duplicate survey"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this survey?')) {
                          deleteMutation.mutate(survey.id);
                        }
                      }}
                      className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/40 dark:hover:text-red-300 transition-colors"
                      title="Delete survey"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Survey
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Responses
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredSurveys.map((survey) => (
                    <tr
                      key={survey.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                            {survey.title}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                            {survey.description || 'No description'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            survey.status === 'ACTIVE'
                              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                              : survey.status === 'DRAFT'
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                              : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {survey.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={
                            survey._count?.questions === 0
                              ? 'text-amber-600 dark:text-amber-400 font-medium'
                              : 'text-slate-700 dark:text-slate-300'
                          }
                        >
                          {survey._count?.questions || 0}
                          {survey._count?.questions === 0 && ' ⚠️'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300">
                        {survey._count?.responses || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/surveys/${survey.id}/edit`}
                            className="p-2 text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/surveys/${survey.id}/analytics`}
                            className="p-2 text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
                            title="Analytics"
                          >
                            <BarChart className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/surveys/${survey.id}/participants`}
                            className="p-2 text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
                            title="Participants"
                          >
                            <Users className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => duplicateMutation.mutate(survey.id)}
                            className="p-2 text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this survey?')) {
                                deleteMutation.mutate(survey.id);
                              }
                            }}
                            className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* No search results */
          <div className="text-center py-12 card">
            <Search className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No surveys found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No surveys match your search "{searchQuery}"
            </p>
            <button onClick={() => setSearchQuery('')} className="btn btn-secondary">
              Clear search
            </button>
          </div>
        )
      ) : (
        <div className="text-center py-12 card">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No surveys yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Create your first survey to get started</p>
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
  );
}
