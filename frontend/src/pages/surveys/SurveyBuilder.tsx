import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Eye, Split, Layout } from 'lucide-react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Survey, Question, QuestionType } from '../../types';
import Toolbox from '../../components/survey/workspace/Toolbox';
import Canvas from '../../components/survey/workspace/Canvas';
import PropertyInspector from '../../components/survey/workspace/PropertyInspector';
import LogicEditor from '../../components/survey/workspace/LogicEditor';



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

  // Effect to sync local state when survey loads


  interface SurveySettingsData {
    title: string;
    description: string;
    showProgressBar: boolean;
    progressBarPosition: string;
    progressBarStyle: string;
    progressBarFormat: string;
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
    mutationFn: (question: any) => api.post(`/surveys/${id}/questions`, question),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      toast.success('Question added');
    },
    onError: () => toast.error('Failed to add question'),
  });

  const handleSave = () => {
    const data = {
      title,
      description,
      showProgressBar,
      progressBarPosition,
      progressBarStyle,
      progressBarFormat
    };
    if (id && id !== 'new') {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAddQuestion = (type: QuestionType) => {
    if (!id || id === 'new') {
      toast.error('Save the survey first');
      return;
    }

    const newQuestionData = {
      type,
      text: 'New Question',
      options: (type === QuestionType.MULTIPLE_CHOICE || type === QuestionType.CHECKBOXES)
        ? [{ text: 'Option 1', value: 'option1', order: 0 }]
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

    // Debounce this in real app, simply calling mutation here for simplicity but guarding against rapid updates might be needed
    // implementing a save trigger or effect would be better, but for now consistent with existing pattern:
    // Actually, we'll implement a 'save' effect or just save on blur/change. 
    // Given the request for IDE-like, local state + explicit save or auto-save is common.
    // For this implementation, we will NOT auto-save to backend on every keystroke to avoid spamming the API,
    // but the user can click 'Save' in the header.
    // OR, we can update the backend on specific 'commits'.
    // Let's stick to the previous pattern of explicit Save for survey settings, but individual questions were being saved on wizard close.

    // Better approach for IDE: Auto-save questions when changing selection or periodically.
    // For now, let's keep it simple: Changing properties updates LOCAL state. 
    // We need a way to persist changes.
    // Let's rely on the UpdateMutation for the survey which should include questions ideally, OR individual updates.
    // The current backend API might not support bulk update of questions via survey update.
    // We should probably add a "Save Changes" button in the inspector or auto-save.
  };


  // Wait, let's double check route: surveyRoutes.ts
  // router.put('/:surveyId/questions/:questionId', surveyController.updateQuestion);


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

    // Ideally, we should also persist this new order to the backend
    // Since backend might rely on 'order' field or simply array order in JSON
    // If backend uses separate question records, we need to update their order fields.
    // For now, updating local UI.
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
          {survey && (
            <button
              onClick={() => window.open(`/s/${survey.slug}`, '_blank')}
              className="btn btn-secondary btn-sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
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
              progressBarFormat
            }}
            onUpdateSurveySettings={(settings: Partial<SurveySettingsData>) => {
              if (settings.showProgressBar !== undefined) setShowProgressBar(settings.showProgressBar);
              if (settings.progressBarPosition !== undefined) setProgressBarPosition(settings.progressBarPosition);
              if (settings.progressBarStyle !== undefined) setProgressBarStyle(settings.progressBarStyle);
              if (settings.progressBarFormat !== undefined) setProgressBarFormat(settings.progressBarFormat);
              if (settings.title !== undefined) setTitle(settings.title);
              if (settings.description !== undefined) setDescription(settings.description);
            }}
          />
        )}
      </div>
    </div>
  );
}
