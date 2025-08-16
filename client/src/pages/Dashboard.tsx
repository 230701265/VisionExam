import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AudioControls } from '@/components/AudioControls';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { TeacherDashboard } from './TeacherDashboard';
import type { Exam, ExamAttemptWithDetails } from '@shared/schema';
import { Clock, FileText, Users, Calendar } from 'lucide-react';

interface DashboardProps {
  currentUser: { id: string; username: string; role: string };
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const { announceToScreenReader } = useAccessibility();

  const { data: exams = [], isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: ['/api/exams'],
  });

  const { data: attempts = [], isLoading: attemptsLoading } = useQuery<ExamAttemptWithDetails[]>({
    queryKey: ['/api/attempts/user', currentUser.id],
    enabled: currentUser.role === 'student',
  });

  // For teachers: get all exam attempts for their exams
  const { data: teacherAttempts = [], isLoading: teacherAttemptsLoading } = useQuery<ExamAttemptWithDetails[]>({
    queryKey: ['/api/attempts/instructor', currentUser.id],
    enabled: currentUser.role === 'instructor',
  });

  const handleStartExam = (examTitle: string) => {
    announceToScreenReader(`Starting ${examTitle}. You will be navigated to the exam interface with full keyboard navigation and audio support. Remember: Alt+R to read questions, Alt+N for next, Alt+P for previous, Alt+F to flag questions.`);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} minutes` : ''}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPassingStatus = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    return percentage >= 70 ? 'Passed' : 'Failed';
  };

  return (
    <main id="main-content" role="main" className="max-w-4xl mx-auto px-6 py-8">
      <section aria-labelledby="dashboard-heading">
        <div className="mb-8">
          <h2 id="dashboard-heading" className="text-3xl font-bold mb-4">
            Welcome to OPSIS, {currentUser.username}
          </h2>
          <p className="text-lg mb-6">
            Navigate through your available exams and manage your testing experience with full keyboard and screen reader support.
          </p>

          <AudioControls className="mb-8" />
        </div>

        {/* Teacher Dashboard */}
        {currentUser.role === 'instructor' && (
          <TeacherDashboard 
            currentUser={currentUser} 
            exams={exams} 
            examsLoading={examsLoading} 
          />
        )}

        {/* Student View: Available Exams */}
        {currentUser.role === 'student' && (
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-6">Available Exams</h3>
            
            {examsLoading ? (
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>
            ) : exams.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600 dark:text-gray-400">
                    No exams are currently available.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {exams.map((exam) => (
                  <Card key={exam.id} className="border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-xl font-semibold mb-2" data-testid={`text-exam-title-${exam.id}`}>
                            {exam.title}
                          </h4>
                          <p className="text-gray-700 dark:text-gray-300 mb-4" data-testid={`text-exam-description-${exam.id}`}>
                            {exam.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center" data-testid={`text-exam-duration-${exam.id}`}>
                              <Clock className="mr-1 h-4 w-4" />
                              Duration: {formatDuration(exam.duration)}
                            </span>
                            <span className="flex items-center">
                              <FileText className="mr-1 h-4 w-4" />
                              Questions: Loading...
                            </span>
                            <span className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4" />
                              Available now
                            </span>
                          </div>
                        </div>
                        <Link href={`/exam/${exam.id}`}>
                          <Button
                            className="bg-primary hover:bg-primary-dark ml-6 focus-visible:outline-2 focus-visible:outline-primary"
                            onClick={() => handleStartExam(exam.title)}
                            aria-describedby="start-exam-desc"
                            data-testid={`button-start-exam-${exam.id}`}
                          >
                            Start Exam
                          </Button>
                        </Link>
                        <p id="start-exam-desc" className="sr-only">
                          Begin the {exam.title}. You will be navigated to the exam interface.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Student Results */}
        {currentUser.role === 'student' && (
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-6">Recent Results</h3>
          
          {attemptsLoading ? (
            <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg animate-pulse" />
          ) : attempts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600 dark:text-gray-400">
                  No exam attempts found. Start taking exams to see your results here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg" 
                role="table" 
                aria-label="Recent exam results"
              >
                <caption className="sr-only">
                  Your recent exam results showing exam name, completion date, score, and status
                </caption>
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="text-left p-4 border-b border-gray-300 dark:border-gray-600" scope="col">
                      Exam
                    </th>
                    <th className="text-left p-4 border-b border-gray-300 dark:border-gray-600" scope="col">
                      Date
                    </th>
                    <th className="text-left p-4 border-b border-gray-300 dark:border-gray-600" scope="col">
                      Score
                    </th>
                    <th className="text-left p-4 border-b border-gray-300 dark:border-gray-600" scope="col">
                      Status
                    </th>
                    <th className="text-left p-4 border-b border-gray-300 dark:border-gray-600" scope="col">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.slice(0, 5).map((attempt) => (
                    <tr key={attempt.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="p-4" data-testid={`text-result-exam-${attempt.id}`}>
                        {attempt.exam.title}
                      </td>
                      <td className="p-4" data-testid={`text-result-date-${attempt.id}`}>
                        {attempt.completedAt ? formatDate(attempt.completedAt) : 'In Progress'}
                      </td>
                      <td className="p-4 font-semibold" data-testid={`text-result-score-${attempt.id}`}>
                        {attempt.score ? `${attempt.score}/${attempt.totalQuestions}` : 'N/A'}
                      </td>
                      <td className="p-4">
                        {attempt.score ? (
                          <span 
                            className={`px-3 py-1 rounded-full text-sm ${
                              getPassingStatus(attempt.score, attempt.totalQuestions) === 'Passed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                            data-testid={`text-result-status-${attempt.id}`}
                          >
                            {getPassingStatus(attempt.score, attempt.totalQuestions)}
                          </span>
                        ) : (
                          <span className="text-gray-500">Incomplete</span>
                        )}
                      </td>
                      <td className="p-4">
                        {attempt.completedAt && (
                          <Link href={`/results/${attempt.id}`}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              data-testid={`button-view-results-${attempt.id}`}
                            >
                              View Results
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        )}

        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>Use keyboard shortcuts for faster navigation:</p>
          <p className="text-sm mt-2">
            <strong>{navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Option' : 'Alt'} + H:</strong> Help and shortcuts | 
            <strong>{navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Option' : 'Alt'} + R:</strong> Read page | 
            <strong>{navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Cmd' : 'Ctrl'} + M:</strong> Voice input (in exams) | 
            <strong>Tab:</strong> Navigate | <strong>Enter/Space:</strong> Activate
          </p>
        </div>
      </section>
    </main>
  );
}
