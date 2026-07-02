import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  Layout,
  Loader2,
  Sparkles,
  Split,
  Users,
} from 'lucide-react';
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

type SaveStatus = 'saved' | 'saving' | 'error';

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

const AGREEMENT_OPTIONS = [
  'Strongly disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly agree',
].map((text, i) => ({ text, value: `agree_${i + 1}` }));

const CHOICE_OPTIONS = [1, 2, 3].map((n) => ({ text: `Option ${n}`, value: `option_${n}` }));

/** Sensible starting content per question type so new questions are usable immediately. */
function defaultQuestionPayload(type: QuestionType): {
  text: string;
  options?: { text: string; value: string }[];
} {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
      return { text: 'Which option describes you best?', options: CHOICE_OPTIONS };
    case QuestionType.CHECKBOXES:
      return { text: 'Select all that apply', options: CHOICE_OPTIONS };
    case QuestionType.DROPDOWN:
      return { text: 'Choose one option', options: CHOICE_OPTIONS };
    case QuestionType.RANKING:
      return { text: 'Rank the following in order of preference', options: CHOICE_OPTIONS };
    case QuestionType.LIKERT_SCALE:
      return { text: 'I am satisfied with this product.', options: AGREEMENT_OPTIONS };
    case QuestionType.NPS:
      return { text: 'How likely are you to recommend us to a friend or colleague?' };
    case QuestionType.RATING_SCALE:
      return { text: 'How would you rate your experience?' };
    case QuestionType.YES_NO:
      return { text: 'Is this statement true for you?' };
    case QuestionType.LONG_TEXT:
      return { text: 'What else would you like to share with us?' };
    case QuestionType.SHORT_TEXT:
      return { text: 'What should we ask you here?' };
    case QuestionType.EMAIL:
      return { text: 'What is your email address?' };
    default:
      return { text: 'New question' };
  }
}

/** Normalize option payloads coming from AI tools (strings or objects) into the API shape. */
function normalizeAIOptions(
  options?: any[]
): { text: string; value: string }[] | undefined {
  if (!options || options.length === 0) return undefined;
  return options.map((opt, i) => {
    const text = typeof opt === 'string' ? opt : opt?.text ?? String(opt);
    const value =
      (typeof opt === 'object' && opt?.value) ||
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') ||
      `option_${i + 1}`;
    return { text, value };
  });
}

/** Strip client-only fields from a question for the update API. */
function questionUpdatePayload(question: Question) {
  return {
    type: question.type,
    // The API rejects empty text; keep the previous value server-side until the user types something.
    ...(question.text.trim() ? { text: question.text } : {}),
    description: question.description ?? undefined,
    isRequired: question.isRequired,
    isRandomized: question.isRandomized,
    settings: question.settings ?? undefined,
    validation: question.validation ?? undefined,
    options: question.options?.map((o) => ({
      text: o.text,
      value: o.value || o.text,
      imageUrl: o.imageUrl ?? undefined,
    })),
  };
}

export default function SurveyBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [localQuestions, setLocalQuestions] = useState<Question[]>([]);
  const [currentView, setCurrentView] = useState<'design' | 'logic'>('design');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  const [showProgressBar, setShowProgressBar] = useState(true);
  const [progressBarPosition, setProgressBarPosition] = useState('top');
  const [progressBarStyle, setProgressBarStyle] = useState('bar');
  const [progressBarFormat, setProgressBarFormat] = useState('percentage');
  const [paginationMode, setPaginationMode] = useState('all');
  const [questionsPerPage, setQuestionsPerPage] = useState(1);

  // AI tool state
  const [showSuggestQuestions, setShowSuggestQuestions] = useState(false);
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [optimizeTarget, setOptimizeTarget] = useState<Question | null>(null);

  // Refs mirroring state so debounced saves always read the latest values
  const questionsRef = useRef<Question[]>([]);
  questionsRef.current = localQuestions;
  const surveyDataRef = useRef<Record<string, any>>({});
  const questionTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const surveyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightSaves = useRef(0);

  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: async () => {
      const response = await api.get(`/surveys/${id}`);
      const data = response.data.data as Survey;

      try {
        const logicResponse = await api.get(`/surveys/${id}/logic`);
        const logics = (logicResponse.data.data as SurveyLogic[]) || [];
        if (data.questions) {
          data.questions = data.questions.map((q) => ({
            ...q,
            logic: logics.filter((l) => l.sourceQuestionId === q.id),
          }));
        }
      } catch (error) {
        console.error('Failed to fetch logic rules:', error);
      }
      return data;
    },
    enabled: !isNew,
    // The builder owns local edit state; only refetch on explicit invalidation
    // (add/delete/duplicate) so background refetches don't clobber unsaved edits.
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  // Sync local state when the survey loads or is refetched
  useEffect(() => {
    if (!survey) return;
    setTitle(survey.title);
    setDescription(survey.description || '');
    setShowProgressBar(survey.showProgressBar ?? true);
    setProgressBarPosition(survey.progressBarPosition || 'top');
    setProgressBarStyle(survey.progressBarStyle || 'bar');
    setProgressBarFormat(survey.progressBarFormat || 'percentage');
    setPaginationMode(survey.paginationMode || 'all');
    setQuestionsPerPage(survey.questionsPerPage || 1);
    setLocalQuestions(survey.questions || []);
  }, [survey]);

  // ----- Autosave plumbing -----

  const dirtyQuestions = useRef<Set<string>>(new Set());
  const surveyDirty = useRef(false);

  const beginSave = () => {
    inFlightSaves.current += 1;
    setSaveStatus('saving');
  };

  const endSave = (ok: boolean) => {
    inFlightSaves.current = Math.max(0, inFlightSaves.current - 1);
    if (!ok) {
      setSaveStatus('error');
    } else if (inFlightSaves.current === 0) {
      const stillDirty = dirtyQuestions.current.size > 0 || surveyDirty.current;
      setSaveStatus((prev) => (prev === 'error' && stillDirty ? 'error' : 'saved'));
    }
  };

  const persistQuestion = useCallback(async (questionId: string) => {
    const question = questionsRef.current.find((q) => q.id === questionId);
    if (!question) {
      dirtyQuestions.current.delete(questionId);
      return;
    }
    beginSave();
    try {
      await api.put(`/surveys/questions/${questionId}`, questionUpdatePayload(question));
      dirtyQuestions.current.delete(questionId);
      endSave(true);
    } catch {
      endSave(false);
    }
  }, []);

  const persistSurvey = useCallback(async () => {
    const surveyId = surveyDataRef.current.id;
    if (!surveyId) return;
    beginSave();
    try {
      const { id: _ignored, ...data } = surveyDataRef.current;
      await api.put(`/surveys/${surveyId}`, data);
      surveyDirty.current = false;
      endSave(true);
    } catch {
      endSave(false);
    }
  }, []);

  const scheduleQuestionSave = useCallback(
    (questionId: string) => {
      dirtyQuestions.current.add(questionId);
      setSaveStatus('saving');
      const existing = questionTimers.current.get(questionId);
      if (existing) clearTimeout(existing);
      questionTimers.current.set(
        questionId,
        setTimeout(() => {
          questionTimers.current.delete(questionId);
          persistQuestion(questionId);
        }, 800)
      );
    },
    [persistQuestion]
  );

  const scheduleSurveySave = useCallback(
    (data: Record<string, any>) => {
      if (isNew) return;
      surveyDataRef.current = { ...surveyDataRef.current, ...data, id };
      surveyDirty.current = true;
      setSaveStatus('saving');
      if (surveyTimer.current) clearTimeout(surveyTimer.current);
      surveyTimer.current = setTimeout(() => {
        surveyTimer.current = null;
        persistSurvey();
      }, 1000);
    },
    [id, isNew, persistSurvey]
  );

  /** Persist anything still pending or previously failed, e.g. before structural changes. */
  const flushPendingSaves = useCallback(() => {
    const pending: Promise<void>[] = [];
    questionTimers.current.forEach((timer) => clearTimeout(timer));
    questionTimers.current.clear();
    dirtyQuestions.current.forEach((questionId) => pending.push(persistQuestion(questionId)));
    if (surveyTimer.current) {
      clearTimeout(surveyTimer.current);
      surveyTimer.current = null;
    }
    if (surveyDirty.current) pending.push(persistSurvey());
    return Promise.all(pending);
  }, [persistQuestion, persistSurvey]);

  // Flush on unmount so edits aren't lost when navigating away
  useEffect(() => {
    return () => {
      void flushPendingSaves();
    };
  }, [flushPendingSaves]);

  // ----- Handlers -----

  const handleUpdateQuestion = (questionId: string, data: Partial<Question>) => {
    setLocalQuestions((questions) =>
      questions.map((q) => (q.id === questionId ? { ...q, ...data } : q))
    );
    scheduleQuestionSave(questionId);
  };

  // Logic rules persist themselves inside LogicRulesPanel; just mirror them locally.
  const handleLogicChanged = (questionId: string, logic: SurveyLogic[]) => {
    setLocalQuestions((questions) =>
      questions.map((q) => (q.id === questionId ? { ...q, logic } : q))
    );
  };

  const handleUpdateSurveySettings = (settings: Partial<SurveySettingsData>) => {
    if (settings.title !== undefined) setTitle(settings.title);
    if (settings.description !== undefined) setDescription(settings.description);
    if (settings.showProgressBar !== undefined) setShowProgressBar(settings.showProgressBar);
    if (settings.progressBarPosition !== undefined) setProgressBarPosition(settings.progressBarPosition);
    if (settings.progressBarStyle !== undefined) setProgressBarStyle(settings.progressBarStyle);
    if (settings.progressBarFormat !== undefined) setProgressBarFormat(settings.progressBarFormat);
    if (settings.paginationMode !== undefined) setPaginationMode(settings.paginationMode);
    if (settings.questionsPerPage !== undefined) setQuestionsPerPage(settings.questionsPerPage);
    scheduleSurveySave(settings.title !== undefined && !settings.title.trim() ? {} : settings);
  };

  /** Create the survey first if the user started from a blank canvas. */
  const ensureSurveyId = async (): Promise<string> => {
    if (!isNew) return id!;
    const response = await api.post('/surveys', {
      title: title.trim() || 'Untitled Survey',
      description: description || undefined,
    });
    const newId = response.data.data.id as string;
    navigate(`/surveys/${newId}/edit`, { replace: true });
    return newId;
  };

  const handleAddQuestion = async (type: QuestionType, insertIndex?: number) => {
    try {
      await flushPendingSaves();
      const surveyId = await ensureSurveyId();
      const defaults = defaultQuestionPayload(type);
      const response = await api.post(`/surveys/${surveyId}/questions`, {
        type,
        isRequired: false,
        ...defaults,
      });
      const newQuestion = response.data.data as Question;

      if (insertIndex !== undefined && insertIndex < questionsRef.current.length) {
        const ids = questionsRef.current.map((q) => q.id);
        ids.splice(insertIndex, 0, newQuestion.id);
        await api.post(`/surveys/${surveyId}/questions/reorder`, { questionIds: ids });
      }

      setSelectedQuestionId(newQuestion.id);
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add question');
    }
  };

  const handleDuplicateQuestion = async (questionId: string) => {
    const source = questionsRef.current.find((q) => q.id === questionId);
    if (!source || isNew) return;
    try {
      await flushPendingSaves();
      const response = await api.post(`/surveys/${id}/questions`, questionUpdatePayload(source));
      const copy = response.data.data as Question;

      const ids = questionsRef.current.map((q) => q.id);
      ids.splice(ids.indexOf(questionId) + 1, 0, copy.id);
      await api.post(`/surveys/${id}/questions/reorder`, { questionIds: ids });

      setSelectedQuestionId(copy.id);
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      toast.success('Question duplicated');
    } catch {
      toast.error('Failed to duplicate question');
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    api
      .delete(`/surveys/${id}/questions/${questionId}`)
      .then(() => {
        toast.success('Question deleted');
        queryClient.invalidateQueries({ queryKey: ['survey', id] });
        if (selectedQuestionId === questionId) setSelectedQuestionId(null);
      })
      .catch(() => toast.error('Failed to delete question'));
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || isNew) return;

    const items = Array.from(localQuestions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setLocalQuestions(items);

    beginSave();
    try {
      await api.post(`/surveys/${id}/questions/reorder`, {
        questionIds: items.map((q) => q.id),
      });
      endSave(true);
    } catch {
      endSave(false);
      toast.error('Failed to save question order');
    }
  };

  const handleCreateSurvey = async () => {
    if (!title.trim()) {
      toast.error('Please enter a survey title first');
      return;
    }
    try {
      await ensureSurveyId();
      toast.success('Survey created');
    } catch {
      toast.error('Failed to create survey');
    }
  };

  const handlePublish = async () => {
    if (localQuestions.length === 0) {
      toast.error('Cannot publish a survey without questions. Add at least one question first.');
      return;
    }
    if (!confirm('Publish this survey? It will become available to respondents.')) return;
    await flushPendingSaves();
    try {
      await api.post(`/surveys/${id}/publish`, { status: 'ACTIVE' });
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      toast.success('Survey published');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to publish survey');
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Unpublish this survey? It will no longer be available to respondents.')) return;
    try {
      await api.post(`/surveys/${id}/publish`, { status: 'DRAFT' });
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      toast.success('Survey unpublished');
    } catch {
      toast.error('Failed to unpublish survey');
    }
  };

  const handleApplyOptimization = (improvements: any) => {
    if (!optimizeTarget) return;
    const options = normalizeAIOptions(improvements.options);
    handleUpdateQuestion(optimizeTarget.id, {
      ...(improvements.text ? { text: improvements.text } : {}),
      ...(options
        ? {
            options: options.map((o, index) => ({
              id: `ai-${index}`,
              questionId: optimizeTarget.id,
              text: o.text,
              value: o.value,
              order: index,
            })),
          }
        : {}),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Loading survey...
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-100 dark:bg-slate-900 h-[calc(100vh-64px)] overflow-hidden">
      {/* Workspace Header */}
      <div className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 shrink-0 gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to="/surveys"
            className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0"
            title="Back to surveys"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => handleUpdateSurveySettings({ title: e.target.value })}
            className="text-lg font-bold text-slate-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-2 transition-colors min-w-0 w-64"
            placeholder="Untitled Survey"
          />
          <SaveIndicator status={saveStatus} isNew={isNew} onRetry={flushPendingSaves} />
        </div>

        {/* View Toggle (logic needs a persisted survey) */}
        {!isNew && (
        <div className="hidden md:flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 shrink-0">
          <ViewToggleButton
            active={currentView === 'design'}
            onClick={() => setCurrentView('design')}
            icon={Layout}
            label="Design"
          />
          <ViewToggleButton
            active={currentView === 'logic'}
            onClick={() => setCurrentView('logic')}
            icon={Split}
            label="Logic"
          />
        </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {/* AI Assist menu */}
          {!isNew && (
            <div className="relative">
              <button
                onClick={() => setShowAIMenu((open) => !open)}
                className="btn btn-outline btn-sm"
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-primary-500" />
                AI Assist
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </button>
              {showAIMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowAIMenu(false)} />
                  <div className="dropdown-menu absolute right-0 top-full mt-1 w-64 z-30">
                    <button
                      className="dropdown-item w-full text-left"
                      onClick={() => {
                        setShowAIMenu(false);
                        setShowSuggestQuestions(true);
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-3 text-primary-500 shrink-0" />
                      <div>
                        <div className="font-medium">Suggest questions</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Get AI-recommended questions for this survey
                        </div>
                      </div>
                    </button>
                    <button
                      className="dropdown-item w-full text-left"
                      onClick={() => {
                        setShowAIMenu(false);
                        setShowHealthCheck(true);
                      }}
                    >
                      <Activity className="w-4 h-4 mr-3 text-emerald-500 shrink-0" />
                      <div>
                        <div className="font-medium">Survey health check</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Review for bias, clarity and length
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {isNew ? (
            <button onClick={handleCreateSurvey} className="btn btn-primary btn-sm">
              Create Survey
            </button>
          ) : (
            <>
              {survey?.status === 'ACTIVE' ? (
                <button onClick={handleUnpublish} className="btn btn-warning btn-sm">
                  Unpublish
                </button>
              ) : (
                <button onClick={handlePublish} className="btn btn-success btn-sm">
                  Publish
                </button>
              )}

              {survey && (
                <>
                  <button
                    onClick={() => window.open(`/s/${survey.slug}`, '_blank')}
                    className="btn btn-outline btn-sm"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => navigate(`/surveys/${survey.id}/participants`)}
                    className="btn btn-outline btn-sm"
                    title="Manage Participants"
                  >
                    <Users className="w-4 h-4 mr-1.5" />
                    Participants
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {currentView === 'design' && (
          <Toolbox
            onAddQuestion={handleAddQuestion}
            questions={localQuestions}
            onSelectQuestion={setSelectedQuestionId}
            selectedQuestionId={selectedQuestionId}
          />
        )}

        <div className="flex-1 overflow-hidden relative flex flex-col">
          {currentView === 'design' ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Canvas
                title={title}
                description={description}
                questions={localQuestions}
                selectedQuestionId={selectedQuestionId}
                onSelectQuestion={setSelectedQuestionId}
                onUpdateQuestion={handleUpdateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onDuplicateQuestion={handleDuplicateQuestion}
                onOptimizeQuestion={(question) => setOptimizeTarget(question)}
                onAddQuestion={handleAddQuestion}
                onSuggestQuestions={isNew ? undefined : () => setShowSuggestQuestions(true)}
              />
            </DragDropContext>
          ) : (
            <LogicEditor
              surveyId={id!}
              questions={localQuestions}
              selectedQuestionId={selectedQuestionId}
              onSelectQuestion={setSelectedQuestionId}
              onUpdateLogic={handleLogicChanged}
            />
          )}
        </div>

        {currentView === 'design' && (
          <PropertyInspector
            question={localQuestions.find((q) => q.id === selectedQuestionId) || null}
            surveyId={isNew ? undefined : id}
            questions={localQuestions}
            onLogicChanged={handleLogicChanged}
            onUpdate={(data) => {
              if (selectedQuestionId) handleUpdateQuestion(selectedQuestionId, data);
            }}
            surveySettings={{
              title,
              description,
              showProgressBar,
              progressBarPosition,
              progressBarStyle,
              progressBarFormat,
              paginationMode,
              questionsPerPage,
            }}
            onUpdateSurveySettings={handleUpdateSurveySettings}
          />
        )}
      </div>

      {/* AI Modals */}
      {optimizeTarget && (
        <QuestionOptimizer
          question={{
            id: optimizeTarget.id,
            text: optimizeTarget.text,
            type: optimizeTarget.type,
            options: optimizeTarget.options,
          }}
          onClose={() => setOptimizeTarget(null)}
          onApply={handleApplyOptimization}
        />
      )}

      {showSuggestQuestions && survey && (
        <SuggestQuestions
          surveyId={survey.id}
          surveyTitle={title || survey.title}
          existingQuestions={localQuestions.map((q) => q.text)}
          onClose={() => setShowSuggestQuestions(false)}
          onAddQuestion={async (question) => {
            try {
              await api.post(`/surveys/${survey.id}/questions`, {
                type: question.type,
                text: question.text,
                isRequired: false,
                options: normalizeAIOptions(question.options),
              });
              queryClient.invalidateQueries({ queryKey: ['survey', survey.id] });
            } catch {
              toast.error('Failed to add question');
            }
          }}
        />
      )}

      {showHealthCheck && survey && (
        <SurveyHealthCheck
          survey={{
            id: survey.id,
            title: title || survey.title,
            description,
            questions: localQuestions,
          }}
          onClose={() => setShowHealthCheck(false)}
        />
      )}
    </div>
  );
}

function SaveIndicator({
  status,
  isNew,
  onRetry,
}: {
  status: SaveStatus;
  isNew: boolean;
  onRetry: () => void;
}) {
  if (isNew) {
    return (
      <span className="hidden sm:inline-flex items-center text-xs text-slate-400 dark:text-slate-500 shrink-0">
        Draft — not saved yet
      </span>
    );
  }
  if (status === 'saving') {
    return (
      <span className="hidden sm:inline-flex items-center text-xs text-slate-400 dark:text-slate-500 shrink-0">
        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
        Saving...
      </span>
    );
  }
  if (status === 'error') {
    return (
      <button
        onClick={onRetry}
        className="hidden sm:inline-flex items-center text-xs text-red-500 hover:text-red-600 shrink-0"
      >
        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
        Save failed — retry
      </button>
    );
  }
  return (
    <span className="hidden sm:inline-flex items-center text-xs text-emerald-500 dark:text-emerald-400 shrink-0">
      <Check className="w-3.5 h-3.5 mr-1" />
      Saved
    </span>
  );
}

function ViewToggleButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Layout;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors
        ${active
          ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
      `}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </button>
  );
}
