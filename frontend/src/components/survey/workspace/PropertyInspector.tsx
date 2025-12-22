
import { useState } from 'react';
import { Question, QuestionType } from '../../../types';
import { Sliders, Type, List, Trash2, Plus } from 'lucide-react';

interface SurveySettingsData {
  title: string;
  description: string;
  showProgressBar: boolean;
  progressBarPosition: string;
  progressBarStyle: string;
  progressBarFormat: string;
  paginationMode: string;
  questionsPerPage: number;
}

interface PropertyInspectorProps {
  question: Question | null;
  onUpdate: (data: Partial<Question>) => void;
  surveySettings: SurveySettingsData;
  onUpdateSurveySettings: (data: Partial<SurveySettingsData>) => void;
}

type Tab = 'properties' | 'options' | 'logic' | 'survey';

export default function PropertyInspector({
  question,
  onUpdate,
  surveySettings,
  onUpdateSurveySettings
}: PropertyInspectorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('properties');

  // Switch to properties tab when a question is selected
  if (question && activeTab === 'survey') {
    setActiveTab('properties');
  }

  // If no question is selected, default to survey settings
  if (!question && activeTab !== 'survey') {
    // We can just render the settings directly or force the tab
  }

  const showOptions = question ? (
    question.type === QuestionType.MULTIPLE_CHOICE ||
    question.type === QuestionType.CHECKBOXES ||
    question.type === QuestionType.DROPDOWN
  ) : false;

  if (!question) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Survey Settings</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Survey Title</label>
            <input
              type="text"
              value={surveySettings.title}
              onChange={(e) => onUpdateSurveySettings({ title: e.target.value })}
              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1.5"
              placeholder="Enter title"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={surveySettings.description}
              onChange={(e) => onUpdateSurveySettings({ description: e.target.value })}
              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
              rows={3}
              placeholder="Enter description"
            />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Progress Bar</h3>

            <label className="flex items-center justify-between text-sm text-gray-700 cursor-pointer mb-4">
              <span>Show Progress Bar</span>
              <input
                type="checkbox"
                checked={surveySettings.showProgressBar}
                onChange={(e) => onUpdateSurveySettings({ showProgressBar: e.target.checked })}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
            </label>

            {surveySettings.showProgressBar && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Position</label>
                  <select
                    value={surveySettings.progressBarPosition}
                    onChange={(e) => onUpdateSurveySettings({ progressBarPosition: e.target.value })}
                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Style</label>
                  <select
                    value={surveySettings.progressBarStyle}
                    onChange={(e) => onUpdateSurveySettings({ progressBarStyle: e.target.value })}
                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="bar">Bar</option>
                    <option value="steps">Steps</option>
                    <option value="minimal">Minimal</option>
                    <option value="combined">Combined</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Format</label>
                  <select
                    value={surveySettings.progressBarFormat}
                    onChange={(e) => onUpdateSurveySettings({ progressBarFormat: e.target.value })}
                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="percentage">Percentage %</option>
                    <option value="count">Count (1/5)</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Question Pagination</h3>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Display Mode</label>
              <select
                value={surveySettings.paginationMode}
                onChange={(e) => onUpdateSurveySettings({ paginationMode: e.target.value })}
                className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">All questions at once</option>
                <option value="single">One question per page</option>
                <option value="custom">Custom questions per page</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {surveySettings.paginationMode === 'all' && 'Show all questions on a single page'}
                {surveySettings.paginationMode === 'single' && 'Show one question at a time'}
                {surveySettings.paginationMode === 'custom' && 'Specify how many questions per page'}
              </p>
            </div>

            {surveySettings.paginationMode === 'custom' && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Questions Per Page
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={surveySettings.questionsPerPage}
                  onChange={(e) => onUpdateSurveySettings({ questionsPerPage: parseInt(e.target.value) || 1 })}
                  className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Show {surveySettings.questionsPerPage} question{surveySettings.questionsPerPage > 1 ? 's' : ''} per page
                </p>
              </div>
            )}
          </div>
        </div>
      </div >
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
            {question.type.replace('_', ' ')}
          </span>
          <span className="text-xs text-gray-400 font-mono">ID: {question.id.slice(0, 6)}</span>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-md">
          <TabButton
            active={activeTab === 'properties'}
            onClick={() => setActiveTab('properties')}
            icon={Sliders}
            label="Props"
          />
          {showOptions && (
            <TabButton
              active={activeTab === 'options'}
              onClick={() => setActiveTab('options')}
              icon={List}
              label="Options"
            />
          )}
          <TabButton
            active={activeTab === 'logic'}
            onClick={() => setActiveTab('logic')}
            icon={Type} // Placeholder icon for logic
            label="Logic"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'properties' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Question Text</label>
              <textarea
                value={question.text}
                onChange={(e) => onUpdate({ text: e.target.value })}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={question.description || ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                rows={2}
              />
            </div>

            <div className="pt-4 border-t border-gray-200 space-y-3">
              <label className="flex items-center justify-between text-sm text-gray-700 cursor-pointer">
                <span>Required</span>
                <input
                  type="checkbox"
                  checked={question.isRequired}
                  onChange={(e) => onUpdate({ isRequired: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between text-sm text-gray-700 cursor-pointer">
                <span>Randomize Options</span>
                <input
                  type="checkbox"
                  checked={question.isRandomized}
                  onChange={(e) => onUpdate({ isRandomized: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
              </label>
            </div>
          </div>
        )}

        {activeTab === 'options' && showOptions && (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 group">
                <div className="flex-1">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = [...question.options];
                      newOptions[index] = { ...option, text: e.target.value, value: e.target.value };
                      onUpdate({ options: newOptions });
                    }}
                    className="w-full px-2 py-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <button
                  onClick={() => {
                    const newOptions = question.options.filter((_, i) => i !== index);
                    onUpdate({ options: newOptions });
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              onClick={() => {
                const newOption = {
                  id: Math.random().toString(36).substr(2, 9),
                  questionId: question.id,
                  text: `Option ${question.options.length + 1} `,
                  value: `option_${question.options.length + 1} `,
                  order: question.options.length,
                };
                onUpdate({ options: [...question.options, newOption] });
              }}
              className="w-full mt-2 flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </button>
          </div>
        )}

        {activeTab === 'logic' && (
          <div className="text-center py-8 text-gray-500 text-sm">
            <p className="mb-2">Advanced Skip Logic</p>
            <p className="text-xs">Configure where the user goes next based on their answer.</p>
            <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-100 text-yellow-800 text-xs">
              Coming soon: Visual logic builder
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded
        transition-colors
        ${active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }
      `}
    >
      <Icon className="w-3 h-3 mr-1.5" />
      {label}
    </button>
  );
}
