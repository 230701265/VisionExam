import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AudioControls } from '@/components/AudioControls';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { TeacherDashboard } from './TeacherDashboard';
import type { Exam, ExamAttemptWithDetails } from '@shared/schema';
import {
  Clock,
  FileText,
  Calendar,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  BookOpen,
  ArrowUpRight,
  Trophy,
  Timer
} from 'lucide-react';

interface DashboardProps {
  currentUser: { id: string; username: string; role: string };
}

function SkeletonCard() {
  return (
    <div className="skeleton h-36 w-full rounded-xl" aria-hidden="true" />
  );
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

  const handleStartExam = (examTitle: string) => {
    announceToScreenReader(`Starting ${examTitle}. Full keyboard and audio support available.`);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const isPassed = (score: number, total: number) => (score / total) * 100 >= 70;

  const completedAttempts = attempts.filter(a => a.completedAt);
  const passedCount = completedAttempts.filter(a => a.score && isPassed(a.score, a.totalQuestions)).length;

  if (currentUser.role === 'instructor') {
    return (
      <main id="main-content" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 page-enter">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Welcome back, <span className="text-primary">{currentUser.username}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your exams and review student performance.</p>
        </div>
        <TeacherDashboard currentUser={currentUser} exams={exams} examsLoading={examsLoading} />
      </main>
    );
  }

  return (
    <main id="main-content" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 page-enter">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Welcome back, <span className="text-primary">{currentUser.username}</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your exams and progress — all in one place.
        </p>
      </div>

      {/* Stats row */}
      {!attemptsLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8" role="region" aria-label="Your statistics">
          {[
            { label: 'Available', value: exams.length, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
            { label: 'Completed', value: completedAttempts.length, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
            { label: 'Passed', value: passedCount, icon: Trophy, color: 'text-amber-600 bg-amber-50' },
            { label: 'In Progress', value: attempts.filter(a => !a.completedAt).length, icon: Timer, color: 'text-purple-600 bg-purple-50' },
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
      )}

      {/* Audio controls */}
      <div className="mb-8">
        <AudioControls className="" />
      </div>

      {/* Available Exams */}
      <section aria-labelledby="exams-heading" className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 id="exams-heading" className="text-lg font-semibold text-foreground">Available Exams</h2>
          <span className="text-sm text-muted-foreground">{exams.length} exam{exams.length !== 1 ? 's' : ''}</span>
        </div>

        {examsLoading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : exams.length === 0 ? (
          /* Empty state */
          <Card className="border-border shadow-sm">
            <CardContent className="py-16 flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <BookOpen className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No exams yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                No exams are currently available. Check back later or contact your instructor.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="group relative bg-card border border-border rounded-xl px-5 py-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20"
                tabIndex={0}
                role="article"
                aria-labelledby={`exam-title-${exam.id}`}
                data-testid={`card-exam-${exam.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: info */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3
                        id={`exam-title-${exam.id}`}
                        className="font-semibold text-foreground text-base leading-snug mb-1"
                        data-testid={`text-exam-title-${exam.id}`}
                      >
                        {exam.title}
                      </h3>
                      <p
                        className="text-sm text-muted-foreground mb-3 line-clamp-1"
                        data-testid={`text-exam-description-${exam.id}`}
                      >
                        {exam.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatDuration(exam.duration)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                          Available now
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: CTA */}
                  <Link href={`/exam/${exam.id}`} className="shrink-0">
                    <Button
                      className="h-9 px-4 gap-1.5 font-medium"
                      onClick={() => handleStartExam(exam.title)}
                      aria-describedby={`start-exam-desc-${exam.id}`}
                      data-testid={`button-start-exam-${exam.id}`}
                    >
                      Start
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </Link>
                  <p id={`start-exam-desc-${exam.id}`} className="sr-only">
                    Begin {exam.title}. Full keyboard and screen reader support available.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Results */}
      <section aria-labelledby="results-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="results-heading" className="text-lg font-semibold text-foreground">Recent Results</h2>
        </div>

        {attemptsLoading ? (
          <div className="skeleton h-48 rounded-xl" aria-hidden="true" />
        ) : attempts.length === 0 ? (
          <Card className="border-border shadow-sm">
            <CardContent className="py-12 flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Trophy className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No results yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete your first exam to see results here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <table
                className="table-premium w-full"
                role="table"
                aria-label="Recent exam results"
              >
                <caption className="sr-only">Your recent exam results</caption>
                <thead>
                  <tr>
                    <th scope="col">Exam</th>
                    <th scope="col" className="hidden sm:table-cell">Date</th>
                    <th scope="col">Score</th>
                    <th scope="col">Status</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.slice(0, 6).map((attempt) => {
                    const passed = attempt.score ? isPassed(attempt.score, attempt.totalQuestions) : null;
                    return (
                      <tr key={attempt.id}>
                        <td
                          className="font-medium text-foreground"
                          data-testid={`text-result-exam-${attempt.id}`}
                        >
                          {attempt.exam.title}
                        </td>
                        <td
                          className="text-muted-foreground hidden sm:table-cell"
                          data-testid={`text-result-date-${attempt.id}`}
                        >
                          {attempt.completedAt ? formatDate(attempt.completedAt) : '—'}
                        </td>
                        <td
                          className="font-semibold text-foreground"
                          data-testid={`text-result-score-${attempt.id}`}
                        >
                          {attempt.score ? `${attempt.score}/${attempt.totalQuestions}` : '—'}
                        </td>
                        <td data-testid={`text-result-status-${attempt.id}`}>
                          {passed === null ? (
                            <span className="badge-neutral inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium">
                              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                              In Progress
                            </span>
                          ) : passed ? (
                            <span className="badge-success inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium">
                              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                              Passed
                            </span>
                          ) : (
                            <span className="badge-danger inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium">
                              <XCircle className="h-3 w-3" aria-hidden="true" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td>
                          {attempt.completedAt && (
                            <Link href={`/results/${attempt.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                                data-testid={`button-view-results-${attempt.id}`}
                              >
                                View
                                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Keyboard hint */}
      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-xs">Alt+A</kbd>
        <span>Accessibility panel</span>
        <span className="mx-2 text-border">·</span>
        <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-xs">Tab</kbd>
        <span>Navigate</span>
        <span className="mx-2 text-border">·</span>
        <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-xs">Alt+H</kbd>
        <span>Help</span>
      </div>
    </main>
  );
}
