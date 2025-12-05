import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Eye, Trash2, GripVertical, X, GitBranch, Sparkles, Lightbulb, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Survey, Question, QuestionType, QuestionOption, SurveyLogic } from '../../types';
import LogicBuilder from '../../components/surveys/LogicBuilder';
import {
  QuestionOptimizer,
  SuggestQuestions,
  SurveyHealthCheck,
} from '../../components/ai';

const QUESTION_TYPES = [
  { value: QuestionType.MULTIPLE_CHOICE, label: 'Multiple Choice' },
  { value: QuestionType.CHECKBOXES, label: 'Checkboxes' },
  { value: QuestionType.DROPDOWN, label: 'Dropdown' },
  { value: QuestionType.SHORT_TEXT, label: 'Short Text' },
  { value: QuestionType.LONG_TEXT, label: 'Long Text' },
  { value: QuestionType.RATING_SCALE, label: 'Rating Scale' },
  { value: QuestionType.LIKERT_SCALE, label: 'Likert Scale' },
  { value: QuestionType.SLIDER, label: 'Slider' },
  { value: QuestionType.NPS, label: 'NPS' },
  { value: QuestionType.RANKING, label: 'Ranking' },
  { value: QuestionType.MATRIX, label: 'Matrix' },
  { value: QuestionType.EMAIL, label: 'Email' },
  { value: QuestionType.NUMBER, label: 'Number' },
  { value: QuestionType.DATE, label: 'Date' },
  { value: QuestionType.TIME, label: 'Time' },
  { value: QuestionType.FILE_UPLOAD, label: 'File Upload' },
  { value: QuestionType.YES_NO, label: 'Yes/No' },
];

// Question types that support options
const OPTION_BASED_TYPES = [
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.CHECKBOXES,
  QuestionType.DROPDOWN,
  QuestionType.RANKING,
  QuestionType.MATRIX,
  QuestionType.LIKERT_SCALE,
];

export default function SurveyBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingQuestions, setEditingQuestions] = useState<Record<string, Partial<Question>>>({});
  const [logicBuilderOpen, setLogicBuilderOpen] = useState(false);
  const [selectedQuestionForLogic, setSelectedQuestionForLogic] = useState<Question | null>(null);
  const [surveyLogic, setSurveyLogic] = useState<SurveyLogic[]>([]);

  // AI Modal States
  const [showQuestionOptimizer, setShowQuestionOptimizer] = useState(false);
  const [showSuggestQuestions, setShowSuggestQuestions] = useState(false);
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: async () => {
      if (!id || id === 'new') return null;
      const response = await api.get(`/surveys/${id}`);
      const data = response.data.data as Survey;
      setTitle(data.title);
      setDescription(data.description || '');

      // Fetch logic rules
      try {
        const logicResponse = await api.get(`/surveys/${id}/logic`);
        setSurveyLogic(logicResponse.data.data || []);
      } catch (error) {
        console.error('Failed to fetch logic rules:', error);
      }

      return data;
    },
    enabled: !!id && id !== 'new',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/surveys', data),
    onSuccess: (response) => {
      toast.success('Survey created');
      navigate(`/surveys/${response.data.data.id}/edit`);
    },
    onError: () => toast.error('Failed to create survey'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/surveys/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      toast.success('Survey updated');
    },
    onError: () => toast.error('Failed to update survey'),
  });

  const addQuestionMutation = useMutation({
    mutationFn: (question: any) => api.post(`/surveys/${id}/questions`, question),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      toast.success('Question added');
    },
    onError: () => toast.error('Failed to add question'),
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ questionId, data }: { questionId: string; data: any }) =>
      api.put(`/surveys/questions/${questionId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      toast.success('Question updated');
    },
    onError: () => toast.error('Failed to update question'),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => api.delete(`/surveys/questions/${questionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      toast.success('Question deleted');
    },
    onError: () => toast.error('Failed to delete question'),
  });

  const addLogicMutation = useMutation({
    mutationFn: (logic: Partial<SurveyLogic>) => api.post(`/surveys/${id}/logic`, logic),
    onSuccess: (response) => {
      setSurveyLogic([...surveyLogic, response.data.data]);
      toast.success('Logic rule added');
      setLogicBuilderOpen(false);
    },
    onError: () => toast.error('Failed to add logic rule'),
  });

  const deleteLogicMutation = useMutation({
    mutationFn: (logicId: string) => api.delete(`/surveys/logic/${logicId}`),
    onSuccess: (_, logicId) => {
      setSurveyLogic(surveyLogic.filter((l) => l.id !== logicId));
      toast.success('Logic rule deleted');
    },
    onError: () => toast.error('Failed to delete logic rule'),
  });

  const publishMutation = useMutation({
    mutationFn: (status: string) => api.post(`/surveys/${id}/publish`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      toast.success('Survey published successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to publish survey';
      toast.error(message);
    },
  });

  const handleSave = () => {
    const data = { title, description };
    if (id && id !== 'new') {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAddQuestion = () => {
    // If survey hasn't been created yet, create it first
    if (!id || id === 'new') {
      if (!title.trim()) {
        toast.error('Please enter a survey title first');
        return;
      }

      // Create survey first, then add question
      createMutation.mutate(
        { title, description },
        {
          onSuccess: (response) => {
            const newSurveyId = response.data.data.id;
            // Add question to the newly created survey
            api.post(`/surveys/${newSurveyId}/questions`, {
              type: QuestionType.MULTIPLE_CHOICE,
              text: 'New Question',
              options: [
                { text: 'Option 1', value: 'option1' },
                { text: 'Option 2', value: 'option2' },
              ],
            });
          },
        }
      );
      return;
    }

    addQuestionMutation.mutate({
      type: QuestionType.MULTIPLE_CHOICE,
      text: 'New Question',
      options: [
        { text: 'Option 1', value: 'option1' },
        { text: 'Option 2', value: 'option2' },
      ],
    });
  };

  const getEditingQuestion = (questionId: string): Question => {
    const original = survey?.questions.find((q) => q.id === questionId);
    if (!original) return {} as Question;

    if (editingQuestions[questionId]) {
      return { ...original, ...editingQuestions[questionId] } as Question;
    }
    return original;
  };

  const updateEditingQuestion = (questionId: string, updates: Partial<Question>) => {
    setEditingQuestions((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        ...updates,
      },
    }));
  };

  const handleQuestionTextChange = (questionId: string, text: string) => {
    updateEditingQuestion(questionId, { text });
    // Debounced save would be better, but for now we'll save on blur
  };

  const handleQuestionTypeChange = (questionId: string, type: QuestionType) => {
    const question = getEditingQuestion(questionId);

    // Determine what options to use based on the new type
    let newOptions: QuestionOption[];
    if (OPTION_BASED_TYPES.includes(type)) {
      // If switching to an option-based type, keep existing options or create defaults
      if (question.options && question.options.length > 0) {
        newOptions = question.options;
      } else {
        newOptions = [
          { id: '', questionId, text: 'Option 1', value: 'option1', order: 0 },
          { id: '', questionId, text: 'Option 2', value: 'option2', order: 1 },
        ];
      }
    } else {
      // If switching to a non-option type, clear options
      newOptions = [];
    }

    updateEditingQuestion(questionId, { type, options: newOptions });

    // Save immediately when type changes
    const dataToSave: any = { type };
    if (OPTION_BASED_TYPES.includes(type)) {
      dataToSave.options = newOptions.map(o => ({ text: o.text, value: o.value }));
    } else {
      dataToSave.options = [];
    }

    saveQuestion(questionId, dataToSave);
  };

  const handleRequiredChange = (questionId: string, isRequired: boolean) => {
    updateEditingQuestion(questionId, { isRequired });
    saveQuestion(questionId, { isRequired });
  };

  const handleOptionChange = (questionId: string, optionIndex: number, text: string) => {
    const question = getEditingQuestion(questionId);
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = { ...newOptions[optionIndex], text, value: text.toLowerCase().replace(/\s+/g, '_') };
    updateEditingQuestion(questionId, { options: newOptions });
  };

  const handleAddOption = (questionId: string) => {
    const question = getEditingQuestion(questionId);
    const newOptions = [...(question.options || [])];
    const optionNum = newOptions.length + 1;
    newOptions.push({
      id: '',
      questionId,
      text: `Option ${optionNum}`,
      value: `option${optionNum}`,
      order: newOptions.length,
    });
    updateEditingQuestion(questionId, { options: newOptions });

    // Save the new option immediately
    saveQuestion(questionId, { options: newOptions.map(o => ({ text: o.text, value: o.value })) as any });
  };

  const handleRemoveOption = (questionId: string, optionIndex: number) => {
    const question = getEditingQuestion(questionId);
    const newOptions = question.options?.filter((_, i) => i !== optionIndex) || [];
    if (newOptions.length < 2) {
      toast.error('At least 2 options are required');
      return;
    }
    updateEditingQuestion(questionId, { options: newOptions });
    saveQuestion(questionId, { options: newOptions.map(o => ({ text: o.text, value: o.value })) as any });
  };

  const saveQuestion = (questionId: string, updates?: Partial<Question>) => {
    const question = getEditingQuestion(questionId);
    const dataToSave = updates || {
      type: question.type,
      text: question.text,
      isRequired: question.isRequired,
      options: question.options?.map((opt) => ({
        text: opt.text,
        value: opt.value,
      })),
    };

    updateQuestionMutation.mutate({ questionId, data: dataToSave });

    // Clear editing state after save
    setEditingQuestions((prev) => {
      const newState = { ...prev };
      delete newState[questionId];
      return newState;
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      deleteQuestionMutation.mutate(questionId);
    }
  };

  const handleOpenLogicBuilder = (question: Question) => {
    setSelectedQuestionForLogic(question);
    setLogicBuilderOpen(true);
  };

  const handleSaveLogic = (logic: Partial<SurveyLogic>) => {
    addLogicMutation.mutate(logic);
  };

  const handleDeleteLogic = (logicId: string) => {
    deleteLogicMutation.mutate(logicId);
  };

  const getLogicForQuestion = (questionId: string): SurveyLogic[] => {
    return surveyLogic.filter((l) => l.sourceQuestionId === questionId);
  };

  const handlePublish = () => {
    if (!survey) return;

    // Validate survey has questions
    if (!survey.questions || survey.questions.length === 0) {
      toast.error('Cannot publish survey without questions. Please add at least one question.');
      return;
    }

    // Confirm publishing
    if (confirm('Are you sure you want to publish this survey? It will become available to respondents.')) {
      publishMutation.mutate('ACTIVE');
    }
  };

  const handleUnpublish = () => {
    if (confirm('Are you sure you want to unpublish this survey? It will no longer be available to respondents.')) {
      publishMutation.mutate('DRAFT');
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">
            {id === 'new' ? 'Create Survey' : 'Edit Survey'}
          </h1>
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn btn-primary inline-flex items-center">
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
            {survey && (
              <>
                <button
                  onClick={() => window.open(`/s/${survey.slug}`, '_blank')}
                  className="btn btn-secondary inline-flex items-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </button>
                {survey.status === 'DRAFT' ? (
                  <button
                    onClick={handlePublish}
                    className="btn btn-success inline-flex items-center"
                    disabled={!survey.questions || survey.questions.length === 0}
                  >
                    Publish Survey
                  </button>
                ) : (
                  <button
                    onClick={handleUnpublish}
                    className="btn btn-secondary inline-flex items-center"
                  >
                    Unpublish
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {survey && survey.questions && survey.questions.length === 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  This survey has no questions yet. Add at least one question before publishing.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card space-y-4">
          <div>
            <label className="label">Survey Title</label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter survey title"
            />
          </div>
          <div>
            <label className="label">Description (Optional)</label>
            <textarea
              className="input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter survey description"
            />
          </div>
        </div>
      </div>

      {/* AI Toolbar */}
      {survey && (
        <div className="mb-6 bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-primary-900">AI Assistant</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSuggestQuestions(true)}
                className="btn btn-secondary inline-flex items-center text-sm"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Suggest Questions
              </button>
              <button
                onClick={() => setShowHealthCheck(true)}
                className="btn btn-secondary inline-flex items-center text-sm"
              >
                <Activity className="w-4 h-4 mr-2" />
                Health Check
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Questions</h2>
        <button
          onClick={handleAddQuestion}
          className="btn btn-primary inline-flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </button>
      </div>

      <div className="space-y-4">
        {survey?.questions.map((question, index) => {
          const editingQuestion = getEditingQuestion(question.id);

          return (
            <div key={question.id} className="card">
              <div className="flex items-start gap-4">
                <GripVertical className="w-5 h-5 text-gray-400 mt-2 cursor-move" />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Question {index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedQuestion(question);
                          setShowQuestionOptimizer(true);
                        }}
                        className="text-primary-600 hover:text-primary-700 p-1 rounded hover:bg-primary-50"
                        title="Improve with AI"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    className="input mb-2"
                    value={editingQuestion.text}
                    onChange={(e) => handleQuestionTextChange(question.id, e.target.value)}
                    onBlur={() => saveQuestion(question.id)}
                    placeholder="Question text"
                  />
                  <select
                    className="input mb-2"
                    value={editingQuestion.type}
                    onChange={(e) => handleQuestionTypeChange(question.id, e.target.value as QuestionType)}
                  >
                    {QUESTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {OPTION_BASED_TYPES.includes(editingQuestion.type) && (
                    <div className="space-y-2">
                      {editingQuestion.options?.map((option, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            className="input flex-1"
                            value={option.text}
                            onChange={(e) => handleOptionChange(question.id, i, e.target.value)}
                            onBlur={() => saveQuestion(question.id)}
                            placeholder={`Option ${i + 1}`}
                          />
                          {editingQuestion.options && editingQuestion.options.length > 2 && (
                            <button
                              onClick={() => handleRemoveOption(question.id, i)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddOption(question.id)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        + Add Option
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={editingQuestion.isRequired}
                        onChange={(e) => handleRequiredChange(question.id, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Required</span>
                    </label>
                    <button
                      onClick={() => handleOpenLogicBuilder(question)}
                      className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md inline-flex items-center transition-colors"
                      title="Configure skip logic for this question"
                    >
                      <GitBranch className="w-4 h-4 mr-1" />
                      <span className="font-medium">Skip Logic</span>
                      {getLogicForQuestion(question.id).length > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                          {getLogicForQuestion(question.id).length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {(!survey?.questions || survey.questions.length === 0) && (
          <div className="card text-center py-12">
            <div className="mb-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {id === 'new'
                ? 'Start building your survey by entering a title above and adding your first question.'
                : 'Add questions to start collecting responses. You can choose from multiple question types and configure skip logic.'}
            </p>
            <button onClick={handleAddQuestion} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2 inline" />
              Add Your First Question
            </button>
          </div>
        )}
      </div>

      {/* Logic Builder Modal */}
      {logicBuilderOpen && selectedQuestionForLogic && survey && (
        <LogicBuilder
          question={selectedQuestionForLogic}
          allQuestions={survey.questions}
          existingLogic={getLogicForQuestion(selectedQuestionForLogic.id)}
          onSave={handleSaveLogic}
          onDelete={handleDeleteLogic}
          onClose={() => setLogicBuilderOpen(false)}
        />
      )}

      {/* AI Modals */}
      {showQuestionOptimizer && selectedQuestion && (
        <QuestionOptimizer
          question={{
            id: selectedQuestion.id,
            text: selectedQuestion.text,
            type: selectedQuestion.type,
            options: selectedQuestion.options,
          }}
          onClose={() => {
            setShowQuestionOptimizer(false);
            setSelectedQuestion(null);
          }}
          onApply={(improvements) => {
            // Apply improvements to question
            if (selectedQuestion) {
              updateQuestionMutation.mutate({
                questionId: selectedQuestion.id,
                data: improvements,
              });
            }
            queryClient.invalidateQueries({ queryKey: ['survey', id] });
          }}
        />
      )}

      {showSuggestQuestions && survey && (
        <SuggestQuestions
          surveyId={survey.id}
          surveyTitle={survey.title}
          existingQuestions={survey.questions.map((q) => q.text)}
          onClose={() => setShowSuggestQuestions(false)}
          onAddQuestion={(question) => {
            addQuestionMutation.mutate(question);
          }}
        />
      )}

      {showHealthCheck && survey && (
        <SurveyHealthCheck
          survey={{
            id: survey.id,
            title: survey.title,
            description: survey.description,
            questions: survey.questions,
          }}
          onClose={() => setShowHealthCheck(false)}
        />
      )}
    </div>
  );
}
