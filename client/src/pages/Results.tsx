import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceControl } from '@/components/VoiceControl';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import type { ParsedVoiceCommand } from '@/voice/types';
import type { ExamAttempt, ExamWithQuestions } from '@shared/schema';
import { CheckCircle, XCircle, Download, ArrowLeft, Clock, Target } from 'lucide-react';

interface ResultsProps {
  currentUser: { id: string; username: string; role: string };
}

export default function Results({ currentUser }: ResultsProps) {
  const [, params] = useRoute('/results/:id');
  const {
    announceToScreenReader,
    speak,
    settings,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    updateSettings,
  } = useAccessibility();

  const attemptId = params?.id;

  const { data: attempt, isLoading: attemptLoading } = useQuery<ExamAttempt>({
    queryKey: ['/api/attempts', attemptId],
    enabled: !!attemptId,
  });

  const { data: exam, isLoading: examLoading } = useQuery<ExamWithQuestions>({
    queryKey: ['/api/exams', attempt?.examId],
    enabled: !!attempt?.examId,
  });

  const isLoading = attemptLoading || examLoading;

  const readResults = useCallback(() => {
    if (!attempt || !exam) {
      speak('Results are not available yet.', { priority: 'interrupt' });
      return;
    }
    const percentage = attempt.score
      ? Math.round((attempt.score / attempt.totalQuestions) * 100)
      : 0;
    speak(
      `Exam results for ${exam.title}. Score ${attempt.score ?? 0} out of ${attempt.totalQuestions}, ${percentage} percent. ${percentage >= 70 ? 'Passed.' : 'Not passed.'}`,
      { priority: 'interrupt' },
    );
    announceToScreenReader('Reading exam results aloud.');
  }, [announceToScreenReader, attempt, exam, speak]);

  const voiceCommandHandler = useCallback((command: ParsedVoiceCommand) => {
    switch (command.definition.id) {
      case 'readResults':
      case 'readQuestion':
      case 'repeat':
        readResults();
        break;
      case 'help':
        speak('Available commands on this page include read results, repeat, pause speech, resume speech, speak faster, and speak slower.', { priority: 'interrupt' });
        break;
      case 'cancel':
        stopSpeaking();
        announceToScreenReader('Speech cancelled.');
        break;
      case 'pauseSpeech':
        pauseSpeaking();
        break;
      case 'resumeSpeech':
        resumeSpeaking();
        break;
      case 'increaseSpeechRate':
        updateSettings({ speechRate: Math.min(20, settings.speechRate + 1) });
        speak('Speech rate increased.', { priority: 'interrupt' });
        break;
      case 'decreaseSpeechRate':
        updateSettings({ speechRate: Math.max(5, settings.speechRate - 1) });
        speak('Speech rate decreased.', { priority: 'interrupt' });
        break;
    }
  }, [
    announceToScreenReader,
    pauseSpeaking,
    readResults,
    resumeSpeaking,
    settings.speechRate,
    speak,
    stopSpeaking,
    updateSettings,
  ]);

  const voice = useVoiceCommands({
    scope: 'results',
    mode: settings.voiceMode,
    language: settings.language,
    onCommand: voiceCommandHandler,
  });

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading results...</p>
        </div>
      </main>
    );
  }

  if (!attempt || !exam) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Results Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The exam results you're looking for could not be found.
          </p>
          <Link href="/">
            <Button data-testid="button-return-dashboard">Return to Dashboard</Button>
          </Link>
        </div>
      </main>
    );
  }

  const percentage = attempt.score ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0;
  const passed = percentage >= 70;
  const timeSpent = attempt.timeSpent || 0;

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} minutes` : ''}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadResults = () => {
    announceToScreenReader('Downloading results certificate');
    // In a real app, this would generate and download a PDF
    alert('Results download would be implemented here');
  };

  const reviewAnswers = () => {
    announceToScreenReader('Opening answer review');
    // Navigate to detailed answer review
  };

  return (
    <main id="main-content" role="main" className="max-w-4xl mx-auto px-6 py-8">
      <VoiceControl
        mode={settings.voiceMode}
        isSupported={voice.isSupported}
        isListening={voice.isListening}
        interimText={voice.interimText}
        lastTranscript={voice.lastTranscript}
        error={voice.error}
        onToggle={voice.toggleListening}
        onStopSpeech={voice.stopSpeech}
      />
      <section aria-labelledby="results-heading">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="focus-visible:outline-2 focus-visible:outline-primary" data-testid="button-back-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Results Header */}
        <div className="text-center mb-8">
          <h2 id="results-heading" className="text-3xl font-bold mb-4">Exam Results</h2>
          <h3 className="text-xl text-gray-600 dark:text-gray-400 mb-6" data-testid="text-exam-title">
            {exam.title}
          </h3>
          
          <Card className={`inline-block ${passed ? 'border-green-500' : 'border-red-500'}`}>
            <CardContent className="pt-6">
              <div className={`text-center p-8 ${passed ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'} rounded-lg`}>
                {passed ? (
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                )}
                <div className="text-4xl font-bold mb-2" data-testid="text-score">
                  {attempt.score}/{attempt.totalQuestions}
                </div>
                <div className="text-2xl font-semibold" data-testid="text-percentage">
                  {percentage}% - {passed ? 'Pass' : 'Fail'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div className="flex justify-between" data-testid="stat-total-questions">
                  <dt className="font-medium">Total Questions:</dt>
                  <dd>{attempt.totalQuestions}</dd>
                </div>
                <div className="flex justify-between" data-testid="stat-correct-answers">
                  <dt className="font-medium">Correct Answers:</dt>
                  <dd className="text-green-600">{attempt.score}</dd>
                </div>
                <div className="flex justify-between" data-testid="stat-incorrect-answers">
                  <dt className="font-medium">Incorrect Answers:</dt>
                  <dd className="text-red-600">{attempt.totalQuestions - (attempt.score || 0)}</dd>
                </div>
                <div className="flex justify-between" data-testid="stat-time-taken">
                  <dt className="font-medium">Time Taken:</dt>
                  <dd className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {formatTime(timeSpent)}
                  </dd>
                </div>
                <div className="flex justify-between" data-testid="stat-completion-date">
                  <dt className="font-medium">Completed:</dt>
                  <dd>{attempt.completedAt ? formatDate(attempt.completedAt) : 'N/A'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-primary mr-2 mt-1">•</span>
                  <span>Review your answers in detail</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2 mt-1">•</span>
                  <span>Download your results certificate</span>
                </li>
                {!passed && (
                  <li className="flex items-start">
                    <span className="text-primary mr-2 mt-1">•</span>
                    <span>Consider retaking the exam to improve your score</span>
                  </li>
                )}
                <li className="flex items-start">
                  <span className="text-primary mr-2 mt-1">•</span>
                  <span>Take additional practice exams</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Question Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Question Breakdown</CardTitle>
            <CardDescription>
              Detailed breakdown of your performance by question type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exam.questions.map((question, index) => {
                const userAnswer = attempt.answers ? (attempt.answers as any)[question.id] : undefined;
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                  <div 
                    key={question.id}
                    className={`p-4 border rounded-lg ${
                      isCorrect 
                        ? 'border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-600' 
                        : 'border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-600'
                    }`}
                    data-testid={`question-result-${index + 1}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">
                          Question {index + 1}: {question.text}
                        </h4>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">Your answer: </span>
                            <span className={isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                              {userAnswer || 'No answer'}
                            </span>
                          </div>
                          {!isCorrect && (
                            <div>
                              <span className="font-medium">Correct answer: </span>
                              <span className="text-green-700 dark:text-green-300">
                                {question.correctAnswer}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        {isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={reviewAnswers}
            variant="outline"
            className="focus-visible:outline-2 focus-visible:outline-primary"
            data-testid="button-review-answers"
          >
            Review Answers
          </Button>
          <Button
            onClick={downloadResults}
            variant="outline"
            className="focus-visible:outline-2 focus-visible:outline-primary"
            data-testid="button-download-results"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Results
          </Button>
          <Link href="/">
            <Button
              className="bg-primary hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-primary"
              data-testid="button-return-dashboard-main"
            >
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
