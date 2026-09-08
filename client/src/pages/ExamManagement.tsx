import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { useToast } from '@/hooks/use-toast';
import type { Exam, Question, MultipleChoiceOption, TestCase } from '@shared/schema';
import { Plus, Edit, Trash2, FileText, Clock, Users } from 'lucide-react';

const examSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
});

const codingLanguages = ['javascript', 'typescript', 'python'] as const;

const questionSchema = z.object({
  type: z.enum(['multiple_choice', 'short_answer', 'true_false', 'coding']),
  text: z.string().min(1, 'Question text is required'),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
  })).optional(),
  correctAnswer: z.string().optional(),
  points: z.number().min(1, 'Points must be at least 1'),
  order: z.number().min(1, 'Order must be at least 1'),
  language: z.enum(codingLanguages).optional(),
  starterCode: z.string().optional(),
  testCases: z.array(z.object({
    id: z.string().min(1),
    input: z.string(),
    expectedOutput: z.string(),
    description: z.string().optional(),
    isHidden: z.boolean().optional(),
  })).optional(),
  timeLimit: z.number().min(1, 'Time limit must be at least 1 second').optional(),
  memoryLimit: z.number().min(16, 'Memory limit must be at least 16 MB').optional(),
}).superRefine((value, ctx) => {
  if (value.type !== 'coding' && !value.correctAnswer?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['correctAnswer'], message: 'Correct answer is required' });
  }
  if (value.type === 'coding') {
    if (!value.language) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['language'], message: 'Programming language is required' });
    if (value.starterCode === undefined || !value.starterCode.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['starterCode'], message: 'Starter code is required' });
    }
    if (!value.timeLimit) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['timeLimit'], message: 'Time limit is required' });
    if (!value.memoryLimit) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['memoryLimit'], message: 'Memory limit is required' });
    if (!value.testCases?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['testCases'], message: 'Add at least one test case' });
    } else {
      value.testCases.forEach((testCase, index) => {
        if (!testCase.expectedOutput.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['testCases', index, 'expectedOutput'], message: 'Expected output is required' });
        }
      });
    }
  }
});

type ExamForm = z.infer<typeof examSchema>;
type QuestionForm = z.infer<typeof questionSchema>;

function questionPayload(data: QuestionForm) {
  if (data.type === 'coding') {
    return { ...data, options: null, correctAnswer: null };
  }
  return {
    ...data,
    options: data.type === 'multiple_choice' ? data.options : null,
    language: null,
    starterCode: null,
    testCases: null,
    timeLimit: null,
    memoryLimit: null,
  };
}

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
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

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
      language: 'javascript',
      starterCode: '',
      testCases: [{ id: `test-${Date.now()}`, input: '', expectedOutput: '', description: '', isHidden: false }],
      timeLimit: 2,
      memoryLimit: 128,
    },
  });
  const testCaseFields = useFieldArray({ control: questionForm.control, name: 'testCases' });

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
      setEditingExam(null);
      examForm.reset();
      toast({ title: 'Success', description: 'Exam created successfully' });
      announceToScreenReader('Exam created successfully');
    },
  });

  const updateExamMutation = useMutation({
    mutationFn: async (data: ExamForm) => {
      if (!editingExam) throw new Error('No exam to update');
      
      const response = await apiRequest('PUT', `/api/exams/${editingExam.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      setShowExamDialog(false);
      setEditingExam(null);
      examForm.reset();
      toast({ title: 'Success', description: 'Exam updated successfully' });
      announceToScreenReader('Exam updated successfully');
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionForm) => {
      if (!selectedExam) throw new Error('No exam selected');
      
      const response = await apiRequest('POST', `/api/exams/${selectedExam.id}/questions`, {
        ...questionPayload(data),
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
      
      const response = await apiRequest('PUT', `/api/questions/${editingQuestion.id}`, questionPayload(data));
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
    if (editingExam) {
      updateExamMutation.mutate(data);
    } else {
      createExamMutation.mutate(data);
    }
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    examForm.reset({
      title: exam.title,
      description: exam.description || '',
      duration: exam.duration,
    });
    setShowExamDialog(true);
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
      language: codingLanguages.includes(question.language as typeof codingLanguages[number])
        ? question.language as typeof codingLanguages[number]
        : 'javascript',
      starterCode: question.starterCode || '',
      testCases: ((question.testCases as TestCase[] | null) || []).map((testCase, index) => ({
        id: testCase.id || `test-${question.id}-${index}`,
        input: testCase.input || '',
        expectedOutput: testCase.expectedOutput || '',
        description: testCase.description || '',
        isHidden: Boolean(testCase.isHidden),
      })),
      timeLimit: question.timeLimit || 2,
      memoryLimit: question.memoryLimit || 128,
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
                    onClick={() => {
                      setEditingExam(null);
                      examForm.reset();
                    }}
                    data-testid="button-create-exam"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Exam
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingExam ? 'Edit Exam' : 'Create New Exam'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingExam 
                        ? 'Update the exam details below.' 
                        : 'Set up a new exam with title, description, and duration.'
                      }
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
                        disabled={createExamMutation.isPending || updateExamMutation.isPending}
                        className="bg-primary hover:bg-primary-dark"
                        data-testid="button-save-exam"
                      >
                        {(createExamMutation.isPending || updateExamMutation.isPending)
                          ? 'Saving...' 
                          : editingExam
                          ? 'Update Exam'
                          : 'Create Exam'
                        }
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
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2" data-testid={`text-exam-title-${exam.id}`}>
                            {exam.title}
                          </h4>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="mr-1 h-3 w-3" />
                            {exam.duration} min
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditExam(exam);
                          }}
                          className="ml-2 focus-visible:outline-2 focus-visible:outline-primary"
                          data-testid={`button-edit-exam-${exam.id}`}
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
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
                    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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
                              <SelectItem value="coding">Coding</SelectItem>
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

                        {watchQuestionType === 'coding' && (
                          <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4" aria-labelledby="coding-settings-heading">
                            <div>
                              <h4 id="coding-settings-heading" className="font-semibold">Coding settings</h4>
                              <p className="text-sm text-muted-foreground">Define the executable environment and every case used to grade the solution.</p>
                            </div>
                            <div>
                              <Label htmlFor="coding-language">Programming language</Label>
                              <Select
                                value={questionForm.watch('language') || ''}
                                onValueChange={(value) => questionForm.setValue('language', value as QuestionForm['language'], { shouldValidate: true })}
                              >
                                <SelectTrigger id="coding-language" data-testid="select-coding-language">
                                  <SelectValue placeholder="Select a language" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="javascript">JavaScript</SelectItem>
                                  <SelectItem value="typescript">TypeScript</SelectItem>
                                  <SelectItem value="python">Python</SelectItem>
                                </SelectContent>
                              </Select>
                              {questionForm.formState.errors.language && <p role="alert" className="text-sm text-red-600 mt-1">{questionForm.formState.errors.language.message}</p>}
                            </div>
                            <div>
                              <Label htmlFor="starter-code">Starter code</Label>
                              <Textarea id="starter-code" {...questionForm.register('starterCode')} rows={6} className="font-mono text-sm" placeholder="Provide the code students will begin with." data-testid="textarea-starter-code" />
                              {questionForm.formState.errors.starterCode && <p role="alert" className="text-sm text-red-600 mt-1">{questionForm.formState.errors.starterCode.message}</p>}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="time-limit">Time limit (seconds)</Label>
                                <Input id="time-limit" type="number" min="1" {...questionForm.register('timeLimit', { valueAsNumber: true })} data-testid="input-time-limit" />
                                {questionForm.formState.errors.timeLimit && <p role="alert" className="text-sm text-red-600 mt-1">{questionForm.formState.errors.timeLimit.message}</p>}
                              </div>
                              <div>
                                <Label htmlFor="memory-limit">Memory limit (MB)</Label>
                                <Input id="memory-limit" type="number" min="16" {...questionForm.register('memoryLimit', { valueAsNumber: true })} data-testid="input-memory-limit" />
                                {questionForm.formState.errors.memoryLimit && <p role="alert" className="text-sm text-red-600 mt-1">{questionForm.formState.errors.memoryLimit.message}</p>}
                              </div>
                            </div>
                            <fieldset className="space-y-3">
                              <legend className="text-base font-medium">Test cases</legend>
                              <p className="text-sm text-muted-foreground">Each case needs input and expected output. Hidden cases are not shown to students.</p>
                              {testCaseFields.fields.map((field, index) => (
                                <div key={field.id} className="rounded-md border bg-background p-3 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-medium">Test case {index + 1}</h5>
                                    <Button type="button" variant="outline" size="sm" onClick={() => testCaseFields.remove(index)} disabled={testCaseFields.fields.length === 1} aria-label={`Remove test case ${index + 1}`}>
                                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                                    </Button>
                                  </div>
                                  <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                      <Label htmlFor={`test-case-${index}-input`}>Input</Label>
                                      <Textarea id={`test-case-${index}-input`} {...questionForm.register(`testCases.${index}.input` as const)} rows={3} className="font-mono text-sm" data-testid={`textarea-test-input-${index}`} />
                                    </div>
                                    <div>
                                      <Label htmlFor={`test-case-${index}-output`}>Expected output</Label>
                                      <Textarea id={`test-case-${index}-output`} {...questionForm.register(`testCases.${index}.expectedOutput` as const)} rows={3} className="font-mono text-sm" data-testid={`textarea-test-output-${index}`} />
                                      {questionForm.formState.errors.testCases?.[index]?.expectedOutput && <p role="alert" className="text-sm text-red-600 mt-1">{questionForm.formState.errors.testCases[index]?.expectedOutput?.message}</p>}
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor={`test-case-${index}-description`}>Description (optional)</Label>
                                    <Input id={`test-case-${index}-description`} {...questionForm.register(`testCases.${index}.description` as const)} data-testid={`input-test-description-${index}`} />
                                  </div>
                                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" {...questionForm.register(`testCases.${index}.isHidden` as const)} className="h-4 w-4" data-testid={`checkbox-test-hidden-${index}`} />
                                    Hidden test case
                                  </label>
                                </div>
                              ))}
                              {questionForm.formState.errors.testCases?.message && <p role="alert" className="text-sm text-red-600">{questionForm.formState.errors.testCases.message}</p>}
                              <Button type="button" variant="outline" onClick={() => testCaseFields.append({ id: `test-${Date.now()}-${testCaseFields.fields.length}`, input: '', expectedOutput: '', description: '', isHidden: false })}>
                                <Plus className="h-4 w-4 mr-2" /> Add test case
                              </Button>
                            </fieldset>
                          </div>
                        )}

                        {watchQuestionType !== 'coding' && <div>
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
                        </div>}

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
                              {question.type === 'multiple_choice' && Array.isArray(question.options) && (
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
                              {question.type === 'coding' && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  <p><strong>Language:</strong> {question.language === 'javascript' ? 'JavaScript' : question.language === 'typescript' ? 'TypeScript' : 'Python'}</p>
                                  <p><strong>Tests:</strong> {Array.isArray(question.testCases) ? question.testCases.length : 0} · <strong>Limits:</strong> {question.timeLimit ?? '—'}s / {question.memoryLimit ?? '—'}MB</p>
                                </div>
                              )}
                              {question.type !== 'coding' && (
                                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                  <strong>Correct:</strong> {question.correctAnswer}
                                </p>
                              )}
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
