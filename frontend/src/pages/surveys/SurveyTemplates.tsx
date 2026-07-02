import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  FileText,
  Loader2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import {
  SURVEY_TEMPLATES,
  TEMPLATE_CATEGORIES,
  SurveyTemplate,
  templateOptionsToPayload,
} from '../../data/surveyTemplates';

export default function SurveyTemplates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [previewTemplate, setPreviewTemplate] = useState<SurveyTemplate | null>(null);

  const filtered = useMemo(() => {
    return SURVEY_TEMPLATES.filter((t) => {
      if (category !== 'All' && t.category !== category) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [search, category]);

  const createMutation = useMutation({
    mutationFn: async (template: SurveyTemplate) => {
      const surveyResponse = await api.post('/surveys', {
        title: template.name,
        description: template.description,
      });
      const surveyId = surveyResponse.data.data.id as string;

      for (const question of template.questions) {
        await api.post(`/surveys/${surveyId}/questions`, {
          type: question.type,
          text: question.text,
          description: question.description,
          isRequired: question.isRequired ?? false,
          options: templateOptionsToPayload(question.options),
        });
      }
      return surveyId;
    },
    onSuccess: (surveyId) => {
      toast.success('Survey created from template');
      navigate(`/surveys/${surveyId}/edit`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create survey from template');
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/surveys/create"
          className="inline-flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Template Library</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Start with a professionally designed survey and customize it in the builder.
        </p>
      </div>

      {/* Search + Category filter */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="input pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', ...TEMPLATE_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-2 text-sm font-medium rounded-full transition-colors ${
                category === cat
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 card">
          <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="font-medium text-slate-900 dark:text-white mb-1">No templates found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Try a different search, or{' '}
            <Link to="/surveys/create-ai" className="text-primary-600 dark:text-primary-400 hover:underline">
              generate a custom survey with AI
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((template) => (
            <div
              key={template.id}
              className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all flex flex-col"
            >
              {/* Artwork */}
              <div className={`h-24 bg-gradient-to-br ${template.gradient} relative p-4 flex items-end`}>
                <span className="text-xs font-semibold text-white/90 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">
                  {template.category}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1.5">{template.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex-1">
                  {template.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <span className="inline-flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1" />
                    {template.questions.length} questions
                  </span>
                  <span className="inline-flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {template.duration}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="btn btn-outline btn-sm flex-1"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => createMutation.mutate(template)}
                    disabled={createMutation.isPending}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    {createMutation.isPending && createMutation.variables?.id === template.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Use template'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI callout */}
      <div className="mt-10 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Can't find the right template?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Describe your survey in plain language and let AI build it for you in seconds.
            </p>
          </div>
        </div>
        <Link to="/surveys/create-ai" className="btn btn-primary shrink-0">
          Generate with AI
        </Link>
      </div>

      {/* Preview modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`bg-gradient-to-br ${previewTemplate.gradient} px-6 py-5 relative`}>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-xs font-semibold text-white/90 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">
                {previewTemplate.category}
              </span>
              <h2 className="text-xl font-bold text-white mt-2">{previewTemplate.name}</h2>
              <p className="text-sm text-white/85 mt-1">{previewTemplate.description}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {previewTemplate.questions.map((q, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {q.text}
                      {q.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {q.type.replace(/_/g, ' ')}
                    </span>
                    {q.options && (
                      <ul className="mt-1.5 space-y-0.5">
                        {q.options.map((opt, i) => (
                          <li key={i} className="text-sm text-slate-600 dark:text-slate-400">
                            • {opt}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setPreviewTemplate(null)} className="btn btn-secondary">
                Close
              </button>
              <button
                onClick={() => createMutation.mutate(previewTemplate)}
                disabled={createMutation.isPending}
                className="btn btn-primary"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Use this template'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
