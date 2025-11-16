import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tantml:parameter>
import { Plus, Save, Eye, Trash2, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Survey, Question, QuestionType } from '../../types';

const QUESTION_TYPES = [
  { value: QuestionType.MULTIPLE_CHOICE, label: 'Multiple Choice' },
  { value: QuestionType.CHECKBOXES, label: 'Checkboxes' },
  { value: QuestionType.SHORT_TEXT, label: 'Short Text' },
  { value: QuestionType.LONG_TEXT, label: 'Long Text' },
  { value: QuestionType.RATING_SCALE, label: 'Rating Scale' },
  { value: QuestionType.NPS, label: 'NPS' },
  { value: QuestionType.EMAIL, label: 'Email' },
  { value: QuestionType.NUMBER, label: 'Number' },
  { value: QuestionType.DATE, label: 'Date' },
  { value: QuestionType.YES_NO, label: 'Yes/No' },
];

export default function SurveyBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: async () => {
      if (!id || id === 'new') return null;
      const response = await api.get(`/surveys/${id}`);
      const data = response.data.data as Survey;
      setTitle(data.title);
      setDescription(data.description || '');
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

  const handleSave = () => {
    const data = { title, description };
    if (id && id !== 'new') {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAddQuestion = () => {
    if (!id || id === 'new') {
      toast.error('Save the survey first');
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
              <button
                onClick={() => window.open(`/s/${survey.slug}`, '_blank')}
                className="btn btn-secondary inline-flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </button>
            )}
          </div>
        </div>

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
        {survey?.questions.map((question, index) => (
          <div key={question.id} className="card">
            <div className="flex items-start gap-4">
              <GripVertical className="w-5 h-5 text-gray-400 mt-2 cursor-move" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    Question {index + 1}
                  </span>
                  <button className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  className="input mb-2"
                  value={question.text}
                  placeholder="Question text"
                />
                <select className="input mb-2" value={question.type}>
                  {QUESTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {(question.type === QuestionType.MULTIPLE_CHOICE ||
                  question.type === QuestionType.CHECKBOXES) && (
                  <div className="space-y-2">
                    {question.options.map((option, i) => (
                      <input
                        key={option.id}
                        type="text"
                        className="input"
                        value={option.text}
                        placeholder={`Option ${i + 1}`}
                      />
                    ))}
                    <button className="text-sm text-primary-600">+ Add Option</button>
                  </div>
                )}
                <label className="inline-flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={question.isRequired}
                    className="mr-2"
                  />
                  <span className="text-sm">Required</span>
                </label>
              </div>
            </div>
          </div>
        ))}

        {(!survey?.questions || survey.questions.length === 0) && (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No questions yet</p>
            <button onClick={handleAddQuestion} className="btn btn-primary">
              Add Your First Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
