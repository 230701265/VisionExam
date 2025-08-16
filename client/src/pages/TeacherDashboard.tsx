import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccessibility } from '@/components/AccessibilityProvider';
import type { Exam, ExamAttemptWithDetails } from '@shared/schema';
import { Clock, Edit, UserCheck, TrendingUp, FileText } from 'lucide-react';

interface TeacherDashboardProps {
  currentUser: { id: string; username: string; role: string };
  exams: Exam[];
  examsLoading: boolean;
}

export function TeacherDashboard({ currentUser, exams, examsLoading }: TeacherDashboardProps) {
  const { announceToScreenReader } = useAccessibility();

  const { data: teacherAttempts = [], isLoading: teacherAttemptsLoading } = useQuery<ExamAttemptWithDetails[]>({
    queryKey: ['/api/attempts/instructor', currentUser.id],
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Teacher View: Exam Management */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold">Exam Management</h3>
          <div className="flex gap-3">
            <Link href="/exams">
              <Button className="bg-primary hover:bg-primary-dark" data-testid="button-manage-exams">
                <Edit className="mr-2 h-4 w-4" />
                Manage Exams
              </Button>
            </Link>
            <Link href="/grade">
              <Button variant="outline" data-testid="button-grade-answers">
                <FileText className="mr-2 h-4 w-4" />
                Grade Answers
              </Button>
            </Link>
          </div>
        </div>
        
        {examsLoading ? (
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {exams.filter(exam => exam.createdBy === currentUser.id).map((exam) => {
              const examAttempts = teacherAttempts.filter(attempt => attempt.examId === exam.id);
              const completedAttempts = examAttempts.filter(attempt => attempt.completedAt);
              const averageScore = completedAttempts.length > 0 
                ? completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / completedAttempts.length 
                : 0;
              
              return (
                <Card key={exam.id} className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span data-testid={`text-teacher-exam-title-${exam.id}`}>{exam.title}</span>
                      <Badge variant="outline">
                        {examAttempts.length} Students
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {exam.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {examAttempts.length}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">Total Attempts</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {completedAttempts.length}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
                      </div>
                    </div>
                    
                    {completedAttempts.length > 0 && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <TrendingUp className="mr-1 h-4 w-4" />
                          Average Score: {averageScore.toFixed(1)}%
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Link href={`/exams`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="mr-1 h-3 w-3" />
                          Edit Exam
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => announceToScreenReader(`Viewing ${examAttempts.length} student attempts for ${exam.title}`)}
                        data-testid={`button-view-attempts-${exam.id}`}
                      >
                        <UserCheck className="mr-1 h-3 w-3" />
                        View Attempts
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Teacher View: Recent Student Activity */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-6">Recent Student Activity</h3>
        
        {teacherAttemptsLoading ? (
          <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg animate-pulse" />
        ) : teacherAttempts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600 dark:text-gray-400">
                No student exam attempts yet. Students will appear here when they start taking your exams.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg" 
              role="table" 
              aria-label="Recent student exam attempts"
            >
              <caption className="sr-only">
                Recent student exam attempts showing student name, exam, status, and scores
              </caption>
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-4 border-b border-gray-300 dark:border-gray-600" scope="col">
                    Student
                  </th>
                  <th className="text-left p-4 border-b border-gray-300 dark:border-gray-600" scope="col">
                    Exam
                  </th>
                  <th className="text-left p-4 border-b border-gray-300 dark:border-gray-600" scope="col">
                    Status
                  </th>
                  <th className="text-left p-4 border-b border-gray-300 dark:border-gray-600" scope="col">
                    Score
                  </th>
                  <th className="text-left p-4 border-b border-gray-300 dark:border-gray-600" scope="col">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {teacherAttempts.slice(0, 10).map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-4 border-b border-gray-200 dark:border-gray-700" data-testid={`text-student-${attempt.id}`}>
                      <div className="font-medium">{attempt.user.username}</div>
                    </td>
                    <td className="p-4 border-b border-gray-200 dark:border-gray-700" data-testid={`text-attempt-exam-${attempt.id}`}>
                      {attempt.exam.title}
                    </td>
                    <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <Badge variant={attempt.completedAt ? 'default' : 'secondary'}>
                        {attempt.completedAt ? 'Completed' : 'In Progress'}
                      </Badge>
                    </td>
                    <td className="p-4 border-b border-gray-200 dark:border-gray-700" data-testid={`text-attempt-score-${attempt.id}`}>
                      {attempt.score !== null && attempt.score !== undefined ? `${attempt.score}%` : 'Pending'}
                    </td>
                    <td className="p-4 border-b border-gray-200 dark:border-gray-700" data-testid={`text-attempt-date-${attempt.id}`}>
                      {attempt.completedAt ? formatDate(attempt.completedAt) : 'In Progress'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}