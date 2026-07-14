import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Scatter, ScatterChart, ZAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  Users, FileText, TrendingUp, TrendingDown, Accessibility, Mic,
  Clock, Download, RefreshCw, Calendar, ChevronDown, ArrowLeft,
  BarChart3, Activity, Target, Zap, Award, BookOpen, Globe,
  Filter, Share2, Eye, CheckCircle2, AlertCircle, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Exam } from '@shared/schema';

/* ─── Types ───────────────────────────────────────────────── */
interface AnalyticsDashboardProps {
  currentUser: { id: string; username: string; role: string };
}

/* ─── Palette ─────────────────────────────────────────────── */
const C = {
  blue:   '#2563EB',
  violet: '#7C3AED',
  emerald:'#059669',
  amber:  '#D97706',
  red:    '#DC2626',
  cyan:   '#0891B2',
  pink:   '#DB2777',
  lime:   '#65A30D',
};
const PALETTE = Object.values(C);

/* ─── Rich time-series data ───────────────────────────────── */
const DAILY_DATA = Array.from({ length: 30 }, (_, i) => {
  const d = new Date('2026-06-15');
  d.setDate(d.getDate() + i);
  const day = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  const base = 40 + Math.sin(i * 0.4) * 15 + Math.random() * 10;
  return {
    date: day,
    students: Math.round(base + 5),
    exams: Math.round(base * 0.35 + Math.random() * 6),
    avgScore: Math.round(68 + Math.sin(i * 0.3) * 8 + Math.random() * 6),
    voiceAccuracy: Math.round(82 + Math.sin(i * 0.5) * 5 + Math.random() * 4),
    a11yUsers: Math.round(base * 0.45 + Math.random() * 8),
    completionMin: Math.round(34 + Math.sin(i * 0.4) * 6 + Math.random() * 5),
  };
});

const WEEKLY_DATA = [
  { week: 'Wk 1', students: 210, exams: 74, avgScore: 69, voiceAccuracy: 83, a11yUsers: 95,  completionMin: 37 },
  { week: 'Wk 2', students: 245, exams: 88, avgScore: 71, voiceAccuracy: 85, a11yUsers: 108, completionMin: 36 },
  { week: 'Wk 3', students: 198, exams: 65, avgScore: 74, voiceAccuracy: 84, a11yUsers: 92,  completionMin: 34 },
  { week: 'Wk 4', students: 267, exams: 97, avgScore: 76, voiceAccuracy: 87, a11yUsers: 124, completionMin: 33 },
  { week: 'Wk 5', students: 290, exams: 104,avgScore: 75, voiceAccuracy: 88, a11yUsers: 131, completionMin: 35 },
  { week: 'Wk 6', students: 312, exams: 118,avgScore: 78, voiceAccuracy: 89, a11yUsers: 145, completionMin: 32 },
];

const MONTHLY_DATA = [
  { month: 'Jan', students: 820,  exams: 280, avgScore: 66, voiceAccuracy: 79, a11yUsers: 360, completionMin: 40 },
  { month: 'Feb', students: 940,  exams: 315, avgScore: 68, voiceAccuracy: 81, a11yUsers: 410, completionMin: 38 },
  { month: 'Mar', students: 1080, exams: 374, avgScore: 70, voiceAccuracy: 83, a11yUsers: 485, completionMin: 37 },
  { month: 'Apr', students: 1150, exams: 398, avgScore: 72, voiceAccuracy: 84, a11yUsers: 520, completionMin: 36 },
  { month: 'May', students: 1240, exams: 426, avgScore: 74, voiceAccuracy: 86, a11yUsers: 562, completionMin: 35 },
  { month: 'Jun', students: 1380, exams: 487, avgScore: 76, voiceAccuracy: 87, a11yUsers: 618, completionMin: 34 },
  { month: 'Jul', students: 1520, exams: 534, avgScore: 77, voiceAccuracy: 89, a11yUsers: 674, completionMin: 33 },
];

const INSTITUTION_PERF = [
  { dept: 'Comp Sci',   avgScore: 82, completionRate: 91, studentsEnrolled: 340 },
  { dept: 'Mathematics',avgScore: 75, completionRate: 87, studentsEnrolled: 280 },
  { dept: 'Physics',    avgScore: 68, completionRate: 83, studentsEnrolled: 195 },
  { dept: 'Engineering',avgScore: 79, completionRate: 89, studentsEnrolled: 240 },
  { dept: 'Biology',    avgScore: 71, completionRate: 85, studentsEnrolled: 175 },
  { dept: 'Chemistry',  avgScore: 66, completionRate: 80, studentsEnrolled: 160 },
  { dept: 'Economics',  avgScore: 74, completionRate: 88, studentsEnrolled: 210 },
  { dept: 'Literature', avgScore: 80, completionRate: 92, studentsEnrolled: 145 },
];

const DIFFICULT_QUESTIONS = [
  { rank: 1, text: 'Implement a red-black tree with insert & delete', subject: 'CS301', successRate: 18, attempts: 312, type: 'coding' },
  { rank: 2, text: 'Derive the Schrödinger equation for a harmonic oscillator', subject: 'PHY401', successRate: 22, attempts: 178, type: 'short_answer' },
  { rank: 3, text: 'Prove the Cauchy-Schwarz inequality using inner product spaces', subject: 'MTH301', successRate: 27, attempts: 245, type: 'short_answer' },
  { rank: 4, text: 'Synthesise aspirin from salicylic acid — outline all steps', subject: 'CHE301', successRate: 31, attempts: 198, type: 'short_answer' },
  { rank: 5, text: 'Design a distributed hash table for 10⁶ keys', subject: 'CS401', successRate: 33, attempts: 267, type: 'coding' },
  { rank: 6, text: 'Explain Nash equilibrium with 3 real-world examples', subject: 'ECO201', successRate: 38, attempts: 221, type: 'short_answer' },
  { rank: 7, text: 'Calculate torque in a coupled pendulum system', subject: 'PHY301', successRate: 41, attempts: 195, type: 'short_answer' },
  { rank: 8, text: 'Write a lock-free concurrent queue in Java', subject: 'CS301', successRate: 44, attempts: 289, type: 'coding' },
];

const A11Y_FEATURES = [
  { feature: 'Large Text', users: 341, pct: 88, trend: +12 },
  { feature: 'High Contrast', users: 298, pct: 77, trend: +8 },
  { feature: 'Text-to-Speech', users: 264, pct: 68, trend: +15 },
  { feature: 'Screen Reader', users: 187, pct: 48, trend: +5 },
  { feature: 'Keyboard Only', users: 176, pct: 45, trend: +9 },
  { feature: 'Reduced Motion', users: 154, pct: 40, trend: +3 },
  { feature: 'Voice Navigation', users: 112, pct: 29, trend: +22 },
  { feature: 'Reading Mask', users: 89,  pct: 23, trend: +7 },
  { feature: 'Captions', users: 78,   pct: 20, trend: +4 },
  { feature: 'Word Spacing', users: 62, pct: 16, trend: +11 },
];

const VOICE_COMMAND_DATA = [
  { cmd: 'Next Question',    uses: 1420, accuracy: 96 },
  { cmd: 'Repeat Question',  uses: 980,  accuracy: 94 },
  { cmd: 'Save Answer',      uses: 876,  accuracy: 97 },
  { cmd: 'Previous Question',uses: 654,  accuracy: 92 },
  { cmd: 'Submit Answer',    uses: 548,  accuracy: 95 },
  { cmd: 'Help',             uses: 321,  accuracy: 99 },
  { cmd: 'Open Accessibility',uses: 287, accuracy: 88 },
  { cmd: 'Read Answer',      uses: 245,  accuracy: 91 },
];

const SCORE_DIST = [
  { range: '0–49', count: 12, fill: '#DC2626' },
  { range: '50–59', count: 18, fill: '#D97706' },
  { range: '60–69', count: 27, fill: '#D97706' },
  { range: '70–79', count: 45, fill: '#059669' },
  { range: '80–89', count: 38, fill: '#059669' },
  { range: '90–100', count: 22, fill: '#2563EB' },
];

const HOURLY_HEATMAP = [
  { hour: '6 AM', Mon: 12, Tue: 8,  Wed: 15, Thu: 10, Fri: 18, Sat: 6,  Sun: 3  },
  { hour: '8 AM', Mon: 45, Tue: 52, Wed: 48, Thu: 55, Fri: 60, Sat: 20, Sun: 12 },
  { hour: '10AM', Mon: 78, Tue: 82, Wed: 75, Thu: 88, Fri: 72, Sat: 35, Sun: 28 },
  { hour: '12PM', Mon: 62, Tue: 68, Wed: 70, Thu: 65, Fri: 58, Sat: 40, Sun: 35 },
  { hour: '2 PM', Mon: 85, Tue: 90, Wed: 88, Thu: 92, Fri: 80, Sat: 45, Sun: 30 },
  { hour: '4 PM', Mon: 72, Tue: 75, Wed: 80, Thu: 78, Fri: 95, Sat: 50, Sun: 25 },
  { hour: '6 PM', Mon: 55, Tue: 60, Wed: 58, Thu: 62, Fri: 70, Sat: 55, Sun: 42 },
  { hour: '8 PM', Mon: 38, Tue: 42, Wed: 40, Thu: 44, Fri: 35, Sat: 38, Sun: 45 },
  { hour: '10PM', Mon: 18, Tue: 20, Wed: 22, Thu: 18, Fri: 15, Sat: 22, Sun: 28 },
];

const RADAR_DATA = [
  { metric: 'Completion', value: 87 },
  { metric: 'Accuracy',   value: 74 },
  { metric: 'Speed',      value: 61 },
  { metric: 'Engagement', value: 79 },
  { metric: 'Improvement',value: 66 },
  { metric: 'A11y Adopt', value: 91 },
];

/* ─── Utilities ───────────────────────────────────────────── */
function exportCSV(rows: Record<string, unknown>[], name: string) {
  if (!rows.length) return;
  const h = Object.keys(rows[0]);
  const csv = [h.join(','), ...rows.map(r => h.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click(); URL.revokeObjectURL(url);
}

function fmtNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/* ─── Custom tooltip ──────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 min-w-[140px]">
      <p className="text-xs font-semibold text-slate-600 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-500">{p.name}</span>
          </span>
          <span className="font-semibold text-slate-800">{p.value}{p.name.includes('Score') || p.name.includes('Accuracy') ? '%' : p.name.includes('Time') ? 'm' : ''}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Sparkline (tiny inline chart) ──────────────────────── */
function Sparkline({ data, color, positive = true }: { data: number[]; color: string; positive?: boolean }) {
  const pts = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={pts} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── KPI Card ────────────────────────────────────────────── */
function KpiCard({
  label, value, unit = '', sub, icon: Icon, color, bgColor,
  trend, sparkData, description,
}: {
  label: string; value: string | number; unit?: string; sub?: string;
  icon: React.ElementType; color: string; bgColor: string;
  trend?: number; sparkData?: number[]; description?: string;
}) {
  const positive = trend === undefined || trend >= 0;
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group overflow-hidden relative">
      <div className="absolute top-0 left-0 h-1 w-full" style={{ background: color }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900 tabular-nums leading-none">{value}</span>
              {unit && <span className="text-sm font-semibold text-slate-400">{unit}</span>}
            </div>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: bgColor }}>
            <Icon className="h-5 w-5" style={{ color }} aria-hidden="true" />
          </div>
        </div>

        {sparkData && <div className="mb-2"><Sparkline data={sparkData} color={color} positive={positive} /></div>}

        {trend !== undefined && (
          <div className="flex items-center gap-1.5 text-xs">
            {trend >= 0
              ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
            <span className={`font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-slate-400">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Section title bar ───────────────────────────────────── */
function SectionTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h2>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── ChartCard ───────────────────────────────────────────── */
function CC({ title, description, children, action, className = '' }: {
  title: string; description?: string; children: React.ReactNode; action?: React.ReactNode; className?: string;
}) {
  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-800">{title}</CardTitle>
            {description && <CardDescription className="text-xs mt-0.5">{description}</CardDescription>}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-5">{children}</CardContent>
    </Card>
  );
}

/* ─── Progress bar row ────────────────────────────────────── */
function PBar({ label, value, max = 100, color = C.blue, suffix = '%', sub }: {
  label: string; value: number; max?: number; color?: string; suffix?: string; sub?: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3 py-1.5 group">
      <div className="w-32 shrink-0 truncate text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{label}</div>
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="w-12 text-right text-xs font-bold tabular-nums" style={{ color }}>{value}{suffix}</div>
      {sub && <div className="w-16 text-right text-xs text-slate-400 shrink-0">{sub}</div>}
    </div>
  );
}

/* ─── MAIN COMPONENT ──────────────────────────────────────── */
export default function AnalyticsDashboard({ currentUser }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [datePreset, setDatePreset] = useState('last_6m');
  const { toast } = useToast();

  const { data: exams = [] } = useQuery<Exam[]>({ queryKey: ['/api/exams'] });
  const { data: adminStats } = useQuery<{ totalUsers: number; students: number; faculty: number; totalExams: number }>({
    queryKey: ['/api/admin/stats'],
  });

  /* pick time-series based on selector */
  const tsData = timeRange === 'daily' ? DAILY_DATA.slice(-14)
    : timeRange === 'weekly' ? WEEKLY_DATA
    : MONTHLY_DATA;

  const tsKey = timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'week' : 'month';

  /* latest values for KPIs */
  const latest = tsData[tsData.length - 1];
  const prev   = tsData[tsData.length - 2];
  const delta  = (key: keyof typeof latest) => prev ? Math.round(((Number(latest[key]) - Number(prev[key])) / Number(prev[key])) * 100) : 0;

  /* spark data for KPIs */
  const spark = (key: keyof typeof latest) => tsData.slice(-10).map(d => Number(d[key]));

  /* export helpers */
  const handleExportMain = () => {
    exportCSV(tsData as unknown as Record<string, unknown>[], `analytics_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: 'Report downloaded', description: `${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} analytics exported as CSV.` });
  };

  const handleExportSection = (rows: Record<string, unknown>[], name: string) => {
    exportCSV(rows, `${name}_${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: 'Downloaded', description: `${name}.csv saved.` });
  };

  const handlePrint = () => {
    window.print();
    toast({ title: 'Print / Save PDF', description: 'Use your browser\'s "Save as PDF" option.' });
  };

  /* ── render ── */
  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO HEADER ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white print:bg-slate-900">
        <div className="max-w-[1600px] mx-auto px-6 pt-6 pb-8">

          {/* breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
            <Link href="/admin" className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />Admin Portal
            </Link>
            <span>/</span>
            <span className="text-white font-medium">Analytics Dashboard</span>
          </div>

          {/* top row */}
          <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">Analytics Dashboard</h1>
              </div>
              <p className="text-sm text-slate-400">Institution-wide performance intelligence · OPSIS University</p>
            </div>

            {/* controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* time range toggle */}
              <div className="flex bg-white/10 rounded-lg p-0.5 gap-0.5">
                {(['daily', 'weekly', 'monthly'] as const).map(r => (
                  <button key={r} onClick={() => setTimeRange(r)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize
                      ${timeRange === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'}`}>
                    {r}
                  </button>
                ))}
              </div>

              <Select value={datePreset} onValueChange={setDatePreset}>
                <SelectTrigger className="h-8 w-36 bg-white/10 border-white/20 text-white text-xs">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7d">Last 7 days</SelectItem>
                  <SelectItem value="last_30d">Last 30 days</SelectItem>
                  <SelectItem value="last_3m">Last 3 months</SelectItem>
                  <SelectItem value="last_6m">Last 6 months</SelectItem>
                  <SelectItem value="ytd">Year to date</SelectItem>
                </SelectContent>
              </Select>

              <Button size="sm" variant="ghost" className="h-8 text-slate-300 hover:text-white hover:bg-white/10 gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>

              <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold"
                onClick={handleExportMain}>
                <Download className="h-3.5 w-3.5" />Export CSV
              </Button>
              <Button size="sm" variant="outline" className="h-8 border-white/20 text-slate-200 hover:bg-white/10 gap-1.5 text-xs"
                onClick={handlePrint}>
                <Share2 className="h-3.5 w-3.5" />Save PDF
              </Button>
            </div>
          </div>

          {/* ── KPI CARDS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                label: 'Students', value: fmtNum(adminStats?.students ?? 1520),
                icon: Users, color: C.blue, bgColor: 'rgba(37,99,235,0.15)',
                trend: delta('students'), sparkData: spark('students'), sub: 'Registered', unit: '',
              },
              {
                label: 'Exams', value: fmtNum(adminStats?.totalExams ?? 534),
                icon: FileText, color: C.violet, bgColor: 'rgba(124,58,237,0.15)',
                trend: delta('exams'), sparkData: spark('exams'), sub: 'Conducted', unit: '',
              },
              {
                label: 'Avg Score', value: latest.avgScore, unit: '%',
                icon: Award, color: C.emerald, bgColor: 'rgba(5,150,105,0.15)',
                trend: delta('avgScore'), sparkData: spark('avgScore'), sub: 'All subjects',
              },
              {
                label: 'A11y Usage', value: latest.a11yUsers, unit: '%',
                icon: Accessibility, color: C.amber, bgColor: 'rgba(217,119,6,0.15)',
                trend: delta('a11yUsers'), sparkData: spark('a11yUsers'), sub: 'Of students',
              },
              {
                label: 'Voice Accuracy', value: latest.voiceAccuracy, unit: '%',
                icon: Mic, color: C.cyan, bgColor: 'rgba(8,145,178,0.15)',
                trend: delta('voiceAccuracy'), sparkData: spark('voiceAccuracy'), sub: 'Recognition',
              },
              {
                label: 'Avg Completion', value: latest.completionMin, unit: 'min',
                icon: Clock, color: C.pink, bgColor: 'rgba(219,39,119,0.15)',
                trend: delta('completionMin') * -1, sparkData: spark('completionMin'), sub: 'Per exam',
              },
            ].map(kpi => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-10">

        {/* ═══ SECTION 1 — USAGE TRENDS ═══ */}
        <section aria-label="Usage trends">
          <SectionTitle
            title={`${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Usage`}
            description="Active students, exams conducted, and accessibility user trends"
            action={
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
                onClick={() => handleExportSection(tsData as unknown as Record<string, unknown>[], `${timeRange}_usage`)}>
                <Download className="h-3 w-3" />CSV
              </Button>
            }
          />
          <div className="grid lg:grid-cols-3 gap-4">
            {/* main area chart */}
            <div className="lg:col-span-2">
              <CC title="Student & Exam Activity" description="Volume over selected period">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={tsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      {[['stu', C.blue], ['exam', C.violet], ['a11y', C.emerald]].map(([id, c]) => (
                        <linearGradient key={id} id={`g_${id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={c} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={c} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey={tsKey} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="students" stroke={C.blue} fill={`url(#g_stu)`} strokeWidth={2} name="Students" />
                    <Area type="monotone" dataKey="exams" stroke={C.violet} fill={`url(#g_exam)`} strokeWidth={2} name="Exams" />
                    <Area type="monotone" dataKey="a11yUsers" stroke={C.emerald} fill={`url(#g_a11y)`} strokeWidth={2} name="A11y Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </CC>
            </div>

            {/* score vs voice */}
            <CC title="Score & Voice Accuracy" description="Quality metrics trend">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={tsData} margin={{ top: 4, right: 4, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey={tsKey} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[55, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={75} stroke="#e2e8f0" strokeDasharray="4 2" label={{ value: 'Target', fontSize: 9, fill: '#94a3b8' }} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="avgScore" stroke={C.emerald} strokeWidth={2.5} dot={false} name="Avg Score %" />
                  <Line type="monotone" dataKey="voiceAccuracy" stroke={C.cyan} strokeWidth={2.5} dot={false} name="Voice Accuracy %" />
                </LineChart>
              </ResponsiveContainer>
            </CC>
          </div>
        </section>

        {/* ═══ SECTION 2 — COMPLETION & SCORE DIST ═══ */}
        <section aria-label="Completion and score distribution">
          <SectionTitle title="Performance Distribution" description="How students score and how long they take" />
          <div className="grid lg:grid-cols-3 gap-4">
            <CC title="Completion Time Trend" description="Average minutes per exam">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={tsData} margin={{ top: 4, right: 4, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g_time" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.pink} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={C.pink} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey={tsKey} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[25, 50]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="completionMin" stroke={C.pink} fill="url(#g_time)" strokeWidth={2} name="Completion Time (min)" />
                </AreaChart>
              </ResponsiveContainer>
            </CC>

            <CC title="Score Distribution" description="Student score frequency across all exams" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={SCORE_DIST} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                    {SCORE_DIST.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CC>
          </div>
        </section>

        {/* ═══ SECTION 3 — INSTITUTION PERFORMANCE ═══ */}
        <section aria-label="Institution performance">
          <SectionTitle
            title="Institution Performance"
            description="Department-level average scores, completion rates, and enrollment"
            action={
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
                onClick={() => handleExportSection(INSTITUTION_PERF as unknown as Record<string, unknown>[], 'institution_performance')}>
                <Download className="h-3 w-3" />CSV
              </Button>
            }
          />
          <div className="grid lg:grid-cols-3 gap-4">
            <CC title="Avg Score by Department" description="Academic performance comparison" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={INSTITUTION_PERF} margin={{ top: 4, right: 20, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="dept" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                  <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 400]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="avgScore" fill={C.blue} radius={[4, 4, 0, 0]} name="Avg Score %" opacity={0.85} />
                  <Bar yAxisId="left" dataKey="completionRate" fill={C.emerald} radius={[4, 4, 0, 0]} name="Completion %" opacity={0.75} />
                  <Line yAxisId="right" type="monotone" dataKey="studentsEnrolled" stroke={C.amber} strokeWidth={2} dot={{ r: 3, fill: C.amber }} name="Enrolled" />
                </ComposedChart>
              </ResponsiveContainer>
            </CC>

            <CC title="Competency Radar" description="Multi-dimensional student performance">
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={RADAR_DATA} margin={{ top: 8, right: 30, bottom: 8, left: 30 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar name="Score" dataKey="value" stroke={C.blue} fill={C.blue} fillOpacity={0.18} strokeWidth={2} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any) => [`${v}%`]} />
                </RadarChart>
              </ResponsiveContainer>
            </CC>
          </div>

          {/* department progress bars */}
          <Card className="border-0 shadow-sm mt-4">
            <CardContent className="p-5">
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-0.5">
                {INSTITUTION_PERF.map((d, i) => (
                  <PBar
                    key={d.dept}
                    label={d.dept}
                    value={d.avgScore}
                    max={100}
                    color={PALETTE[i % PALETTE.length]}
                    suffix="%"
                    sub={`${d.studentsEnrolled} enrolled`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══ SECTION 4 — MOST DIFFICULT QUESTIONS ═══ */}
        <section aria-label="Most difficult questions">
          <SectionTitle
            title="Most Difficult Questions"
            description="Questions with lowest success rates — ranked by difficulty"
            action={
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
                onClick={() => handleExportSection(DIFFICULT_QUESTIONS as unknown as Record<string, unknown>[], 'difficult_questions')}>
                <Download className="h-3 w-3" />CSV
              </Button>
            }
          />
          <div className="grid lg:grid-cols-2 gap-4">
            <CC title="Difficulty Rankings" description="Lower success rate = harder">
              <div className="space-y-3">
                {DIFFICULT_QUESTIONS.map(q => (
                  <div key={q.rank} className="flex items-start gap-3 group">
                    <span className="text-xs font-black text-slate-300 w-5 text-right shrink-0 mt-0.5">#{q.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500 font-mono">{q.subject}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${q.type === 'coding' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {q.type === 'coding' ? 'Code' : 'Written'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-1 mb-1.5">{q.text}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                          <div className="h-full rounded-full" style={{
                            width: `${q.successRate}%`,
                            background: q.successRate < 30 ? C.red : q.successRate < 50 ? C.amber : C.emerald,
                          }} />
                        </div>
                        <span className="text-xs font-bold tabular-nums" style={{
                          color: q.successRate < 30 ? C.red : q.successRate < 50 ? C.amber : C.emerald,
                        }}>{q.successRate}%</span>
                        <span className="text-[10px] text-slate-400">{q.attempts} attempts</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CC>

            <CC title="Success Rate Distribution" description="Visualised by question">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={DIFFICULT_QUESTIONS.map(q => ({ name: `Q${q.rank} – ${q.subject}`, rate: q.successRate, attempts: q.attempts }))}
                  layout="vertical"
                  margin={{ top: 4, right: 40, left: 90, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any) => [`${v}%`, 'Success Rate']} />
                  <Bar dataKey="rate" name="Success Rate" radius={[0, 6, 6, 0]}>
                    {DIFFICULT_QUESTIONS.map((q, i) => (
                      <Cell key={i} fill={q.successRate < 30 ? C.red : q.successRate < 45 ? C.amber : C.emerald} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CC>
          </div>
        </section>

        {/* ═══ SECTION 5 — ACCESSIBILITY ═══ */}
        <section aria-label="Accessibility analytics">
          <SectionTitle
            title="Most Used Accessibility Features"
            description="Adoption rates across the platform"
            action={
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
                onClick={() => handleExportSection(A11Y_FEATURES as unknown as Record<string, unknown>[], 'accessibility_features')}>
                <Download className="h-3 w-3" />CSV
              </Button>
            }
          />
          <div className="grid lg:grid-cols-2 gap-4">
            <CC title="Feature Adoption" description="% of students using each feature">
              <div className="space-y-1.5">
                {A11Y_FEATURES.map(f => (
                  <PBar
                    key={f.feature}
                    label={f.feature}
                    value={f.pct}
                    color={C.blue}
                    sub={`${f.users} users`}
                  />
                ))}
              </div>
            </CC>

            <CC title="A11y Feature Comparison" description="Users per feature with trend">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={A11Y_FEATURES.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 4, right: 50, left: 95, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="feature" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="users" fill={C.blue} radius={[0, 6, 6, 0]} name="Users">
                    {A11Y_FEATURES.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CC>
          </div>
        </section>

        {/* ═══ SECTION 6 — VOICE RECOGNITION ═══ */}
        <section aria-label="Voice recognition analytics">
          <SectionTitle
            title="Voice Recognition Accuracy"
            description="Command-level accuracy and usage frequency"
            action={
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
                onClick={() => handleExportSection(VOICE_COMMAND_DATA as unknown as Record<string, unknown>[], 'voice_commands')}>
                <Download className="h-3 w-3" />CSV
              </Button>
            }
          />
          <div className="grid lg:grid-cols-3 gap-4">
            <CC title="Command Accuracy" description="Recognition % per command" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={VOICE_COMMAND_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="cmd" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" axisLine={false} tickLine={false} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any) => [`${v}%`, 'Accuracy']} />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} name="Accuracy %">
                    {VOICE_COMMAND_DATA.map((d, i) => (
                      <Cell key={i} fill={d.accuracy >= 95 ? C.emerald : d.accuracy >= 90 ? C.blue : C.amber} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CC>

            <CC title="Command Usage" description="Most invoked voice commands">
              <div className="space-y-2">
                {VOICE_COMMAND_DATA.map((d, i) => (
                  <div key={d.cmd} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-4 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-slate-700 truncate">{d.cmd}</span>
                        <span className="text-xs font-bold text-slate-500 tabular-nums shrink-0 ml-1">{d.uses.toLocaleString()}</span>
                      </div>
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className="h-full rounded-full" style={{
                          width: `${(d.uses / VOICE_COMMAND_DATA[0].uses) * 100}%`,
                          background: PALETTE[i % PALETTE.length],
                        }} />
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold shrink-0" style={{ color: d.accuracy >= 95 ? C.emerald : C.blue }}>{d.accuracy}%</span>
                  </div>
                ))}
              </div>
            </CC>
          </div>
        </section>

        {/* ═══ SECTION 7 — USAGE HEATMAP ═══ */}
        <section aria-label="Usage heatmap">
          <SectionTitle title="Weekly Usage Heatmap" description="Active users by hour and day of week" />
          <CC title="Peak Usage Hours" description="Darker = more active users">
            <div className="overflow-x-auto">
              <table className="w-full text-xs" aria-label="Usage heatmap">
                <thead>
                  <tr>
                    <th className="w-16 text-left font-medium text-slate-400 pb-2" />
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                      <th key={d} className="text-center font-semibold text-slate-500 pb-2 w-14">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {HOURLY_HEATMAP.map(row => (
                    <tr key={row.hour}>
                      <td className="pr-3 text-slate-400 font-medium py-1">{row.hour}</td>
                      {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map(day => {
                        const val = row[day];
                        const intensity = val / 95;
                        return (
                          <td key={day} className="px-1 py-1">
                            <div
                              title={`${row.hour} ${day}: ${val} users`}
                              className="h-9 w-full rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-105 cursor-default"
                              style={{
                                background: `rgba(37,99,235,${0.05 + intensity * 0.85})`,
                                color: intensity > 0.5 ? 'white' : '#2563EB',
                              }}
                            >
                              {val}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
              <span>Low</span>
              <div className="flex gap-0.5">
                {[0.05, 0.2, 0.4, 0.6, 0.8, 1].map(o => (
                  <div key={o} className="h-3 w-5 rounded" style={{ background: `rgba(37,99,235,${o})` }} />
                ))}
              </div>
              <span>High</span>
            </div>
          </CC>
        </section>

        {/* ═══ SECTION 8 — REPORT BUILDER ═══ */}
        <section aria-label="Downloadable reports">
          <SectionTitle title="Downloadable Reports" description="Generate comprehensive institutional reports" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Student Performance',
                desc: 'Individual scores, trends & accessibility usage per student.',
                icon: Users, color: C.blue, bg: 'bg-blue-50',
                data: DAILY_DATA.slice(-7).map(d => ({ date: d.date, avgScore: d.avgScore, students: d.students })),
                file: 'student_performance',
              },
              {
                title: 'Exam Analytics',
                desc: 'Pass/fail rates, avg completion time & score distribution.',
                icon: FileText, color: C.violet, bg: 'bg-violet-50',
                data: INSTITUTION_PERF.map(d => ({ department: d.dept, avgScore: d.avgScore, completionRate: d.completionRate })),
                file: 'exam_analytics',
              },
              {
                title: 'Accessibility Report',
                desc: 'Feature adoption rates, screen reader & voice nav data.',
                icon: Accessibility, color: C.amber, bg: 'bg-amber-50',
                data: A11Y_FEATURES.map(f => ({ feature: f.feature, users: f.users, adoptionPct: f.pct, trend: f.trend })),
                file: 'accessibility_report',
              },
              {
                title: 'Voice Recognition',
                desc: 'Per-command accuracy, usage counts & error analysis.',
                icon: Mic, color: C.cyan, bg: 'bg-cyan-50',
                data: VOICE_COMMAND_DATA.map(d => ({ command: d.cmd, uses: d.uses, accuracy: d.accuracy })),
                file: 'voice_recognition',
              },
              {
                title: 'Difficult Questions',
                desc: 'Lowest success-rate questions ranked by difficulty.',
                icon: AlertCircle, color: C.red, bg: 'bg-red-50',
                data: DIFFICULT_QUESTIONS.map(q => ({ rank: q.rank, question: q.text.slice(0, 60), subject: q.subject, successRate: q.successRate, attempts: q.attempts })),
                file: 'difficult_questions',
              },
              {
                title: 'Institution Overview',
                desc: 'Cross-department enrollment, scores & completion rates.',
                icon: Globe, color: C.emerald, bg: 'bg-emerald-50',
                data: INSTITUTION_PERF as unknown as Record<string, unknown>[],
                file: 'institution_overview',
              },
              {
                title: 'Daily Usage Log',
                desc: 'Day-by-day activity for the last 30 days.',
                icon: Activity, color: C.pink, bg: 'bg-pink-50',
                data: DAILY_DATA as unknown as Record<string, unknown>[],
                file: 'daily_usage',
              },
              {
                title: 'Complete Bundle',
                desc: 'All analytics combined into one comprehensive export.',
                icon: Download, color: '#64748b', bg: 'bg-slate-100',
                data: [
                  ...INSTITUTION_PERF.map(d => ({ section: 'Institution', ...d })),
                  ...A11Y_FEATURES.map(f => ({ section: 'Accessibility', ...f })),
                ] as unknown as Record<string, unknown>[],
                file: 'complete_analytics',
              },
            ].map(r => {
              const Icon = r.icon;
              return (
                <Card key={r.title} className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                  onClick={() => handleExportSection(r.data as Record<string, unknown>[], r.file)}>
                  <CardContent className="p-5">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${r.bg}`}>
                      <Icon className="h-5 w-5" style={{ color: r.color }} aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-1">{r.title}</h3>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">{r.desc}</p>
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1.5 group-hover:border-primary group-hover:text-primary transition-colors">
                      <Download className="h-3.5 w-3.5" />Download CSV
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-200 pb-8">
          <span>OPSIS Analytics · Data refreshed {new Date().toLocaleString()}</span>
          <div className="flex gap-4">
            <button onClick={handleExportMain} className="hover:text-slate-700 transition-colors flex items-center gap-1"><Download className="h-3.5 w-3.5" />Export all</button>
            <button onClick={handlePrint} className="hover:text-slate-700 transition-colors flex items-center gap-1"><Share2 className="h-3.5 w-3.5" />Print / PDF</button>
          </div>
        </div>
      </div>

      {/* ── print styles ── */}
      <style>{`
        @media print {
          body { background: white; }
          header, nav, .fixed { display: none !important; }
          .shadow-sm, .shadow-md { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
        }
      `}</style>
    </div>
  );
}

