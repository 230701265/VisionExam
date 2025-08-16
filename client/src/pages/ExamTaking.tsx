import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { QuestionRenderer } from '@/components/QuestionRenderer';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { apiRequest } from '@/lib/queryClient';
import type { ExamWithQuestions, ExamAttempt } from '@shared/schema';
import { AlertCircle, Clock } from 'lucide-react';

interface ExamTakingProps {
  currentUser: { id: string; username: string; role: string };
}

export default function ExamTaking({ currentUser }: ExamTakingProps) {
  const [, params] = useRoute('/exam/:id');
  const [, setLocation] = useLocation();
  const { announceToScreenReader } = useAccessibility();
  const queryClient = useQueryClient();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [examAttemptId, setExamAttemptId] = useState<string | null>(null);

  const examId = params?.id;

  const { data: exam, isLoading: examLoading } = useQuery<ExamWithQuestions>({
    queryKey: ['/api/exams', examId],
    enabled: !!examId,
  });

  const createAttemptMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await apiRequest('POST', '/api/attempts', {
        examId,
        userId: currentUser.id,
        totalQuestions: exam?.questions.length || 0,
        answers: {},
      });
      return response.json();
    },
    onSuccess: (attempt: ExamAttempt) => {
      setExamAttemptId(attempt.id);
      if (exam) {
        setTimeRemaining(exam.duration * 60); // Convert minutes to seconds
      }
    },
  });

  const updateAttemptMutation = useMutation({
    mutationFn: async (data: { answers: Record<string, string> }) => {
      if (!examAttemptId) throw new Error('No exam attempt found');
      
      const response = await apiRequest('PUT', `/api/attempts/${examAttemptId}`, data);
      return response.json();
    },
  });

  const submitExamMutation = useMutation({
    mutationFn: async () => {
      if (!examAttemptId || !exam) throw new Error('No exam attempt found');
      
      // Calculate score
      let score = 0;
      exam.questions.forEach((question) => {
        const userAnswer = answers[question.id];
        if (userAnswer === question.correctAnswer) {
          score += question.points;
        }
      });

      const response = await apiRequest('PUT', `/api/attempts/${examAttemptId}`, {
        answers,
        score,
        correctAnswers: score,
        completedAt: new Date().toISOString(),
        timeSpent: exam.duration - Math.floor(timeRemaining / 60),
      });
      return response.json();
    },
    onSuccess: (attempt: ExamAttempt) => {
      announceToScreenReader('Exam submitted successfully. Redirecting to results.');
      setLocation(`/results/${attempt.id}`);
    },
  });

  // Initialize exam attempt
  useEffect(() => {
    if (exam && !examAttemptId) {
      createAttemptMutation.mutate(exam.id);
    }
  }, [exam, examAttemptId]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          submitExamMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, submitExamMutation]);

  // Auto-save answers
  useEffect(() => {
    if (examAttemptId && Object.keys(answers).length > 0) {
      const saveTimer = setTimeout(() => {
        updateAttemptMutation.mutate({ answers });
      }, 2000);

      return () => clearTimeout(saveTimer);
    }
  }, [answers, examAttemptId]);

  const nextQuestion = useCallback(() => {
    if (exam && currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      announceToScreenReader(`Question ${currentQuestionIndex + 2} of ${exam.questions.length}`);
    }
  }, [exam, currentQuestionIndex, announceToScreenReader]);

  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      announceToScreenReader(`Question ${currentQuestionIndex} of ${exam?.questions.length || 0}`);
    }
  }, [currentQuestionIndex, exam, announceToScreenReader]);

  const flagQuestion = useCallback(() => {
    if (!exam) return;
    
    const questionId = exam.questions[currentQuestionIndex].id;
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, [exam, currentQuestionIndex]);

  const shortcuts = [
    { key: 'n', altKey: true, action: nextQuestion, description: 'Next question' },
    { key: 'p', altKey: true, action: previousQuestion, description: 'Previous question' },
    { key: 'f', altKey: true, action: flagQuestion, description: 'Flag question' },
  ];

  useKeyboardNavigation(shortcuts);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (answer: string) => {
    if (!exam) return;
    
    const questionId = exam.questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    announceToScreenReader(`Navigated to question ${index + 1}`);
  };

  const handleSubmitExam = () => {
    const unansweredCount = exam?.questions.filter(q => !answers[q.id]).length || 0;
    
    if (unansweredCount > 0) {
      const confirmSubmit = confirm(
        `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    announceToScreenReader('Submitting exam');
    submitExamMutation.mutate();
  };

  if (examLoading || !exam) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading exam...</p>
        </div>
      </main>
    );
  }

  if (!exam.questions || exam.questions.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Questions Available</h2>
          <p className="text-gray-600 dark:text-gray-400">This exam does not have any questions configured.</p>
        </div>
      </main>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;

  return (
    <main id="main-content" role="main" className="max-w-4xl mx-auto px-6 py-8">
      <section aria-labelledby="exam-heading">
        {/* Exam Header */}
        <div className="mb-8 p-6 bg-primary text-white rounded-lg">
          <h2 id="exam-heading" className="text-2xl font-bold mb-4" data-testid="text-exam-title">
            {exam.title}
          </h2>
          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              <span data-testid="text-question-progress">
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </span>
              <span className="flex items-center" data-testid="text-time-remaining">
                <Clock className="mr-2 h-4 w-4" />
                Time Remaining: {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8" role="progressbar" aria-valuenow={currentQuestionIndex + 1} aria-valuemin="0" aria-valuemax={exam.questions.length} aria-label="Exam progress">
          <Progress value={progress} className="w-full h-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2" data-testid="text-progress-percentage">
            Progress: {Math.round(progress)}% complete
          </p>
        </div>

        {/* Question Container */}
        <QuestionRenderer
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={exam.questions.length}
          answer={answers[currentQuestion.id] || ''}
          onAnswerChange={handleAnswerChange}
          onNext={currentQuestionIndex < exam.questions.length - 1 ? nextQuestion : undefined}
          onPrevious={currentQuestionIndex > 0 ? previousQuestion : undefined}
          onFlag={flagQuestion}
          isFirst={currentQuestionIndex === 0}
          isLast={currentQuestionIndex === exam.questions.length - 1}
          isFlagged={flaggedQuestions.has(currentQuestion.id)}
        />

        {/* Question Navigation */}
        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Question Navigation</h3>
          <div className="grid grid-cols-10 gap-2" role="grid" aria-label="Question navigation grid">
            {exam.questions.map((question, index) => {
              const isAnswered = !!answers[question.id];
              const isFlagged = flaggedQuestions.has(question.id);
              const isCurrent = index === currentQuestionIndex;
              
              let buttonClass = "w-10 h-10 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary ";
              let ariaLabel = `Go to question ${index + 1}`;
              
              if (isCurrent) {
                buttonClass += "bg-primary text-white ";
                ariaLabel += ", current question";
              } else if (isFlagged) {
                buttonClass += "bg-yellow-500 text-white ";
                ariaLabel += ", flagged for review";
              } else if (isAnswered) {
                buttonClass += "bg-green-500 text-white ";
                ariaLabel += ", answered";
              } else {
                buttonClass += "hover:bg-gray-100 dark:hover:bg-gray-700 ";
                ariaLabel += ", not answered";
              }

              return (
                <button
                  key={question.id}
                  className={buttonClass}
                  onClick={() => goToQuestion(index)}
                  aria-label={ariaLabel}
                  aria-current={isCurrent ? "true" : undefined}
                  data-testid={`button-question-nav-${index + 1}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="inline-block w-4 h-4 bg-primary rounded mr-2"></span>Current/Answered
            <span className="inline-block w-4 h-4 bg-yellow-500 rounded mr-2 ml-4"></span>Flagged
            <span className="inline-block w-4 h-4 bg-green-500 rounded mr-2 ml-4"></span>Answered
            <span className="inline-block w-4 h-4 border border-gray-400 rounded mr-2 ml-4"></span>Not Answered
          </div>
        </div>

        {/* Submit Exam */}
        <div className="text-center">
          <Button
            onClick={handleSubmitExam}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 focus-visible:outline-2 focus-visible:outline-green-600"
            disabled={submitExamMutation.isPending}
            data-testid="button-submit-exam"
          >
            {submitExamMutation.isPending ? 'Submitting...' : 'Submit Exam'}
          </Button>
        </div>
      </section>
    </main>
  );
}
