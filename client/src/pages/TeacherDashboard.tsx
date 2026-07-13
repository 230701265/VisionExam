import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccessibility } from '@/components/AccessibilityProvider';
import type { Exam, ExamAttemptWithDetails } from '@shared/schema';
import {
  Edit,
  UserCheck,
  TrendingUp,
  BookOpen,
  ClipboardCheck,
  Users,
  CheckCircle2,
  BarChart3,
  Plus,
  ArrowUpRight,
  FileText
} from 'lucide-react';

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

  const myExams = exams.filter(exam => exam.createdBy === currentUser.id);

  const totalStudents = new Set(teacherAttempts.map(a => a.userId)).size;
  const completedAttempts = teacherAttempts.filter(a => a.completedAt);
  const overallAvg = completedAttempts.length > 0
    ? completedAttempts.reduce((sum, a) => sum + ((a.score || 0) / Math.max(a.totalQuestions, 1)) * 100, 0) / completedAttempts.length
    : 0;

  return (
    <>
      {/* Instructor stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8" role="region" aria-label="Instructor overview">
        {[
          { label: 'Total Exams', value: myExams.length, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-purple-600 bg-purple-50' },
          { label: 'Submissions', value: completedAttempts.length, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
          { label: 'Avg Score', value: `${Math.round(overallAvg)}%`, icon: BarChart3, color: 'text-amber-600 bg-amber-50' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="stat-number text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <Link href="/exams">
          <Button className="gap-2 font-medium" data-testid="button-manage-exams">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Manage Exams
          </Button>
        </Link>
        <Link href="/grade">
          <Button variant="outline" className="gap-2 font-medium" data-testid="button-grade-answers">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Grade Answers
          </Button>
        </Link>
      </div>

      {/* Exam list */}
      <section aria-labelledby="my-exams-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="my-exams-heading" className="text-lg font-semibold text-foreground">Your Exams</h2>
          <span className="text-sm text-muted-foreground">{myExams.length} exam{myExams.length !== 1 ? 's' : ''}</span>
        </div>

        {examsLoading || teacherAttemptsLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="skeleton h-52 rounded-xl" aria-hidden="true" />
            ))}
          </div>
        ) : myExams.length === 0 ? (
          <Card className="border-border shadow-sm">
            <CardContent className="py-16 flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <FileText className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No exams created yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first exam to get started.
              </p>
              <Link href="/exams">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create Exam
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {myExams.map((exam) => {
              const examAttempts = teacherAttempts.filter(a => a.examId === exam.id);
              const completed = examAttempts.filter(a => a.completedAt);
              const avgScore = completed.length > 0
                ? completed.reduce((sum, a) => sum + ((a.score || 0) / Math.max(a.totalQuestions, 1)) * 100, 0) / completed.length
                : 0;

              return (
                <Card
                  key={exam.id}
                  className="border-border shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle
                        className="text-base leading-snug"
                        data-testid={`text-teacher-exam-title-${exam.id}`}
                      >
                        {exam.title}
                      </CardTitle>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {examAttempts.length} student{examAttempts.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-1 text-xs">
                      {exam.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Mini stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="rounded-lg bg-blue-50 p-2.5 text-center">
                        <div className="text-lg font-bold text-blue-600">{examAttempts.length}</div>
                        <div className="text-[10px] font-medium text-blue-500 uppercase tracking-wide">Attempts</div>
                      </div>
                      <div className="rounded-lg bg-green-50 p-2.5 text-center">
                        <div className="text-lg font-bold text-green-600">{completed.length}</div>
                        <div className="text-[10px] font-medium text-green-500 uppercase tracking-wide">Done</div>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-2.5 text-center">
                        <div className="text-lg font-bold text-amber-600">
                          {completed.length > 0 ? `${Math.round(avgScore)}%` : '—'}
                        </div>
                        <div className="text-[10px] font-medium text-amber-500 uppercase tracking-wide">Avg</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href="/exams" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                          <Edit className="h-3 w-3" aria-hidden="true" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5 text-xs"
                        onClick={() => announceToScreenReader(`${examAttempts.length} student attempts for ${exam.title}`)}
                        data-testid={`button-view-attempts-${exam.id}`}
                      >
                        <UserCheck className="h-3 w-3" aria-hidden="true" />
                        Attempts
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
