import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  LayoutDashboard, Users, GraduationCap, Building2, BookOpen, Library,
  FileText, BarChart3, Download, Settings, Accessibility, Bell,
  Megaphone, ShieldCheck, ChevronLeft, ChevronRight, Search, Filter,
  Plus, Trash2, Edit, Eye, CheckSquare, Square, MoreHorizontal,
  TrendingUp, TrendingDown, ArrowUpRight, RefreshCw, X, Check,
  AlertCircle, Info, Star, Clock, Award, Target, Zap, Globe,
  Upload, FileDown, Mail, SlidersHorizontal, ChevronDown, LogOut,
  LayoutGrid
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient as qc } from '@/lib/queryClient';
import type { Exam, Question, User } from '@shared/schema';

/* ─── Types ───────────────────────────────────────────────── */
interface CurrentUser { id: string; username: string; role: string }

interface AdminPortalProps { currentUser: CurrentUser; onLogout?: () => void }

interface MockStudent {
  id: string; name: string; rollNo: string; department: string;
  email: string; avgScore: number; examsCompleted: number;
  lastActive: string; status: 'active' | 'inactive' | 'suspended';
}
interface MockFaculty {
  id: string; name: string; department: string; email: string;
  examsCreated: number; studentsCount: number; joinedDate: string; status: 'active' | 'inactive';
}
interface MockDepartment { id: string; name: string; code: string; head: string; students: number; faculty: number; exams: number; color: string }
interface MockSubject { id: string; name: string; code: string; department: string; credits: number; questions: number; exams: number }
interface MockAnnouncement { id: string; title: string; body: string; target: string; createdAt: string; isActive: boolean; priority: 'low' | 'medium' | 'high' }
interface MockNotification { id: string; title: string; body: string; type: 'info' | 'warning' | 'success' | 'error'; createdAt: string; read: boolean }

/* ─── Mock data ────────────────────────────────────────────── */
const DEPTS = ['Computer Science', 'Mathematics', 'Physics', 'Engineering', 'Biology', 'Chemistry', 'Economics', 'Literature'];
const DEPT_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#DB2777', '#65A30D'];

const MOCK_STUDENTS: MockStudent[] = Array.from({ length: 28 }, (_, i) => ({
  id: `s${i + 1}`,
  name: ['Aisha Rahman', 'Liam Chen', 'Sofia Petrova', 'James Okafor', 'Mei Tanaka', 'Carlos Rivera', 'Amara Diallo', 'Noah Williams', 'Priya Sharma', 'Felix Müller', 'Yuki Nakamura', 'Isabella Santos', 'Ahmed Al-Farsi', 'Emma Johnson', 'Kwame Asante', 'Zara Khan', 'Lucas Fontaine', 'Nadia Kovač', 'Rishi Patel', 'Olivia Brown', 'Diego Morales', 'Fatima Al-Zahrawi', 'Ethan Park', 'Chioma Eze', 'Anna Lindqvist', 'Omar Yilmaz', 'Sara Johansson', 'Ben Tran'][i],
  rollNo: `S${String(i + 100).padStart(3, '0')}`,
  department: DEPTS[i % DEPTS.length],
  email: `student${i + 1}@opsis.edu`,
  avgScore: Math.round(55 + Math.random() * 40),
  examsCompleted: Math.floor(1 + Math.random() * 10),
  lastActive: `${Math.floor(1 + Math.random() * 14)} days ago`,
  status: i % 9 === 0 ? 'suspended' : i % 5 === 0 ? 'inactive' : 'active',
}));

const MOCK_FACULTY: MockFaculty[] = [
  { id: 'f1', name: 'Dr. Sarah Mitchell', department: 'Computer Science', email: 'smitchell@opsis.edu', examsCreated: 12, studentsCount: 87, joinedDate: '2021-08-01', status: 'active' },
  { id: 'f2', name: 'Prof. James Wu', department: 'Mathematics', email: 'jwu@opsis.edu', examsCreated: 8, studentsCount: 64, joinedDate: '2020-01-15', status: 'active' },
  { id: 'f3', name: 'Dr. Amina Hassan', department: 'Physics', email: 'ahassan@opsis.edu', examsCreated: 15, studentsCount: 120, joinedDate: '2019-09-01', status: 'active' },
  { id: 'f4', name: 'Prof. Elena Volkov', department: 'Engineering', email: 'evolkov@opsis.edu', examsCreated: 6, studentsCount: 45, joinedDate: '2022-02-10', status: 'active' },
  { id: 'f5', name: 'Dr. Kofi Mensah', department: 'Biology', email: 'kmensah@opsis.edu', examsCreated: 9, studentsCount: 73, joinedDate: '2020-06-01', status: 'inactive' },
  { id: 'f6', name: 'Dr. Lisa Andersen', department: 'Chemistry', email: 'landersen@opsis.edu', examsCreated: 11, studentsCount: 58, joinedDate: '2021-03-15', status: 'active' },
  { id: 'f7', name: 'Prof. Raj Subramaniam', department: 'Computer Science', email: 'rsubramaniam@opsis.edu', examsCreated: 20, studentsCount: 145, joinedDate: '2018-08-01', status: 'active' },
  { id: 'f8', name: 'Dr. Maria Gonzalez', department: 'Economics', email: 'mgonzalez@opsis.edu', examsCreated: 7, studentsCount: 52, joinedDate: '2022-08-20', status: 'active' },
];

const MOCK_DEPARTMENTS: MockDepartment[] = DEPTS.map((name, i) => ({
  id: `d${i + 1}`, name, code: name.split(' ').map(w => w[0]).join('').toUpperCase(),
  head: MOCK_FACULTY[i % MOCK_FACULTY.length].name,
  students: 40 + Math.floor(Math.random() * 120),
  faculty: 3 + Math.floor(Math.random() * 8),
  exams: 5 + Math.floor(Math.random() * 20),
  color: DEPT_COLORS[i],
}));

const MOCK_SUBJECTS: MockSubject[] = [
  { id: 'sub1', name: 'Data Structures & Algorithms', code: 'CS301', department: 'Computer Science', credits: 4, questions: 120, exams: 3 },
  { id: 'sub2', name: 'Linear Algebra', code: 'MTH201', department: 'Mathematics', credits: 3, questions: 85, exams: 2 },
  { id: 'sub3', name: 'Quantum Mechanics', code: 'PHY401', department: 'Physics', credits: 4, questions: 95, exams: 2 },
  { id: 'sub4', name: 'Thermodynamics', code: 'ENG301', department: 'Engineering', credits: 3, questions: 70, exams: 2 },
  { id: 'sub5', name: 'Molecular Biology', code: 'BIO201', department: 'Biology', credits: 3, questions: 110, exams: 3 },
  { id: 'sub6', name: 'Organic Chemistry', code: 'CHE301', department: 'Chemistry', credits: 4, questions: 130, exams: 3 },
  { id: 'sub7', name: 'Microeconomics', code: 'ECO201', department: 'Economics', credits: 3, questions: 75, exams: 2 },
  { id: 'sub8', name: 'Web Development', code: 'CS401', department: 'Computer Science', credits: 3, questions: 90, exams: 2 },
  { id: 'sub9', name: 'Calculus III', code: 'MTH301', department: 'Mathematics', credits: 4, questions: 100, exams: 3 },
  { id: 'sub10', name: 'Electromagnetism', code: 'PHY301', department: 'Physics', credits: 3, questions: 80, exams: 2 },
];

const MOCK_ANNOUNCEMENTS: MockAnnouncement[] = [
  { id: 'a1', title: 'Mid-semester Exam Schedule Released', body: 'All mid-semester examinations will be held from Week 8 to Week 9. Please review the schedule in the portal.', target: 'all', createdAt: '2026-07-10T09:00:00Z', isActive: true, priority: 'high' },
  { id: 'a2', title: 'System Maintenance on July 20', body: 'OPSIS will undergo scheduled maintenance from 2–4 AM UTC. Services may be briefly unavailable.', target: 'all', createdAt: '2026-07-08T14:30:00Z', isActive: true, priority: 'medium' },
  { id: 'a3', title: 'New Accessibility Features Available', body: 'We have added enhanced screen reader support and voice navigation. Visit the Accessibility Center to explore.', target: 'students', createdAt: '2026-07-05T10:00:00Z', isActive: true, priority: 'low' },
  { id: 'a4', title: 'Faculty Workshop: AI in Education', body: 'Mandatory workshop for all faculty on integrating AI tools into assessment creation. Register by July 18.', target: 'faculty', createdAt: '2026-07-03T08:00:00Z', isActive: false, priority: 'high' },
];

const MOCK_NOTIFICATIONS: MockNotification[] = [
  { id: 'n1', title: 'New exam submission', body: 'Aisha Rahman completed "Mathematics Final Exam" with a score of 92%.', type: 'success', createdAt: '2026-07-14T11:23:00Z', read: false },
  { id: 'n2', title: 'Student flagged for review', body: 'Unusual activity detected for student S109 during Physics exam.', type: 'warning', createdAt: '2026-07-14T10:05:00Z', read: false },
  { id: 'n3', title: 'Exam grading complete', body: '"Linear Algebra Midterm" has been auto-graded. 24 submissions processed.', type: 'info', createdAt: '2026-07-13T16:40:00Z', read: true },
  { id: 'n4', title: 'System backup successful', body: 'Daily backup completed at 03:00 AM. All data secured.', type: 'success', createdAt: '2026-07-14T03:01:00Z', read: true },
  { id: 'n5', title: 'Failed login attempts', body: '5 failed login attempts detected for user "admin". IP blocked.', type: 'error', createdAt: '2026-07-13T22:14:00Z', read: false },
  { id: 'n6', title: 'New faculty registration', body: 'Dr. Maria Gonzalez has registered and is pending role approval.', type: 'info', createdAt: '2026-07-12T09:30:00Z', read: true },
];

/* ─── Chart data ────────────────────────────────────────────── */
const submissionTrend = [
  { day: 'Mon', submissions: 18, completions: 14 },
  { day: 'Tue', submissions: 24, completions: 20 },
  { day: 'Wed', submissions: 31, completions: 27 },
  { day: 'Thu', submissions: 22, completions: 18 },
  { day: 'Fri', submissions: 38, completions: 33 },
  { day: 'Sat', submissions: 12, completions: 10 },
  { day: 'Sun', submissions: 8,  completions: 7  },
];
const scoreDistribution = [
  { range: '0–49', count: 12 }, { range: '50–59', count: 18 },
  { range: '60–69', count: 27 }, { range: '70–79', count: 45 },
  { range: '80–89', count: 38 }, { range: '90–100', count: 22 },
];
const monthlyPerf = [
  { month: 'Feb', avg: 64 }, { month: 'Mar', avg: 68 }, { month: 'Apr', avg: 71 },
  { month: 'May', avg: 69 }, { month: 'Jun', avg: 74 }, { month: 'Jul', avg: 77 },
];
const subjectPerf = [
  { subject: 'CS', avg: 78 }, { subject: 'Math', avg: 71 }, { subject: 'Physics', avg: 65 },
  { subject: 'Eng', avg: 73 }, { subject: 'Bio', avg: 69 }, { subject: 'Chem', avg: 67 },
];
const radarData = [
  { metric: 'Completion', A: 85 }, { metric: 'Accuracy', A: 72 }, { metric: 'Speed', A: 60 },
  { metric: 'Engagement', A: 78 }, { metric: 'Improvement', A: 65 }, { metric: 'Accessibility', A: 90 },
];
const a11yUsage = [
  { feature: 'Screen Reader', users: 45 }, { feature: 'High Contrast', users: 62 },
  { feature: 'Large Text', users: 78 }, { feature: 'Voice Nav', users: 23 },
  { feature: 'TTS', users: 55 }, { feature: 'Reduced Motion', users: 34 },
  { feature: 'Captions', users: 41 }, { feature: 'Reading Mask', users: 19 },
];
const roleBreakdown = [
  { name: 'Students', value: 28, color: '#2563EB' },
  { name: 'Faculty', value: 8, color: '#7C3AED' },
  { name: 'Admins', value: 2, color: '#059669' },
];

/* ─── Utilities ─────────────────────────────────────────────── */
function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── Shared UI primitives ──────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: number;
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          {trend !== undefined && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-medium mt-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}% vs last month
            </span>
          )}
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    suspended: 'bg-red-50 text-red-700 border-red-200',
    draft: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? map.inactive}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const CHART_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];

/* ─── Section: Dashboard ────────────────────────────────────── */
function DashboardSection({ exams }: { exams: Exam[] }) {
  const { data: stats } = useQuery<{ totalUsers: number; students: number; faculty: number; totalExams: number }>({
    queryKey: ['/api/admin/stats'],
  });
  return (
    <div className="space-y-6">
      <SectionHeader title="Dashboard" description="Institution-wide overview and key performance indicators." />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats?.students ?? MOCK_STUDENTS.length} sub="Enrolled" icon={Users} color="bg-blue-50 text-blue-600" trend={6} />
        <StatCard label="Faculty Members" value={stats?.faculty ?? MOCK_FACULTY.length} sub="Active instructors" icon={GraduationCap} color="bg-violet-50 text-violet-600" trend={2} />
        <StatCard label="Active Exams" value={stats?.totalExams ?? exams.length} sub="Published exams" icon={FileText} color="bg-emerald-50 text-emerald-600" trend={14} />
        <StatCard label="Avg Score" value="74%" sub="Across all subjects" icon={Award} color="bg-amber-50 text-amber-600" trend={3} />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard title="Weekly Exam Activity" description="Submissions vs completions this week">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={submissionTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="submissions" stroke="#2563EB" strokeWidth={2} fill="url(#gradSub)" name="Submissions" />
                <Area type="monotone" dataKey="completions" stroke="#059669" strokeWidth={2} fill="url(#gradComp)" name="Completions" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="User Breakdown" description="Roles distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={roleBreakdown} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {roleBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Score Distribution" description="Student scores across all exams">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreDistribution} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Performance Trend" description="6-month average score trajectory">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyPerf} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[55, 85]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v}%`, 'Avg Score']} />
              <Line type="monotone" dataKey="avg" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 4, fill: '#7C3AED' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent activity */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {[
            { icon: Check, color: 'text-emerald-600 bg-emerald-50', text: 'Aisha Rahman completed "Mathematics Final Exam"', time: '11:23 AM', score: '92%' },
            { icon: Plus, color: 'text-blue-600 bg-blue-50', text: 'Dr. Sarah Mitchell created "CS301 Midterm"', time: '10:45 AM', score: null },
            { icon: AlertCircle, color: 'text-amber-600 bg-amber-50', text: 'Student S109 flagged for unusual activity', time: '10:05 AM', score: null },
            { icon: Award, color: 'text-violet-600 bg-violet-50', text: 'Carlos Rivera scored 98% on "Calculus III"', time: '09:32 AM', score: '98%' },
            { icon: Users, color: 'text-blue-600 bg-blue-50', text: '3 new students registered', time: 'Yesterday', score: null },
          ].map(({ icon: Icon, color, text, time, score }, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <p className="flex-1 text-sm text-foreground">{text}</p>
              {score && <span className="text-xs font-semibold text-emerald-600">{score}</span>}
              <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Section: Students ─────────────────────────────────────── */
function StudentsSection() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const filtered = useMemo(() => MOCK_STUDENTS.filter(s =>
    (deptFilter === 'all' || s.department === deptFilter) &&
    (statusFilter === 'all' || s.status === statusFilter) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase()))
  ), [search, deptFilter, statusFilter]);

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  const handleExport = () => {
    const data = (selected.size > 0 ? filtered.filter(s => selected.has(s.id)) : filtered)
      .map(({ id: _id, ...rest }) => rest as unknown as Record<string, unknown>);
    exportToCSV(data, 'students.csv');
    toast({ title: 'Exported', description: `${data.length} student records downloaded.` });
  };

  const handleBulkDelete = () => {
    toast({ title: 'Bulk action', description: `${selected.size} student(s) removed (demo).`, variant: 'destructive' });
    setSelected(new Set());
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Students" description={`${MOCK_STUDENTS.length} enrolled students`}
        actions={<>
          <Button size="sm" variant="outline" onClick={handleExport}><FileDown className="h-4 w-4 mr-1.5" />Export CSV</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Student</Button>
        </>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…" className="pl-8 h-9 text-sm" />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        {selected.size > 0 && (
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete {selected.size}
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Students table">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                <th className="w-10 px-4 py-3 text-left">
                  <button onClick={toggleAll} aria-label="Select all" className="text-muted-foreground hover:text-foreground">
                    {selected.size === filtered.length && filtered.length > 0
                      ? <CheckSquare className="h-4 w-4 text-primary" />
                      : <Square className="h-4 w-4" />}
                  </button>
                </th>
                {['Name', 'Roll No', 'Department', 'Avg Score', 'Exams', 'Last Active', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(s => (
                <tr key={s.id} className={`hover:bg-slate-50/50 transition-colors ${selected.has(s.id) ? 'bg-blue-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(prev => { const n = new Set(prev); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })} aria-label={`Select ${s.name}`} className="text-muted-foreground hover:text-foreground">
                      {selected.has(s.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.rollNo}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.department}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${s.avgScore >= 75 ? 'text-emerald-600' : s.avgScore >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{s.avgScore}%</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.examsCompleted}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.lastActive}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" aria-label="View"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" aria-label="Edit"><Edit className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">No students match your filters.</div>
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-border bg-slate-50/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filtered.length} of {MOCK_STUDENTS.length} students{selected.size > 0 ? ` · ${selected.size} selected` : ''}</span>
        </div>
      </Card>
    </div>
  );
}

/* ─── Section: Faculty ──────────────────────────────────────── */
function FacultySection() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const { toast } = useToast();

  const filtered = useMemo(() => MOCK_FACULTY.filter(f =>
    (deptFilter === 'all' || f.department === deptFilter) &&
    (f.name.toLowerCase().includes(search.toLowerCase()) || f.email.toLowerCase().includes(search.toLowerCase()))
  ), [search, deptFilter]);

  return (
    <div className="space-y-5">
      <SectionHeader title="Faculty" description={`${MOCK_FACULTY.length} faculty members`}
        actions={<>
          <Button size="sm" variant="outline" onClick={() => { exportToCSV(filtered as unknown as Record<string, unknown>[], 'faculty.csv'); toast({ title: 'Exported', description: `${filtered.length} records downloaded.` }); }}><FileDown className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Faculty</Button>
        </>}
      />
      <div className="flex gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search faculty…" className="pl-8 h-9 text-sm" />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Faculty table">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                {['Name', 'Department', 'Email', 'Exams', 'Students', 'Joined', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">{f.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                      <span className="font-medium text-foreground whitespace-nowrap">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{f.department}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{f.email}</td>
                  <td className="px-4 py-3 text-foreground font-semibold">{f.examsCreated}</td>
                  <td className="px-4 py-3 text-foreground">{f.studentsCount}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(f.joinedDate)}</td>
                  <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                  <td className="px-4 py-3 flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─── Section: Departments ──────────────────────────────────── */
function DepartmentsSection() {
  return (
    <div className="space-y-5">
      <SectionHeader title="Departments" description="Manage academic departments and their resources"
        actions={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />New Department</Button>}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_DEPARTMENTS.map(d => (
          <Card key={d.id} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: d.color }}>{d.code}</div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-0.5">{d.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">Head: {d.head.split(' ').slice(-1)[0]}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[['Students', d.students], ['Faculty', d.faculty], ['Exams', d.exams]].map(([k, v]) => (
                  <div key={String(k)} className="rounded-lg bg-slate-50 py-1.5">
                    <div className="text-sm font-bold text-foreground">{v}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{k}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Section: Question Bank ────────────────────────────────── */
function QuestionBankSection() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: questions = [], isLoading } = useQuery<Question[]>({ queryKey: ['/api/admin/questions'] });

  const filtered = useMemo(() => questions.filter(q =>
    (typeFilter === 'all' || q.type === typeFilter) &&
    (q.text.toLowerCase().includes(search.toLowerCase()))
  ), [questions, search, typeFilter]);

  const typeColor: Record<string, string> = {
    multiple_choice: 'bg-blue-50 text-blue-700',
    short_answer: 'bg-violet-50 text-violet-700',
    true_false: 'bg-emerald-50 text-emerald-700',
    coding: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Question Bank" description={`${questions.length} questions across all exams`}
        actions={<>
          <Button size="sm" variant="outline" onClick={() => { exportToCSV(filtered.map(q => ({ text: q.text, type: q.type, points: q.points })), 'questions.csv'); toast({ title: 'Exported' }); }}><FileDown className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Question</Button>
        </>}
      />
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions…" className="pl-8 h-9 text-sm" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
            <SelectItem value="short_answer">Short Answer</SelectItem>
            <SelectItem value="true_false">True / False</SelectItem>
            <SelectItem value="coding">Coding</SelectItem>
          </SelectContent>
        </Select>
        {selected.size > 0 && <Button size="sm" variant="destructive"><Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete {selected.size}</Button>}
      </div>
      {isLoading ? (
        <div className="grid gap-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Question bank">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="w-10 px-4 py-3" />
                  {['Question', 'Type', 'Points', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((q, i) => (
                  <tr key={q.id ?? i} className={`hover:bg-slate-50/50 ${selected.has(q.id ?? i.toString()) ? 'bg-blue-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(prev => { const n = new Set(prev); const k = q.id ?? i.toString(); n.has(k) ? n.delete(k) : n.add(k); return n; })} aria-label="Select" className="text-muted-foreground">
                        {selected.has(q.id ?? i.toString()) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-md">
                      <p className="line-clamp-1">{q.text}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor[q.type] ?? 'bg-slate-100 text-slate-600'}`}>
                        {q.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{q.points}</td>
                    <td className="px-4 py-3 flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !isLoading && (
              <div className="py-12 text-center text-sm text-muted-foreground">No questions found.</div>
            )}
          </div>
          <div className="px-4 py-2.5 border-t bg-slate-50/50 text-xs text-muted-foreground">{filtered.length} of {questions.length} questions</div>
        </Card>
      )}
    </div>
  );
}

/* ─── Section: Subjects ─────────────────────────────────────── */
function SubjectsSection() {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => MOCK_SUBJECTS.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())), [search]);

  return (
    <div className="space-y-5">
      <SectionHeader title="Subjects" description="Course subjects and learning areas"
        actions={<Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Subject</Button>}
      />
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects…" className="pl-8 h-9 text-sm" />
      </div>
      <Card className="border-0 shadow-sm overflow-hidden">
        <table className="w-full text-sm" aria-label="Subjects table">
          <thead>
            <tr className="bg-slate-50 border-b border-border">
              {['Code', 'Subject', 'Department', 'Credits', 'Questions', 'Exams', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">{s.code}</td>
                <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.department}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.credits}</td>
                <td className="px-4 py-3 text-foreground">{s.questions}</td>
                <td className="px-4 py-3 text-foreground">{s.exams}</td>
                <td className="px-4 py-3 flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ─── Section: Exams ────────────────────────────────────────── */
function ExamsSection({ exams, examsLoading }: { exams: Exam[]; examsLoading: boolean }) {
  const [search, setSearch] = useState('');
  const [, nav] = useLocation();
  const { toast } = useToast();

  const filtered = useMemo(() => exams.filter(e => e.title.toLowerCase().includes(search.toLowerCase())), [exams, search]);

  return (
    <div className="space-y-5">
      <SectionHeader title="Exams" description={`${exams.length} exams in the system`}
        actions={<>
          <Button size="sm" variant="outline" onClick={() => { exportToCSV(filtered.map(e => ({ title: e.title, description: e.description ?? '', duration: e.duration, isActive: e.isActive })), 'exams.csv'); toast({ title: 'Exported' }); }}><FileDown className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm" onClick={() => nav('/exams')}><Plus className="h-4 w-4 mr-1.5" />Create Exam</Button>
        </>}
      />
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams…" className="pl-8 h-9 text-sm" />
      </div>
      {examsLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-40 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Exams table">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  {['Title', 'Duration', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(exam => (
                  <tr key={exam.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{exam.title}</p>
                        {exam.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{exam.description}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />{exam.duration} min
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={exam.isActive ? 'active' : 'inactive'} /></td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => nav('/exams')}>
                        <Edit className="h-3 w-3 mr-1" />Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No exams found.</div>}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─── Section: Analytics ────────────────────────────────────── */
function AnalyticsSection() {
  return (
    <div className="space-y-5">
      <SectionHeader title="Analytics" description="Deep performance insights across the institution" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Completion Rate" value="87%" icon={Target} color="bg-emerald-50 text-emerald-600" trend={4} />
        <StatCard label="Avg Attempt Time" value="38 min" icon={Clock} color="bg-blue-50 text-blue-600" />
        <StatCard label="Pass Rate" value="79%" icon={Award} color="bg-violet-50 text-violet-600" trend={2} />
        <StatCard label="Active This Week" value="142" icon={Zap} color="bg-amber-50 text-amber-600" trend={-3} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Monthly Average Score" description="Performance trend over 6 months">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyPerf} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[55, 85]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v}%`, 'Avg']} />
              <Line type="monotone" dataKey="avg" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Subject Performance" description="Average scores by subject area">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subjectPerf} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v}%`, 'Avg']} />
              <Bar dataKey="avg" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Student Competency Radar" description="Multi-dimensional performance analysis">
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData} margin={{ top: 4, right: 30, left: 30, bottom: 4 }}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="Score" dataKey="A" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v}%`]} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Score Distribution" description="Frequency of scores across all exams">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={scoreDistribution} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

/* ─── Section: Reports ──────────────────────────────────────── */
function ReportsSection() {
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState('2026-06-01');
  const [dateTo, setDateTo]     = useState('2026-07-14');

  const reports = [
    { id: 'student_perf', icon: Users, label: 'Student Performance Report', desc: 'Scores, completion rates, and trends per student.', color: 'bg-blue-50 text-blue-600' },
    { id: 'exam_summary', icon: FileText, label: 'Exam Summary Report', desc: 'Per-exam analytics: attempts, pass/fail, avg times.', color: 'bg-violet-50 text-violet-600' },
    { id: 'faculty_report', icon: GraduationCap, label: 'Faculty Activity Report', desc: 'Exams created, graded, and student outcomes per faculty.', color: 'bg-emerald-50 text-emerald-600' },
    { id: 'a11y_report', icon: Accessibility, label: 'Accessibility Usage Report', desc: 'Which accessibility features students rely on.', color: 'bg-amber-50 text-amber-600' },
    { id: 'dept_report', icon: Building2, label: 'Department Overview Report', desc: 'Performance and engagement across all departments.', color: 'bg-red-50 text-red-600' },
    { id: 'question_analysis', icon: Star, label: 'Question Difficulty Analysis', desc: 'Which questions are hardest; discrimination index.', color: 'bg-cyan-50 text-cyan-600' },
  ];

  const handleGenerate = (label: string) => {
    toast({ title: 'Generating report', description: `"${label}" is being prepared for download.` });
    setTimeout(() => {
      exportToCSV([{ report: label, generated: new Date().toISOString(), dateFrom, dateTo }], `${label.replace(/\s+/g, '_').toLowerCase()}.csv`);
      toast({ title: 'Report ready', description: `"${label}" downloaded.` });
    }, 800);
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Reports" description="Generate and export institutional reports" />

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-36">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">From</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="flex-1 min-w-36">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">To</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="flex-1 min-w-36">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Format</label>
            <Select defaultValue="csv">
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => {
          const Icon = r.icon;
          return (
            <Card key={r.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-5">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${r.color}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{r.label}</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{r.desc}</p>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleGenerate(r.label)}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />Generate
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs px-3">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Section: Institution Settings ────────────────────────── */
function InstitutionSettingsSection() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    institutionName: 'OPSIS University',
    timezone: 'UTC',
    language: 'en',
    maxAttempts: '3',
    defaultDuration: '60',
    autoGrade: true,
    emailNotifications: true,
    maintenanceMode: false,
    publicRegistration: true,
  });

  const save = () => toast({ title: 'Settings saved', description: 'Institution settings have been updated.' });

  return (
    <div className="space-y-5">
      <SectionHeader title="Institution Settings" description="Configure platform-wide policies and defaults"
        actions={<Button size="sm" onClick={save}>Save Changes</Button>}
      />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-sm font-semibold">General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Institution Name', key: 'institutionName', type: 'text' },
              { label: 'Timezone', key: 'timezone', type: 'text' },
              { label: 'Default Language', key: 'language', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
                <Input type={type} value={String(settings[key as keyof typeof settings])}
                  onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))} className="h-9 text-sm" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-sm font-semibold">Exam Policies</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Max Attempts per Exam', key: 'maxAttempts' },
              { label: 'Default Duration (minutes)', key: 'defaultDuration' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
                <Input type="number" value={String(settings[key as keyof typeof settings])}
                  onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))} className="h-9 text-sm" />
              </div>
            ))}

            {[
              { label: 'Auto-grade submissions', key: 'autoGrade' },
              { label: 'Email notifications', key: 'emailNotifications' },
              { label: 'Maintenance mode', key: 'maintenanceMode' },
              { label: 'Public registration', key: 'publicRegistration' },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm text-foreground">{label}</label>
                <Switch checked={Boolean(settings[key as keyof typeof settings])}
                  onCheckedChange={v => setSettings(p => ({ ...p, [key]: v }))} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Section: Accessibility Reports ───────────────────────── */
function AccessibilityReportsSection() {
  const total = MOCK_STUDENTS.length;
  return (
    <div className="space-y-5">
      <SectionHeader title="Accessibility Reports" description="Usage of accessibility features across the platform"
        actions={<Button size="sm" variant="outline" onClick={() => exportToCSV(a11yUsage as unknown as Record<string, unknown>[], 'accessibility_usage.csv')}><FileDown className="h-4 w-4 mr-1.5" />Export</Button>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="A11y Users" value={Math.round(total * 0.62)} sub={`${62}% of students`} icon={Accessibility} color="bg-blue-50 text-blue-600" />
        <StatCard label="TTS Sessions" value="1,204" sub="This month" icon={Globe} color="bg-violet-50 text-violet-600" />
        <StatCard label="Keyboard Only" value={Math.round(total * 0.28)} sub="No mouse usage" icon={Target} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Screen Reader" value={Math.round(total * 0.16)} sub="NVDA / JAWS / VO" icon={Eye} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Feature Usage" description="Number of users per accessibility feature">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={a11yUsage} layout="vertical" margin={{ top: 4, right: 20, left: 80, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="feature" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="users" fill="#2563EB" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Adoption Over Time" description="Cumulative accessibility feature adoption">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyPerf.map((m, i) => ({ ...m, users: 30 + i * 8 }))} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
              <defs>
                <linearGradient id="gradA11y" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="users" stroke="#2563EB" strokeWidth={2} fill="url(#gradA11y)" name="Users" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-sm font-semibold">Students with Active Accessibility Settings</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {MOCK_STUDENTS.filter((_, i) => i < 8).map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    {s.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.rollNo} · {s.department}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(['TTS', 'HC', 'LT'] as const).filter((_, j) => j <= (parseInt(s.id.slice(1)) % 3)).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Section: Announcements ────────────────────────────────── */
function AnnouncementsSection() {
  const [list, setList] = useState(MOCK_ANNOUNCEMENTS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ title: string; body: string; target: string; priority: 'low' | 'medium' | 'high' }>({ title: '', body: '', target: 'all', priority: 'medium' });
  const { toast } = useToast();

  const submit = () => {
    if (!form.title || !form.body) return;
    setList(p => [{ id: `a${p.length + 1}`, ...form, createdAt: new Date().toISOString(), isActive: true }, ...p]);
    setForm({ title: '', body: '', target: 'all', priority: 'medium' });
    setShowForm(false);
    toast({ title: 'Announcement published' });
  };

  const priorityColor: Record<string, string> = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Announcements" description="Broadcast messages to students, faculty, or everyone"
        actions={<Button size="sm" onClick={() => setShowForm(s => !s)}><Plus className="h-4 w-4 mr-1.5" />New Announcement</Button>}
      />

      {showForm && (
        <Card className="border-0 shadow-sm border-l-4 border-l-primary">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">New Announcement</h3>
            <Input placeholder="Title*" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="h-9 text-sm" />
            <Textarea placeholder="Message body*" value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={3} className="text-sm" />
            <div className="flex gap-3">
              <Select value={form.target} onValueChange={v => setForm(p => ({ ...p, target: v }))}>
                <SelectTrigger className="h-9 text-sm w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="students">Students only</SelectItem>
                  <SelectItem value="faculty">Faculty only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v as 'low' | 'medium' | 'high' }))}>
                <SelectTrigger className="h-9 text-sm w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High priority</SelectItem>
                  <SelectItem value="medium">Medium priority</SelectItem>
                  <SelectItem value="low">Low priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={submit}><Megaphone className="h-3.5 w-3.5 mr-1.5" />Publish</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {list.map(a => (
          <Card key={a.id} className={`border-0 shadow-sm ${!a.isActive ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{a.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColor[a.priority]}`}>{a.priority}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{a.target}</span>
                    {!a.isActive && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs">Archived</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{a.body}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(a.createdAt)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setList(p => p.map(x => x.id === a.id ? { ...x, isActive: !x.isActive } : x))}>
                    {a.isActive ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => setList(p => p.filter(x => x.id !== a.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Section: Notifications ────────────────────────────────── */
function NotificationsSection() {
  const [list, setList] = useState(MOCK_NOTIFICATIONS);
  const unread = list.filter(n => !n.read).length;

  const typeIcon: Record<string, { icon: React.ElementType; color: string }> = {
    success: { icon: Check, color: 'text-emerald-600 bg-emerald-50' },
    warning: { icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
    error:   { icon: X, color: 'text-red-600 bg-red-50' },
    info:    { icon: Info, color: 'text-blue-600 bg-blue-50' },
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Notifications" description={`${unread} unread`}
        actions={<Button size="sm" variant="outline" onClick={() => setList(p => p.map(n => ({ ...n, read: true })))}>
          <Check className="h-4 w-4 mr-1.5" />Mark all read
        </Button>}
      />
      <div className="space-y-2">
        {list.map(n => {
          const { icon: Icon, color } = typeIcon[n.type] ?? typeIcon.info;
          return (
            <Card key={n.id} className={`border-0 shadow-sm cursor-pointer transition-colors ${!n.read ? 'border-l-2 border-l-primary' : ''}`} onClick={() => setList(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>{n.title}</p>
                    {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" aria-label="Unread" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{fmtDate(n.createdAt)}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={e => { e.stopPropagation(); setList(p => p.filter(x => x.id !== n.id)); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Section: Role Management ──────────────────────────────── */
function RoleManagementSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const { data: users = [] } = useQuery<User[]>({ queryKey: ['/api/admin/users'] });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiRequest('PUT', `/api/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: 'Role updated' });
    },
    onError: () => toast({ title: 'Failed to update role', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: 'User removed', variant: 'destructive' });
    },
  });

  const filtered = useMemo(() => users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  ), [users, search]);

  const roleColor: Record<string, string> = {
    admin: 'text-red-600 bg-red-50 border-red-200',
    instructor: 'text-violet-700 bg-violet-50 border-violet-200',
    student: 'text-blue-600 bg-blue-50 border-blue-200',
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Role Management" description="Assign and manage user roles across the platform" />

      <div className="grid grid-cols-3 gap-4">
        {[
          { role: 'admin', label: 'Administrators', color: 'text-red-600 bg-red-50', count: users.filter(u => u.role === 'admin').length },
          { role: 'instructor', label: 'Instructors', color: 'text-violet-600 bg-violet-50', count: users.filter(u => u.role === 'instructor').length },
          { role: 'student', label: 'Students', color: 'text-blue-600 bg-blue-50', count: users.filter(u => u.role === 'student').length },
        ].map(({ role, label, color, count }) => (
          <Card key={role} className="border-0 shadow-sm text-center py-4">
            <div className={`text-2xl font-bold mb-1 ${color.split(' ')[0]}`}>{count}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" className="pl-8 h-9 text-sm" />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="User roles table">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                {['User', 'Current Role', 'Change Role', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-foreground">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${roleColor[u.role] ?? 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={u.role} onValueChange={role => roleMutation.mutate({ id: u.id, role })}>
                      <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => deleteMutation.mutate(u.id)} aria-label={`Remove ${u.username}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No users found.</div>}
        </div>
        <div className="px-4 py-2.5 border-t bg-slate-50/50 text-xs text-muted-foreground">{filtered.length} users</div>
      </Card>
    </div>
  );
}

/* ─── Sidebar nav config ────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'dashboard',        label: 'Dashboard',             icon: LayoutDashboard, group: 'core' },
  { id: 'students',         label: 'Students',              icon: Users,            group: 'people' },
  { id: 'faculty',          label: 'Faculty',               icon: GraduationCap,    group: 'people' },
  { id: 'departments',      label: 'Departments',           icon: Building2,        group: 'people' },
  { id: 'question_bank',    label: 'Question Bank',         icon: BookOpen,         group: 'academic' },
  { id: 'subjects',         label: 'Subjects',              icon: Library,          group: 'academic' },
  { id: 'exams',            label: 'Exams',                 icon: FileText,         group: 'academic' },
  { id: 'analytics',        label: 'Analytics',             icon: BarChart3,        group: 'insights', href: '/analytics' },
  { id: 'reports',          label: 'Reports',               icon: Download,         group: 'insights' },
  { id: 'a11y_reports',     label: 'Accessibility',         icon: Accessibility,    group: 'insights' },
  { id: 'announcements',    label: 'Announcements',         icon: Megaphone,        group: 'comms' },
  { id: 'notifications',    label: 'Notifications',         icon: Bell,             group: 'comms' },
  { id: 'roles',            label: 'Role Management',       icon: ShieldCheck,      group: 'system' },
  { id: 'settings',         label: 'Institution Settings',  icon: Settings,         group: 'system' },
];

const GROUP_LABELS: Record<string, string> = {
  core:     'Overview',
  people:   'People',
  academic: 'Academic',
  insights: 'Insights',
  comms:    'Communications',
  system:   'System',
};

/* ─── Main AdminPortal ──────────────────────────────────────── */
export default function AdminPortal({ currentUser, onLogout }: AdminPortalProps) {
  const [active, setActive] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [, nav] = useLocation();
  const { toast } = useToast();

  const { data: exams = [], isLoading: examsLoading } = useQuery<Exam[]>({ queryKey: ['/api/exams'] });

  const notifCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  const activeItem = NAV_ITEMS.find(n => n.id === active);

  /* Group nav items */
  const groups = Object.keys(GROUP_LABELS);

  const renderSection = () => {
    switch (active) {
      case 'dashboard':     return <DashboardSection exams={exams} />;
      case 'students':      return <StudentsSection />;
      case 'faculty':       return <FacultySection />;
      case 'departments':   return <DepartmentsSection />;
      case 'question_bank': return <QuestionBankSection />;
      case 'subjects':      return <SubjectsSection />;
      case 'exams':         return <ExamsSection exams={exams} examsLoading={examsLoading} />;
      case 'analytics':     return <AnalyticsSection />;
      case 'reports':       return <ReportsSection />;
      case 'a11y_reports':  return <AccessibilityReportsSection />;
      case 'announcements': return <AnnouncementsSection />;
      case 'notifications': return <NotificationsSection />;
      case 'roles':         return <RoleManagementSection />;
      case 'settings':      return <InstitutionSettingsSection />;
      default:              return null;
    }
  };

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col bg-slate-900 text-slate-100 shrink-0 transition-all duration-200 ${collapsed ? 'w-[68px]' : 'w-[232px]'}`}
        aria-label="Admin portal navigation"
      >
        {/* Collapse toggle */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <LayoutGrid className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-sm font-semibold text-white tracking-tight">Admin Portal</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className={`h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${collapsed ? 'mx-auto' : ''}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5" aria-label="Sections">
          {groups.map(group => {
            const items = NAV_ITEMS.filter(n => n.group === group);
            return (
              <div key={group}>
                {!collapsed && (
                  <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    {GROUP_LABELS[group]}
                  </p>
                )}
                {items.map(item => {
                  const Icon = item.icon;
                  const isActive = active === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { if ((item as any).href) { nav((item as any).href); } else { setActive(item.id); } }}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg text-sm font-medium transition-all duration-100 relative group
                        ${isActive
                          ? 'bg-primary text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        } ${collapsed ? 'justify-center' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                      style={{ width: collapsed ? 'calc(100% - 8px)' : 'calc(100% - 8px)' }}
                    >
                      <div className="relative shrink-0">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {item.id === 'notifications' && notifCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">{notifCount}</span>
                        )}
                      </div>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-slate-800 p-3">
          {collapsed ? (
            <button onClick={onLogout} className="w-full flex justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {currentUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{currentUser.username}</p>
                <p className="text-[10px] text-slate-400 capitalize">{currentUser.role}</p>
              </div>
              <button onClick={onLogout} className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0" aria-label="Logout">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main id="admin-main" className="flex-1 overflow-y-auto bg-slate-50">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-border px-6 py-3 flex items-center gap-4">
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">{activeItem?.label}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActive('notifications')}
              className="relative h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={`Notifications${notifCount > 0 ? `, ${notifCount} unread` : ''}`}
            >
              <Bell className="h-4 w-4" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" aria-hidden="true" />
              )}
            </button>
            <button
              onClick={() => setActive('settings')}
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Institution settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Section content */}
        <div className="p-6">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
