import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { useToast } from '@/hooks/use-toast';
import type { Exam, Question, MultipleChoiceOption } from '@shared/schema';
import { Plus, Edit, Trash2, FileText, Clock, Users } from 'lucide-react';

const examSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
});

const questionSchema = z.object({
  type: z.enum(['multiple_choice', 'short_answer', 'true_false']),
  text: z.string().min(1, 'Question text is required'),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
  })).optional(),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  points: z.number().min(1, 'Points must be at least 1'),
  order: z.number().min(1, 'Order must be at least 1'),
});

type ExamForm = z.infer<typeof examSchema>;
type QuestionForm = z.infer<typeof questionSchema>;

interface ExamManagementProps {
  currentUser: { id: string; username: string; role: string };
}

export default function ExamManagement({ currentUser }: ExamManagementProps) {
  const { announceToScreenReader } = useAccessibility();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const { data: exams = [], isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: ['/api/exams'],
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/exams', selectedExam?.id, 'questions'],
    enabled: !!selectedExam?.id,
  });

  const examForm = useForm<ExamForm>({
    resolver: zodResolver(examSchema),
    defaultValues: { title: '', description: '', duration: 60 },
  });

  const questionForm = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: 'multiple_choice',
      text: '',
      options: [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' },
      ],
      correctAnswer: '',
      points: 1,
      order: 1,
    },
  });

  const createExamMutation = useMutation({
    mutationFn: async (data: ExamForm) => {
      const response = await apiRequest('POST', '/api/exams', {
        ...data,
        createdBy: currentUser.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      setShowExamDialog(false);
      examForm.reset();
      toast({ title: 'Success', description: 'Exam created successfully' });
      announceToScreenReader('Exam created successfully');
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionForm) => {
      if (!selectedExam) throw new Error('No exam selected');
      
      const response = await apiRequest('POST', `/api/exams/${selectedExam.id}/questions`, {
        ...data,
        order: questions.length + 1,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exams', selectedExam?.id, 'questions'] });
      setShowQuestionDialog(false);
      setEditingQuestion(null);
      questionForm.reset();
      toast({ title: 'Success', description: 'Question added successfully' });
      announceToScreenReader('Question added successfully');
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: QuestionForm) => {
      if (!editingQuestion) throw new Error('No question to update');
      
      const response = await apiRequest('PUT', `/api/questions/${editingQuestion.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exams', selectedExam?.id, 'questions'] });
      setShowQuestionDialog(false);
      setEditingQuestion(null);
      questionForm.reset();
      toast({ title: 'Success', description: 'Question updated successfully' });
      announceToScreenReader('Question updated successfully');
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      await apiRequest('DELETE', `/api/questions/${questionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exams', selectedExam?.id, 'questions'] });
      toast({ title: 'Success', description: 'Question deleted successfully' });
      announceToScreenReader('Question deleted successfully');
    },
  });

  const handleCreateExam = (data: ExamForm) => {
    createExamMutation.mutate(data);
  };

  const handleCreateQuestion = (data: QuestionForm) => {
    if (editingQuestion) {
      updateQuestionMutation.mutate(data);
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    questionForm.reset({
      type: question.type as any,
      text: question.text,
      options: question.options as MultipleChoiceOption[] || [],
      correctAnswer: question.correctAnswer || '',
      points: question.points,
      order: question.order,
    });
    setShowQuestionDialog(true);
  };

  const handleDeleteQuestion = (questionId: string, questionText: string) => {
    if (confirm(`Are you sure you want to delete the question: "${questionText}"?`)) {
      deleteQuestionMutation.mutate(questionId);
    }
  };

  const watchQuestionType = questionForm.watch('type');

  return (
    <main id="main-content" role="main" className="max-w-6xl mx-auto px-6 py-8">
      <section aria-labelledby="exam-management-heading">
        <div className="mb-8">
          <h2 id="exam-management-heading" className="text-3xl font-bold mb-4 flex items-center">
            <FileText className="mr-3 h-8 w-8" />
            Exam Management
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Create and manage exams with full accessibility support.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Exams List */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">My Exams</h3>
              <Dialog open={showExamDialog} onOpenChange={setShowExamDialog}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-primary hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-primary"
                    data-testid="button-create-exam"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Exam
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Exam</DialogTitle>
                    <DialogDescription>
                      Set up a new exam with title, description, and duration.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={examForm.handleSubmit(handleCreateExam)} className="space-y-4">
                    <div>
                      <Label htmlFor="exam-title" className="text-base font-medium">
                        Exam Title
                      </Label>
                      <Input
                        id="exam-title"
                        {...examForm.register('title')}
                        className="text-base focus:ring-2 focus:ring-primary"
                        data-testid="input-exam-title"
                      />
                      {examForm.formState.errors.title && (
                        <p className="text-sm text-red-600 mt-1">
                          {examForm.formState.errors.title.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="exam-description" className="text-base font-medium">
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="exam-description"
                        {...examForm.register('description')}
                        rows={3}
                        className="text-base focus:ring-2 focus:ring-primary"
                        data-testid="textarea-exam-description"
                      />
                    </div>

                    <div>
                      <Label htmlFor="exam-duration" className="text-base font-medium">
                        Duration (minutes)
                      </Label>
                      <Input
                        id="exam-duration"
                        type="number"
                        min="1"
                        {...examForm.register('duration', { valueAsNumber: true })}
                        className="text-base focus:ring-2 focus:ring-primary"
                        data-testid="input-exam-duration"
                      />
                      {examForm.formState.errors.duration && (
                        <p className="text-sm text-red-600 mt-1">
                          {examForm.formState.errors.duration.message}
                        </p>
                      )}
                    </div>

                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={createExamMutation.isPending}
                        className="bg-primary hover:bg-primary-dark"
                        data-testid="button-save-exam"
                      >
                        {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {examsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : exams.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No exams created yet. Click "New Exam" to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {exams.filter(exam => exam.createdBy === currentUser.id).map((exam) => (
                  <Card
                    key={exam.id}
                    className={`cursor-pointer transition-colors ${
                      selectedExam?.id === exam.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedExam(exam)}
                  >
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-2" data-testid={`text-exam-title-${exam.id}`}>
                        {exam.title}
                      </h4>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="mr-1 h-3 w-3" />
                        {exam.duration} min
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Questions Management */}
          <div className="lg:col-span-2">
            {selectedExam ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold" data-testid="text-selected-exam-title">
                      {selectedExam.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Manage questions for this exam
                    </p>
                  </div>
                  <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-primary hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-primary"
                        onClick={() => {
                          setEditingQuestion(null);
                          questionForm.reset();
                        }}
                        data-testid="button-add-question"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingQuestion ? 'Edit Question' : 'Add New Question'}
                        </DialogTitle>
                        <DialogDescription>
                          Create or modify a question for the exam.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={questionForm.handleSubmit(handleCreateQuestion)} className="space-y-4">
                        <div>
                          <Label htmlFor="question-type" className="text-base font-medium">
                            Question Type
                          </Label>
                          <Select
                            value={watchQuestionType}
                            onValueChange={(value) => questionForm.setValue('type', value as any)}
                          >
                            <SelectTrigger
                              id="question-type"
                              className="focus:ring-2 focus:ring-primary"
                              data-testid="select-question-type"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="short_answer">Short Answer</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="question-text" className="text-base font-medium">
                            Question Text
                          </Label>
                          <Textarea
                            id="question-text"
                            {...questionForm.register('text')}
                            rows={3}
                            className="text-base focus:ring-2 focus:ring-primary"
                            data-testid="textarea-question-text"
                          />
                          {questionForm.formState.errors.text && (
                            <p className="text-sm text-red-600 mt-1">
                              {questionForm.formState.errors.text.message}
                            </p>
                          )}
                        </div>

                        {watchQuestionType === 'multiple_choice' && (
                          <div>
                            <Label className="text-base font-medium mb-2 block">
                              Answer Options
                            </Label>
                            {['a', 'b', 'c', 'd'].map((optionId, index) => (
                              <div key={optionId} className="mb-2">
                                <Label htmlFor={`option-${optionId}`} className="text-sm font-medium">
                                  Option {optionId.toUpperCase()}
                                </Label>
                                <Input
                                  id={`option-${optionId}`}
                                  {...questionForm.register(`options.${index}.text` as any)}
                                  className="text-base focus:ring-2 focus:ring-primary"
                                  data-testid={`input-option-${optionId}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <div>
                          <Label htmlFor="correct-answer" className="text-base font-medium">
                            Correct Answer
                          </Label>
                          {watchQuestionType === 'multiple_choice' ? (
                            <Select
                              value={questionForm.watch('correctAnswer')}
                              onValueChange={(value) => questionForm.setValue('correctAnswer', value)}
                            >
                              <SelectTrigger
                                id="correct-answer"
                                className="focus:ring-2 focus:ring-primary"
                                data-testid="select-correct-answer"
                              >
                                <SelectValue placeholder="Select correct option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="a">Option A</SelectItem>
                                <SelectItem value="b">Option B</SelectItem>
                                <SelectItem value="c">Option C</SelectItem>
                                <SelectItem value="d">Option D</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : watchQuestionType === 'true_false' ? (
                            <Select
                              value={questionForm.watch('correctAnswer')}
                              onValueChange={(value) => questionForm.setValue('correctAnswer', value)}
                            >
                              <SelectTrigger
                                id="correct-answer"
                                className="focus:ring-2 focus:ring-primary"
                                data-testid="select-true-false-answer"
                              >
                                <SelectValue placeholder="Select true or false" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">True</SelectItem>
                                <SelectItem value="false">False</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Textarea
                              id="correct-answer"
                              {...questionForm.register('correctAnswer')}
                              rows={2}
                              className="text-base focus:ring-2 focus:ring-primary"
                              placeholder="Enter the correct answer or sample answer"
                              data-testid="textarea-correct-answer"
                            />
                          )}
                          {questionForm.formState.errors.correctAnswer && (
                            <p className="text-sm text-red-600 mt-1">
                              {questionForm.formState.errors.correctAnswer.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="question-points" className="text-base font-medium">
                            Points
                          </Label>
                          <Input
                            id="question-points"
                            type="number"
                            min="1"
                            {...questionForm.register('points', { valueAsNumber: true })}
                            className="text-base focus:ring-2 focus:ring-primary"
                            data-testid="input-question-points"
                          />
                        </div>

                        <DialogFooter>
                          <Button
                            type="submit"
                            disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                            className="bg-primary hover:bg-primary-dark"
                            data-testid="button-save-question"
                          >
                            {(createQuestionMutation.isPending || updateQuestionMutation.isPending)
                              ? 'Saving...'
                              : editingQuestion
                              ? 'Update Question'
                              : 'Add Question'
                            }
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {questionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : questions.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-gray-600 dark:text-gray-400">
                        No questions added yet. Click "Add Question" to get started.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <Card key={question.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <span className="text-primary font-semibold mr-2">
                                  Q{index + 1}:
                                </span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  {question.type.replace('_', ' ')}
                                </span>
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded ml-2">
                                  {question.points} pts
                                </span>
                              </div>
                              <p className="mb-2" data-testid={`text-question-${index + 1}`}>
                                {question.text}
                              </p>
                              {question.type === 'multiple_choice' && question.options && Array.isArray(question.options) && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Options:</strong>{' '}
                                  {(question.options as MultipleChoiceOption[]).map((opt, i) => (
                                    <span key={opt.id}>
                                      {String(opt.id).toUpperCase()}: {String(opt.text)}
                                      {i < ((question.options as MultipleChoiceOption[]).length - 1) ? ', ' : ''}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                <strong>Correct:</strong> {question.correctAnswer}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditQuestion(question)}
                                data-testid={`button-edit-question-${index + 1}`}
                              >
                                <Edit className="h-3 w-3" />
                                <span className="sr-only">Edit question</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteQuestion(question.id, question.text)}
                                data-testid={`button-delete-question-${index + 1}`}
                              >
                                <Trash2 className="h-3 w-3" />
                                <span className="sr-only">Delete question</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select an Exam</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose an exam from the left panel to manage its questions.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
