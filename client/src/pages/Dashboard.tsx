import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AudioControls } from '@/components/AudioControls';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { TeacherDashboard } from './TeacherDashboard';
import type { Exam, ExamAttemptWithDetails } from '@shared/schema';
import {
  Clock, FileText, Calendar, ChevronRight, CheckCircle2,
  XCircle, Loader2, BookOpen, ArrowUpRight, Trophy,
  Timer, Bell, Megaphone, Accessibility, Mic2, Zap,
  Settings, HelpCircle, BarChart3, Play, Star,
  TrendingUp, AlertCircle, Info, User, Activity,
  Volume2, VolumeX, Eye, ChevronDown, Flame, Target,
  ClipboardCheck, Award, GraduationCap
} from 'lucide-react';

interface DashboardProps {
  currentUser: { id: string; username: string; role: string };
}

/* ── Animation variants ─────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1], delay },
});

const cardHover = {
  whileHover: { y: -3, boxShadow: '0 8px 24px -4px rgb(0 0 0 / 0.10)' },
  transition: { duration: 0.18 },
};

/* ── Helper components ──────────────────────────── */
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />;
}

function SectionHeader({
  id, title, subtitle, children,
}: {
  id: string; title: string; subtitle?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 id={id} className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── Countdown hook ─────────────────────────────── */
function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(Math.max(0, targetMs - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, targetMs - Date.now())), 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { h, m, s, expired: remaining === 0 };
}

/* ── Countdown digit cell ───────────────────────── */
function CountCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-primary">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ── Main dashboard ─────────────────────────────── */
export default function Dashboard({ currentUser }: DashboardProps) {
  const { settings, announceToScreenReader } = useAccessibility();
  const [notifRead, setNotifRead] = useState<Set<number>>(new Set());
  const [now] = useState(() => new Date());

  const { data: exams = [], isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: ['/api/exams'],
  });

  const { data: attempts = [], isLoading: attemptsLoading } = useQuery<ExamAttemptWithDetails[]>({
    queryKey: ['/api/attempts/user', currentUser.id],
    enabled: currentUser.role === 'student',
  });

  /* ── Derived data ───────────────────────────── */
  const handleStartExam = (title: string) =>
    announceToScreenReader(`Starting ${title}. Full keyboard and audio support available.`);

  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const fmtDuration = (m: number) =>
    m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ''}`.trim();

  const isPassed = (score: number, total: number) => (score / total) * 100 >= 70;
  const pct = (score: number, total: number) => Math.round((score / total) * 100);

  const completedAttempts = attempts.filter(a => a.completedAt);
  const inProgress = attempts.filter(a => !a.completedAt);
  const passedCount = completedAttempts.filter(a => a.score && isPassed(a.score, a.totalQuestions)).length;
  const avgScore = completedAttempts.length > 0
    ? Math.round(completedAttempts.reduce((s, a) => s + pct(a.score || 0, a.totalQuestions), 0) / completedAttempts.length)
    : 0;

  const attemptedExamIds = new Set(attempts.map(a => a.examId));
  const upcomingExams = exams.filter(e => !completedAttempts.find(a => a.examId === e.id));
  const nextExam = upcomingExams[0];
  const countdownTarget = Date.now() + 23 * 3600000 + 45 * 60000 + 30000; // simulated deadline ~24h

  /* ── Greeting ───────────────────────────────── */
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dayStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  /* ── Mock notifications ─────────────────────── */
  const notifications = [
    { id: 1, type: 'exam', icon: BookOpen, color: 'text-blue-600 bg-blue-50', title: 'New exam available', body: 'Mathematics Final Exam is now open.', time: '2h ago' },
    { id: 2, type: 'result', icon: Trophy, color: 'text-amber-600 bg-amber-50', title: 'Grade posted', body: 'Your result for Physics Quiz has been graded.', time: '1d ago' },
    { id: 3, type: 'alert', icon: AlertCircle, color: 'text-red-500 bg-red-50', title: 'Deadline reminder', body: 'Biology Test closes in 24 hours.', time: '3h ago' },
  ];

  /* ── Mock announcements ─────────────────────── */
  const announcements = [
    { id: 1, from: 'Prof. Johnson', avatar: 'PJ', text: 'All students must complete the Mathematics Final Exam before Friday.', time: 'Today, 9:00 AM', urgent: true },
    { id: 2, from: 'Admin', avatar: 'AD', text: 'Platform maintenance scheduled Sunday 2–4 AM. Please save your work.', time: 'Yesterday', urgent: false },
  ];

  /* ── Mock activity ──────────────────────────── */
  const activity = [
    ...completedAttempts.slice(0, 2).map(a => ({
      id: `attempt-${a.id}`,
      icon: CheckCircle2,
      color: 'text-green-600',
      title: `Completed: ${a.exam.title}`,
      sub: a.score ? `Score: ${a.score}/${a.totalQuestions}` : '',
      time: a.completedAt ? fmt(a.completedAt) : '',
    })),
    { id: 'login', icon: User, color: 'text-blue-600', title: 'Logged in', sub: 'Session started', time: fmtTime(now) },
    { id: 'a11y', icon: Accessibility, color: 'text-purple-600', title: 'Accessibility settings loaded', sub: '', time: fmtTime(now) },
  ];

  /* ── Stats config ───────────────────────────── */
  const stats = [
    { label: 'Available Exams', value: exams.length, icon: BookOpen, color: 'text-blue-600 bg-blue-50 border-blue-100', trend: '+1 this week' },
    { label: 'Completed', value: completedAttempts.length, icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-100', trend: `of ${attempts.length} attempts` },
    { label: 'Passed', value: passedCount, icon: Trophy, color: 'text-amber-600 bg-amber-50 border-amber-100', trend: `${completedAttempts.length > 0 ? Math.round((passedCount / completedAttempts.length) * 100) : 0}% pass rate` },
    { label: 'Avg Score', value: `${avgScore}%`, icon: BarChart3, color: 'text-purple-600 bg-purple-50 border-purple-100', trend: completedAttempts.length > 0 ? 'across all exams' : 'no exams yet' },
  ];

  /* ── Quick actions ──────────────────────────── */
  const quickActions = [
    { label: 'Start Exam', icon: Play, href: upcomingExams.length ? `/exam/${upcomingExams[0]?.id}` : '/', color: 'bg-primary text-white hover:bg-primary/90', primary: true },
    { label: 'My Results', icon: BarChart3, href: '/', color: 'bg-muted hover:bg-muted/80 text-foreground', primary: false },
    { label: 'Settings', icon: Settings, href: '/settings', color: 'bg-muted hover:bg-muted/80 text-foreground', primary: false },
    { label: 'Help & Shortcuts', icon: HelpCircle, href: '/help', color: 'bg-muted hover:bg-muted/80 text-foreground', primary: false },
  ];

  /* ── Instructor redirect ─────────────────────── */
  if (currentUser.role === 'instructor') {
    return (
      <main id="main-content" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 page-enter">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {greeting}, <span className="text-primary">{currentUser.username}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your exams and review student performance.</p>
        </div>
        <TeacherDashboard currentUser={currentUser} exams={exams} examsLoading={examsLoading} />
      </main>
    );
  }

  /* ═══════════════════════════════════════════════
     STUDENT DASHBOARD
  ═══════════════════════════════════════════════ */
  return (
    <main id="main-content" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 page-enter">

      {/* ── 1. Welcome Hero Card ───────────────────── */}
      <motion.div {...fadeUp(0)}>
        <div
          className="relative rounded-2xl overflow-hidden border border-primary/20"
          style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(199 89% 48%) 100%)' }}
          role="region"
          aria-label="Welcome section"
        >
          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
            aria-hidden="true"
          />
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Left: greeting */}
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div
                className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white text-2xl font-bold select-none shrink-0"
                aria-hidden="true"
              >
                {currentUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium mb-0.5">{dayStr}</p>
                <h1 className="text-white text-2xl font-bold tracking-tight leading-tight">
                  {greeting}, {currentUser.username} 👋
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white/90 text-xs font-medium">
                    <GraduationCap className="h-3 w-3" aria-hidden="true" />
                    Student
                  </span>
                  {inProgress.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/25 text-amber-100 text-xs font-medium">
                      <Flame className="h-3 w-3" aria-hidden="true" />
                      {inProgress.length} in progress
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: mini stats */}
            {!attemptsLoading && (
              <div className="flex gap-4 sm:gap-6">
                {[
                  { label: 'Exams', value: exams.length },
                  { label: 'Done', value: completedAttempts.length },
                  { label: 'Avg', value: `${avgScore}%` },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-2xl font-bold text-white tabular-nums">{s.value}</div>
                    <div className="text-xs text-white/60 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audio controls inside hero */}
          <div className="relative px-6 sm:px-8 pb-5 pt-0">
            <AudioControls className="" />
          </div>
        </div>
      </motion.div>

      {/* ── 2. Stats Row ──────────────────────────── */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        role="region"
        aria-label="Your statistics"
      >
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} {...fadeUp(0.05 + i * 0.06)} {...cardHover}>
              <Card className="border-border shadow-sm h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${s.color}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />
                  </div>
                  <div className="text-2xl font-bold text-foreground tabular-nums tracking-tight mb-0.5">
                    {attemptsLoading ? '—' : s.value}
                  </div>
                  <div className="text-sm font-medium text-foreground mb-0.5">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.trend}</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ── 3. Main 2-column layout ───────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ─── LEFT COLUMN (2/3) ─────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── 3a. Upcoming Exams ────────────────── */}
          <motion.section {...fadeUp(0.18)} aria-labelledby="upcoming-heading">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <SectionHeader
                  id="upcoming-heading"
                  title="Upcoming Exams"
                  subtitle={`${upcomingExams.length} exam${upcomingExams.length !== 1 ? 's' : ''} available`}
                >
                  <Badge variant="outline" className="text-xs font-medium">
                    {upcomingExams.length} open
                  </Badge>
                </SectionHeader>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                {examsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                ) : upcomingExams.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                      <BookOpen className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="font-medium text-foreground text-sm mb-1">All caught up!</p>
                    <p className="text-xs text-muted-foreground">No pending exams right now.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingExams.map((exam, i) => (
                      <motion.div
                        key={exam.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.07 }}
                        className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-accent/30 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/30"
                        tabIndex={0}
                        role="article"
                        aria-labelledby={`exam-title-${exam.id}`}
                        data-testid={`card-exam-${exam.id}`}
                        data-navigable="true"
                      >
                        {/* Icon */}
                        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3
                            id={`exam-title-${exam.id}`}
                            className="font-semibold text-foreground text-sm leading-snug mb-0.5 truncate"
                            data-testid={`text-exam-title-${exam.id}`}
                          >
                            {exam.title}
                          </h3>
                          <p
                            className="text-xs text-muted-foreground mb-2 truncate"
                            data-testid={`text-exam-description-${exam.id}`}
                          >
                            {exam.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {fmtDuration(exam.duration)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" aria-hidden="true" />
                              Pass: 70%
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 text-[10px] font-medium">
                              Open
                            </span>
                          </div>
                        </div>

                        {/* CTA */}
                        <Link href={`/exam/${exam.id}`} className="shrink-0">
                          <Button
                            size="sm"
                            className="h-8 px-3 gap-1.5 text-xs font-semibold"
                            onClick={() => handleStartExam(exam.title)}
                            aria-describedby={`start-desc-${exam.id}`}
                            data-testid={`button-start-exam-${exam.id}`}
                          >
                            <Play className="h-3 w-3" aria-hidden="true" />
                            Start
                          </Button>
                        </Link>
                        <p id={`start-desc-${exam.id}`} className="sr-only">
                          Begin {exam.title}. Full keyboard and screen reader support available.
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>

          {/* ── 3b. Completed Exams ───────────────── */}
          {completedAttempts.length > 0 && (
            <motion.section {...fadeUp(0.24)} aria-labelledby="completed-heading">
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 pt-5 px-5">
                  <SectionHeader
                    id="completed-heading"
                    title="Completed Exams"
                    subtitle={`${completedAttempts.length} finished`}
                  />
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0 space-y-3">
                  {completedAttempts.slice(0, 3).map((attempt, i) => {
                    const passed = attempt.score ? isPassed(attempt.score, attempt.totalQuestions) : false;
                    const percentage = attempt.score ? pct(attempt.score, attempt.totalQuestions) : 0;
                    return (
                      <motion.div
                        key={attempt.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.06 }}
                        className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background"
                      >
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${passed ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                          {passed
                            ? <Award className="h-5 w-5 text-green-600" aria-hidden="true" />
                            : <XCircle className="h-5 w-5 text-red-500" aria-hidden="true" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-foreground truncate">{attempt.exam.title}</span>
                            <span className={`text-xs font-bold ml-3 ${passed ? 'text-green-600' : 'text-red-500'}`}>
                              {percentage}%
                            </span>
                          </div>
                          <Progress
                            value={percentage}
                            className="h-1.5"
                            aria-label={`Score: ${percentage}%`}
                          />
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs text-muted-foreground">
                              {attempt.score}/{attempt.totalQuestions} correct
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${passed ? 'badge-success' : 'badge-danger'}`}>
                              {passed ? 'Passed' : 'Failed'}
                            </span>
                          </div>
                        </div>
                        {attempt.completedAt && (
                          <Link href={`/results/${attempt.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              aria-label={`View results for ${attempt.exam.title}`}
                              data-testid={`button-view-results-${attempt.id}`}
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.section>
          )}

          {/* ── 3c. Recent Results Table ──────────── */}
          <motion.section {...fadeUp(0.30)} aria-labelledby="results-heading">
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-5">
                <SectionHeader
                  id="results-heading"
                  title="Recent Results"
                  subtitle="Your latest exam scores"
                >
                  {attempts.length > 5 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground gap-1">
                      View all <ChevronRight className="h-3 w-3" />
                    </Button>
                  )}
                </SectionHeader>
              </CardHeader>
              <CardContent className="p-0">
                {attemptsLoading ? (
                  <div className="p-5"><Skeleton className="h-40" /></div>
                ) : attempts.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center px-5">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                      <Trophy className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="font-medium text-foreground text-sm mb-1">No results yet</p>
                    <p className="text-xs text-muted-foreground">Complete your first exam to see results here.</p>
                  </div>
                ) : (
                  <table className="table-premium w-full" role="table" aria-label="Recent exam results">
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
                      {attempts.slice(0, 6).map(attempt => {
                        const passed = attempt.score ? isPassed(attempt.score, attempt.totalQuestions) : null;
                        return (
                          <tr key={attempt.id}>
                            <td className="font-medium text-foreground" data-testid={`text-result-exam-${attempt.id}`}>
                              {attempt.exam.title}
                            </td>
                            <td className="text-muted-foreground hidden sm:table-cell" data-testid={`text-result-date-${attempt.id}`}>
                              {attempt.completedAt ? fmt(attempt.completedAt) : '—'}
                            </td>
                            <td className="font-semibold text-foreground" data-testid={`text-result-score-${attempt.id}`}>
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
                                    View <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                                  </Button>
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </motion.section>

          {/* ── 3d. Recent Activity ───────────────── */}
          <motion.section {...fadeUp(0.36)} aria-labelledby="activity-heading">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <SectionHeader id="activity-heading" title="Recent Activity" subtitle="Your session history" />
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <ol className="space-y-4" aria-label="Recent activity list">
                  {activity.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.38 + i * 0.06 }}
                        className="flex items-start gap-3"
                      >
                        <div className="relative flex flex-col items-center">
                          <div className={`h-8 w-8 rounded-xl border border-border bg-background flex items-center justify-center ${item.color}`}>
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          </div>
                          {i < activity.length - 1 && (
                            <div className="w-px h-4 bg-border mt-1" aria-hidden="true" />
                          )}
                        </div>
                        <div className="pb-4 flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground leading-snug">{item.title}</p>
                          {item.sub && <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">{item.time}</p>
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          </motion.section>
        </div>

        {/* ─── RIGHT SIDEBAR (1/3) ───────────────── */}
        <div className="space-y-5">

          {/* ── Exam Countdown ────────────────────── */}
          {nextExam && (
            <motion.section {...fadeUp(0.14)} aria-labelledby="countdown-heading">
              <CountdownCard exam={nextExam} targetMs={countdownTarget} fmtDuration={fmtDuration} />
            </motion.section>
          )}

          {/* ── Quick Actions ─────────────────────── */}
          <motion.section {...fadeUp(0.20)} aria-labelledby="actions-heading">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle id="actions-heading" className="text-base font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map(action => {
                    const Icon = action.icon;
                    return (
                      <Link key={action.label} href={action.href}>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`w-full flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-primary border border-transparent ${action.color} ${action.primary ? 'shadow-sm' : 'border-border'}`}
                          aria-label={action.label}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                          <span className="text-xs leading-tight text-center">{action.label}</span>
                        </motion.button>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* ── Notifications ─────────────────────── */}
          <motion.section {...fadeUp(0.26)} aria-labelledby="notif-heading">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <SectionHeader id="notif-heading" title="Notifications">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold">
                    {notifications.filter(n => !notifRead.has(n.id)).length}
                  </span>
                </SectionHeader>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0 space-y-3">
                <AnimatePresence>
                  {notifications.map(n => {
                    const Icon = n.icon;
                    const isRead = notifRead.has(n.id);
                    return (
                      <motion.button
                        key={n.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                          isRead ? 'bg-background border-border opacity-60' : 'bg-accent/40 border-primary/15 hover:bg-accent/70'
                        }`}
                        onClick={() => setNotifRead(prev => new Set(Array.from(prev).concat(n.id)))}
                        aria-label={`${n.title}: ${n.body}. ${isRead ? 'Read' : 'Unread'}. Click to mark as read.`}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${n.color}`}>
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                            {!isRead && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0" aria-label="Unread" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.section>

          {/* ── Announcements ─────────────────────── */}
          <motion.section {...fadeUp(0.32)} aria-labelledby="announce-heading">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <SectionHeader id="announce-heading" title="Announcements">
                  <Megaphone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </SectionHeader>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0 space-y-3">
                {announcements.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.34 + i * 0.06 }}
                    className={`p-3 rounded-xl border ${a.urgent ? 'bg-amber-50/50 border-amber-200' : 'bg-background border-border'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {a.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-semibold text-foreground">{a.from}</span>
                          {a.urgent && (
                            <span className="badge-warning text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{a.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">{a.time}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.section>

          {/* ── Accessibility Center ──────────────── */}
          <motion.section {...fadeUp(0.38)} aria-labelledby="a11y-heading">
            <Card className="border-border shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary to-blue-400" aria-hidden="true" />
              <CardHeader className="pb-2 pt-4 px-5">
                <SectionHeader id="a11y-heading" title="Accessibility">
                  <Accessibility className="h-4 w-4 text-primary" aria-hidden="true" />
                </SectionHeader>
              </CardHeader>
              <CardContent className="px-5 pb-4 pt-0">
                {/* Active feature pills */}
                <div className="flex flex-wrap gap-1.5 mb-3" role="list" aria-label="Active accessibility features">
                  {[
                    { label: 'WCAG 2.2 AA', always: true },
                    { label: 'High Contrast', active: settings?.contrastMode === 'high' },
                    { label: 'Dark Mode',     active: settings?.contrastMode === 'dark' },
                    { label: 'TTS',           active: settings?.speechEnabled },
                    { label: 'Dyslexia Font', active: settings?.fontFamily === 'dyslexia' },
                    { label: 'Reduced Motion',active: settings?.reducedMotion },
                    { label: 'Reading Mask',  active: settings?.readingMask },
                    { label: 'Live Captions', active: settings?.liveCaptions },
                  ].filter(f => f.always || f.active).map(f => (
                    <span
                      key={f.label}
                      role="listitem"
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${f.always ? 'bg-primary/10 text-primary' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${f.always ? 'bg-primary' : 'bg-emerald-500'}`} aria-hidden="true" />
                      {f.label}
                    </span>
                  ))}
                </div>

                {/* Quick status rows */}
                <div className="space-y-1.5 mb-3">
                  {[
                    { label: 'Screen Reader Ready', active: true, note: 'NVDA · JAWS · VoiceOver' },
                    { label: 'Text-to-Speech',      active: !!settings?.speechEnabled, note: settings?.speechEnabled ? `${(((settings?.speechRate ?? 10))/10).toFixed(1)}× speed` : 'Off' },
                    { label: 'Keyboard Navigation', active: true, note: 'Alt+Arrow keys' },
                    { label: 'Font Size',           active: true, note: `${settings?.fontSize ?? 16}px` },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-0.5">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">{item.note}</span>
                        <span className={`h-1.5 w-1.5 rounded-full ${item.active ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} aria-hidden="true" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="pt-2 border-t border-border">
                  <Link href="/accessibility">
                    <Button className="w-full h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90" aria-label="Open Accessibility Center">
                      <Accessibility className="h-3 w-3" aria-hidden="true" />
                      Open Accessibility Center
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* ── Voice Assistant Status ────────────── */}
          <motion.section {...fadeUp(0.44)} aria-labelledby="voice-heading">
            <VoiceAssistantCard settings={settings} />
          </motion.section>

        </div>
      </div>

      {/* ── 4. Keyboard hints bar ─────────────────── */}
      <motion.div {...fadeUp(0.48)}>
        <div
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground py-4 border-t border-border"
          role="complementary"
          aria-label="Keyboard shortcuts"
        >
          {[
            { key: 'Alt+A', label: 'Accessibility' },
            { key: 'Tab', label: 'Navigate' },
            { key: 'Alt+H', label: 'Help' },
            { key: 'Alt+R', label: 'Read aloud' },
            { key: 'F5', label: 'Run code' },
          ].map(k => (
            <span key={k.key} className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded-md bg-muted border border-border font-mono text-[10px] font-semibold">
                {k.key}
              </kbd>
              {k.label}
            </span>
          ))}
        </div>
      </motion.div>

    </main>
  );
}

/* ══════════════════════════════════════════════════
   Exam Countdown Card (separate component)
══════════════════════════════════════════════════ */
function CountdownCard({
  exam,
  targetMs,
  fmtDuration,
}: {
  exam: Exam;
  targetMs: number;
  fmtDuration: (m: number) => string;
}) {
  const { h, m, s, expired } = useCountdown(targetMs);
  return (
    <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="pb-2 pt-5 px-5">
        <SectionHeader id="countdown-heading" title="Next Exam Closes In">
          <Timer className="h-4 w-4 text-primary" aria-hidden="true" />
        </SectionHeader>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <p className="text-sm font-semibold text-foreground mb-4 truncate">{exam.title}</p>
        {expired ? (
          <p className="text-sm text-muted-foreground text-center py-2">Deadline passed</p>
        ) : (
          <div
            className="flex items-center justify-center gap-3 mb-4"
            aria-label={`${h} hours, ${m} minutes, ${s} seconds remaining`}
            aria-live="off"
          >
            <CountCell value={h} label="hrs" />
            <span className="text-xl font-bold text-primary/50 -mt-5" aria-hidden="true">:</span>
            <CountCell value={m} label="min" />
            <span className="text-xl font-bold text-primary/50 -mt-5" aria-hidden="true">:</span>
            <CountCell value={s} label="sec" />
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Duration: {fmtDuration(exam.duration)}
        </div>
        <Link href={`/exam/${exam.id}`}>
          <Button className="w-full h-9 gap-2 font-semibold" data-testid={`button-start-exam-${exam.id}`}>
            <Play className="h-4 w-4" aria-hidden="true" />
            Start Exam Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════
   Voice Assistant Status Card (separate component)
══════════════════════════════════════════════════ */
function VoiceAssistantCard({ settings }: { settings: any }) {
  const isActive = settings?.speechEnabled && settings?.audioInstructions;
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${isActive ? 'bg-green-50 border border-green-100' : 'bg-muted border border-border'}`}>
              {isActive
                ? <Mic2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                : <VolumeX className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground" id="voice-heading">Voice Assistant</p>
              <p className="text-xs text-muted-foreground">{isActive ? 'Active & Ready' : 'Inactive'}</p>
            </div>
          </div>
          <div
            className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-muted-foreground/40'}`}
            aria-label={isActive ? 'Active' : 'Inactive'}
          />
        </div>

        {isActive && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Speech rate</span>
              <span className="font-medium text-foreground">{((settings?.speechRate || 10) / 10).toFixed(1)}×</span>
            </div>
            <Progress value={((settings?.speechRate || 10) / 20) * 100} className="h-1" aria-label="Speech rate" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Volume</span>
              <span className="font-medium text-foreground">{settings?.speechVolume || 100}%</span>
            </div>
            <Progress value={settings?.speechVolume || 100} className="h-1" aria-label="Speech volume" />
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
          {isActive ? 'Press Alt+R to read any question aloud' : 'Enable in Settings → Accessibility'}
        </div>
      </CardContent>
    </Card>
  );
}
