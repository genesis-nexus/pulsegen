import { Link } from 'react-router-dom';
import { ArrowRight, LayoutTemplate, PenLine, Sparkles } from 'lucide-react';
import { SURVEY_TEMPLATES } from '../../data/surveyTemplates';

const PATHS = [
  {
    to: '/surveys/create-ai',
    icon: Sparkles,
    iconBg: 'bg-gradient-accent',
    title: 'Generate with AI',
    badge: 'Fastest',
    description:
      'Describe your survey in plain language and get a complete, ready-to-edit draft in seconds.',
    cta: 'Start generating',
  },
  {
    to: '/surveys/templates',
    icon: LayoutTemplate,
    iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
    title: 'Start from a template',
    badge: `${SURVEY_TEMPLATES.length} templates`,
    description:
      'NPS, CSAT, product-market fit, employee engagement and more — professionally designed and ready to customize.',
    cta: 'Browse templates',
  },
  {
    to: '/surveys/new',
    icon: PenLine,
    iconBg: 'bg-gradient-to-br from-slate-500 to-slate-700',
    title: 'Start from scratch',
    badge: 'Full control',
    description:
      'Open a blank canvas and build your survey question by question with the drag-and-drop editor.',
    cta: 'Open builder',
  },
];

export default function CreateSurvey() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
          Create a new survey
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          How would you like to start?
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PATHS.map((path) => {
          const Icon = path.icon;
          return (
            <Link
              key={path.to}
              to={path.to}
              className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col hover:shadow-xl hover:border-primary-400 dark:hover:border-primary-600 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${path.iconBg} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                  {path.badge}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {path.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 flex-1 mb-5">
                {path.description}
              </p>
              <span className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400">
                {path.cta}
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
