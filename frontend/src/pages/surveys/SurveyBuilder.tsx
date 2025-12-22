import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Eye, Split, Layout, Users } from 'lucide-react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Survey, Question, QuestionType, SurveyLogic } from '../../types';
import Toolbox from '../../components/survey/workspace/Toolbox';
import Canvas from '../../components/survey/workspace/Canvas';
import PropertyInspector from '../../components/survey/workspace/PropertyInspector';
import LogicEditor from '../../components/survey/workspace/LogicEditor';
import {
  QuestionOptimizer,
  SuggestQuestions,
  SurveyHealthCheck,
} from '../../components/ai';

// Question types that support options
/*
const OPTION_BASED_TYPES = [
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.CHECKBOXES,
  QuestionType.DROPDOWN,
  QuestionType.RANKING,
  QuestionType.MATRIX,
  QuestionType.LIKERT_SCALE,
];
*/

export default function SurveyBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [localQuestions, setLocalQuestions] = useState<Question[]>([]);
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [progressBarPosition, setProgressBarPosition] = useState('top');
  const [progressBarStyle, setProgressBarStyle] = useState('bar');
  const [progressBarFormat, setProgressBarFormat] = useState('percentage');
  const [paginationMode, setPaginationMode] = useState('all');
  const [questionsPerPage, setQuestionsPerPage] = useState(1);

  // AI & Logic State
  const [showQuestionOptimizer, setShowQuestionOptimizer] = useState(false);
  const [showSuggestQuestions, setShowSuggestQuestions] = useState(false);
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

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

  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: async () => {
      if (!id || id === 'new') return null;
      const response = await api.get(`/surveys/${id}`);
      const data = response.data.data as Survey;
      setTitle(data.title);
      setDescription(data.description || '');
      // Initialize settings
      setShowProgressBar(data.showProgressBar ?? true);
      setProgressBarPosition(data.progressBarPosition || 'top');
      setProgressBarStyle(data.progressBarStyle || 'bar');
      setProgressBarFormat(data.progressBarFormat || 'percentage');
      setPaginationMode(data.paginationMode || 'all');
      setQuestionsPerPage(data.questionsPerPage || 1);

      // Fetch logic rules
      try {
        const logicResponse = await api.get(`/surveys/${id}/logic`);
        const logics = logicResponse.data.data as SurveyLogic[] || [];

        if (data.questions) {
          data.questions = data.questions.map(q => ({
            ...q,
            logic: logics.filter(l => l.sourceQuestionId === q.id)
          }));
        }
      } catch (error) {
        console.error('Failed to fetch logic rules:', error);
      }
      return data;
    },
    enabled: !!id && id !== 'new',
  });

  // Effect to sync local state when survey loads
  useEffect(() => {
    if (survey?.questions) {
      setLocalQuestions(survey.questions);
    }
  }, [survey?.questions]);

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
    mutationFn: (question: Partial<Question>) => {
      return api.post(`/surveys/${id}/questions`, question);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      toast.success('Question added');
    },
    onError: () => toast.error('Failed to add question'),
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ questionId, data }: { questionId: string; data: Partial<Question> }) => {
      return api.patch(`/surveys/${id}/questions/${questionId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      toast.success('Question updated');
    },
    onError: () => toast.error('Failed to update question'),
  });

  /*
  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => api.delete(`/surveys/questions/${questionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      toast.success('Question deleted');
    },
    onError: () => toast.error('Failed to delete question'),
  });

  const deleteLogicMutation = useMutation({
    mutationFn: (logicId: string) => api.delete(`/surveys/logic/${logicId}`),
    onSuccess: (_, logicId) => {
      setSurveyLogic(surveyLogic.filter((l) => l.id !== logicId));
      toast.success('Logic rule deleted');
    },
    onError: () => toast.error('Failed to delete logic rule'),
  });
  */

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
    const data = {
      title,
      description,
      showProgressBar,
      progressBarPosition,
      progressBarStyle,
      progressBarFormat,
      paginationMode,
      questionsPerPage
    };
    if (id && id !== 'new') {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };



  const handleAddQuestion = (type: QuestionType) => {
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

    const newQuestionData = {
      type,
      text: 'New Question',
      options: (type === QuestionType.MULTIPLE_CHOICE || type === QuestionType.CHECKBOXES)
        ? [{ text: 'Option 1', value: 'option1', order: 0 } as any]
        : [],
    };

    addQuestionMutation.mutate(newQuestionData, {
      onSuccess: (data) => {
        setSelectedQuestionId(data.data.data.id);
      }
    });
  };

  const [currentView, setCurrentView] = useState<'design' | 'logic'>('design');

  const handleUpdateQuestion = (data: Partial<Question>) => {
    if (!selectedQuestionId) return;

    // Optimistic update locally
    setLocalQuestions(questions =>
      questions.map(q => q.id === selectedQuestionId ? { ...q, ...data } : q)
    );
  };

  const saveSelectedQuestion = () => {
    if (!selectedQuestionId) return;
    const question = localQuestions.find(q => q.id === selectedQuestionId);
    if (!question) return;

    api.put(`/surveys/${id}/questions/${selectedQuestionId}`, question)
      .then(() => toast.success('Question saved'))
      .catch(() => toast.error('Failed to save question'));
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    api.delete(`/surveys/${id}/questions/${questionId}`)
      .then(() => {
        toast.success('Question deleted');
        queryClient.invalidateQueries({ queryKey: ['survey', id] });
        if (selectedQuestionId === questionId) setSelectedQuestionId(null);
      })
      .catch(() => toast.error('Failed to delete question'));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(localQuestions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalQuestions(items);
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
    };
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 h-[calc(100vh-64px)] overflow-hidden">
      {/* Workspace Header */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-bold text-gray-900 border-none focus:ring-0 p-0 hover:bg-gray-50 rounded px-2"
            placeholder="Survey Title"
          />
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setCurrentView('design')}
            className={`
              flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors
              ${currentView === 'design' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
            `}
          >
            <Layout className="w-4 h-4 mr-2" />
            Design
          </button>
          <button
            onClick={() => setCurrentView('logic')}
            className={`
              flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors
              ${currentView === 'logic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
            `}
          >
            <Split className="w-4 h-4 mr-2" />
            Logic
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {selectedQuestionId && (
            <span className="text-xs text-gray-500 mr-2">Unsaved changes? Click Save &rarr;</span>
          )}
          <button onClick={saveSelectedQuestion} className="btn btn-secondary btn-sm" disabled={!selectedQuestionId}>
            Save Selected
          </button>
          <button onClick={handleSave} className="btn btn-primary btn-sm">
            <Save className="w-4 h-4 mr-2" />
            Save Survey
          </button>

          {survey?.status === 'ACTIVE' ? (
            <button
              onClick={handleUnpublish}
              className="btn btn-warning btn-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"
            >
              Unpublish
            </button>
          ) : (
            <button
              onClick={handlePublish}
              className="btn btn-success btn-sm bg-green-600 text-white hover:bg-green-700"
            >
              Publish
            </button>
          )}

          {survey && (
            <>
              <button
                onClick={() => window.open(`/s/${survey.slug}`, '_blank')}
                className="btn btn-secondary btn-sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </button>
              <button
                onClick={() => navigate(`/surveys/${survey.id}/participants`)}
                className="btn btn-secondary btn-sm"
                title="Manage Participants"
              >
                <Users className="w-4 h-4 mr-2" />
                Participants
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Toolbox (Only in Design view) */}
        {currentView === 'design' && (
          <Toolbox
            onAddQuestion={handleAddQuestion}
            questions={localQuestions}
            onSelectQuestion={setSelectedQuestionId}
            selectedQuestionId={selectedQuestionId}
          />
        )}

        {/* Center: Canvas or Logic Editor */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {currentView === 'design' ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Canvas
                survey={survey || null}
                questions={localQuestions}
                selectedQuestionId={selectedQuestionId}
                onSelectQuestion={setSelectedQuestionId}
                onDeleteQuestion={handleDeleteQuestion}
              />
            </DragDropContext>
          ) : (
            <LogicEditor
              questions={localQuestions}
              selectedQuestionId={selectedQuestionId}
              onSelectQuestion={setSelectedQuestionId}
              onUpdateLogic={(questionId, logic) => {
                setLocalQuestions(questions =>
                  questions.map(q => q.id === questionId ? { ...q, logic } : q)
                );
              }}
            />
          )}
        </div>

        {/* Right Panel: Inspector (Only in Design view, or context aware logic properties) */}
        {currentView === 'design' && (
          <PropertyInspector
            question={localQuestions.find(q => q.id === selectedQuestionId) || null}
            onUpdate={handleUpdateQuestion}
            surveySettings={{
              title,
              description,
              showProgressBar,
              progressBarPosition,
              progressBarStyle,
              progressBarFormat,
              paginationMode,
              questionsPerPage
            }}
            onUpdateSurveySettings={(settings: Partial<SurveySettingsData>) => {
              if (settings.showProgressBar !== undefined) setShowProgressBar(settings.showProgressBar);
              if (settings.progressBarPosition !== undefined) setProgressBarPosition(settings.progressBarPosition);
              if (settings.progressBarStyle !== undefined) setProgressBarStyle(settings.progressBarStyle);
              if (settings.progressBarFormat !== undefined) setProgressBarFormat(settings.progressBarFormat);
              if (settings.paginationMode !== undefined) setPaginationMode(settings.paginationMode);
              if (settings.questionsPerPage !== undefined) setQuestionsPerPage(settings.questionsPerPage);
              if (settings.title !== undefined) setTitle(settings.title);
              if (settings.description !== undefined) setDescription(settings.description);
            }}
          />
        )}
      </div>
      {/* AI Modals */}
      {
        showQuestionOptimizer && selectedQuestion && (
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
              if (selectedQuestion) {
                updateQuestionMutation.mutate({
                  questionId: selectedQuestion.id,
                  data: improvements,
                });
              }
              queryClient.invalidateQueries({ queryKey: ['survey', id] });
            }}
          />
        )
      }

      {
        showSuggestQuestions && survey && (
          <SuggestQuestions
            surveyId={survey.id}
            surveyTitle={survey.title}
            existingQuestions={survey.questions.map((q) => q.text)}
            onClose={() => setShowSuggestQuestions(false)}
            onAddQuestion={(question) => {
              addQuestionMutation.mutate(question);
            }}
          />
        )
      }

      {
        showHealthCheck && survey && (
          <SurveyHealthCheck
            survey={{
              id: survey.id,
              title: survey.title,
              description: survey.description,
              questions: survey.questions,
            }}
            onClose={() => setShowHealthCheck(false)}
          />
        )
      }

    </div >
  );
}
