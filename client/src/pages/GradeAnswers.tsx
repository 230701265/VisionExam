import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { ExamAttemptWithDetails, Question } from '@shared/schema';
import { CheckCircle, XCircle, Clock, FileText, User } from 'lucide-react';

interface GradeAnswersProps {
  currentUser: { id: string; username: string; role: string };
}

export default function GradeAnswers({ currentUser }: GradeAnswersProps) {
  const { announceToScreenReader } = useAccessibility();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttemptWithDetails | null>(null);
  const [grading, setGrading] = useState<Record<string, { score: number; feedback: string }>>({});

  // Get all exam attempts for instructor's exams
  const { data: attempts = [], isLoading } = useQuery<ExamAttemptWithDetails[]>({
    queryKey: ['/api/attempts/instructor', currentUser.id],
  });

  const { data: examQuestions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/exams', selectedAttempt?.examId, 'questions'],
    enabled: !!selectedAttempt?.examId,
  });

  const submitGradeMutation = useMutation({
    mutationFn: async (data: { attemptId: string; questionGrades: typeof grading; feedback: string }) => {
      const response = await apiRequest('PUT', `/api/attempts/${data.attemptId}`, {
        graded: true,
        teacherFeedback: data.feedback,
        questionGrades: data.questionGrades,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attempts/instructor', currentUser.id] });
      toast({ title: 'Success', description: 'Grades submitted successfully' });
      announceToScreenReader('Grades submitted successfully');
      setSelectedAttempt(null);
      setGrading({});
    },
  });

  const handleGradeQuestion = (questionId: string, score: number, feedback: string) => {
    setGrading(prev => ({
      ...prev,
      [questionId]: { score, feedback }
    }));
    announceToScreenReader(`Question graded with ${score} points`);
  };

  const handleSubmitGrades = () => {
    if (!selectedAttempt) return;

    const completeGrades = Object.fromEntries(
      getShortAnswerQuestions().map(question => [
        question.id,
        grading[question.id] ?? { score: 0, feedback: '' },
      ]),
    );
    const overallFeedback = Object.entries(completeGrades)
      .map(([qId, grade]) => `Question: ${grade.feedback}`)
      .join('\n');

    submitGradeMutation.mutate({
      attemptId: selectedAttempt.id,
      questionGrades: completeGrades,
      feedback: overallFeedback,
    });
  };

  const getShortAnswerQuestions = () => {
    return examQuestions.filter(q => q.type === 'short_answer');
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <main id="main-content" role="main" className="max-w-6xl mx-auto px-6 py-8">
      <section aria-labelledby="grading-heading">
        <div className="mb-8">
          <h2 id="grading-heading" className="text-3xl font-bold mb-4 flex items-center">
            <FileText className="mr-3 h-8 w-8" />
            Grade Short Answers
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Review and grade short answer responses from student exam attempts.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Attempts List */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-semibold mb-4">Pending Grades</h3>
            
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : attempts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No exam attempts to grade yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {attempts
                  .filter(attempt => attempt.completedAt && !attempt.graded)
                  .map((attempt) => (
                    <Card
                      key={attempt.id}
                      className={`cursor-pointer transition-colors ${
                        selectedAttempt?.id === attempt.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedAttempt(attempt)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1" data-testid={`text-exam-${attempt.id}`}>
                              {attempt.exam.title}
                            </h4>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <User className="mr-1 h-3 w-3" />
                              {attempt.user.username}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="mr-1 h-3 w-3" />
                              {attempt.completedAt && formatDate(attempt.completedAt)}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Pending
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>

          {/* Grading Interface */}
          <div className="lg:col-span-2">
            {selectedAttempt ? (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2" data-testid="text-grading-student">
                    Grading: {selectedAttempt.user.username}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {selectedAttempt.exam.title}
                  </p>
                  <Badge className="mb-4">
                    {getShortAnswerQuestions().length} Short Answer Questions
                  </Badge>
                </div>

                {questionsLoading ? (
                  <div className="space-y-6">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {getShortAnswerQuestions().map((question, index) => {
                      const userAnswer = selectedAttempt.answers 
                        ? (selectedAttempt.answers as any)[question.id] 
                        : '';
                      const currentGrade = grading[question.id] || { score: 0, feedback: '' };

                      return (
                        <Card key={question.id} className="border-2">
                          <CardContent className="pt-6">
                            <div className="mb-4">
                              <h4 className="text-lg font-semibold mb-2">
                                Question {index + 1} ({question.points} points)
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 mb-4">
                                {question.text}
                              </p>
                              
                              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                                <Label className="font-medium mb-2 block">Student's Answer:</Label>
                                <div className="whitespace-pre-wrap text-sm">
                                  {userAnswer || 'No answer provided'}
                                </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`score-${question.id}`} className="text-base font-medium">
                                    Score (out of {question.points})
                                  </Label>
                                  <Input
                                    id={`score-${question.id}`}
                                    type="number"
                                    min="0"
                                    max={question.points}
                                    value={currentGrade.score}
                                    onChange={(e) => 
                                      handleGradeQuestion(
                                        question.id, 
                                        parseInt(e.target.value) || 0, 
                                        currentGrade.feedback
                                      )
                                    }
                                    className="text-base focus:ring-2 focus:ring-primary"
                                    data-testid={`input-score-${question.id}`}
                                  />
                                </div>

                                <div>
                                  <Label htmlFor={`feedback-${question.id}`} className="text-base font-medium">
                                    Feedback
                                  </Label>
                                  <Textarea
                                    id={`feedback-${question.id}`}
                                    value={currentGrade.feedback}
                                    onChange={(e) => 
                                      handleGradeQuestion(
                                        question.id, 
                                        currentGrade.score, 
                                        e.target.value
                                      )
                                    }
                                    rows={3}
                                    className="text-base focus:ring-2 focus:ring-primary"
                                    placeholder="Provide feedback for the student..."
                                    data-testid={`textarea-feedback-${question.id}`}
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    <div className="flex justify-center pt-6">
                      <Button
                        onClick={handleSubmitGrades}
                        size="lg"
                        className="bg-primary hover:bg-primary-dark px-8 py-3"
                        disabled={submitGradeMutation.isPending || Object.keys(grading).length === 0}
                        data-testid="button-submit-grades"
                      >
                        {submitGradeMutation.isPending ? 'Submitting...' : 'Submit Grades'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select an Exam Attempt</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose an exam attempt from the left to start grading short answer questions.
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