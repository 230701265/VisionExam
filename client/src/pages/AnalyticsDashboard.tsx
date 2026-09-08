import { useMemo, useState, type ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line,
  LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  AlertCircle, ArrowLeft, BarChart3, CalendarDays, CheckCircle2, Clock3,
  Download, FileCode2, FileText, GraduationCap, Info, RefreshCw, Table2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsDashboardProps {
  currentUser: { id: string; username: string; role: string };
}

type Bucket = "day" | "week" | "month";
type Preset = "7d" | "30d" | "3m" | "6m" | "ytd";

interface Overview {
  range: { from: string; to: string; bucket: Bucket };
  totals: {
    attempts: number; completed: number; students: number; codeSubmissions: number;
    averageScore: number | null; averageCompletionMinutes: number | null;
  };
  usage: Array<{
    period: string; attempts: number; completed: number; students: number;
    averageScore: number | null; averageCompletionMinutes: number | null;
  }>;
  scoreDistribution: Array<{ range: string; count: number }>;
  examPerformance: Array<{
    examId: string; title: string; attempts: number; completionRate: number;
    averageScore: number | null;
  }>;
  difficultQuestions: Array<{
    questionId: string; text: string; type: string; attempts: number; successRate: number;
  }>;
  unavailableMetrics: string[];
}

const BLUE = "#1d4ed8";
const TEAL = "#0f766e";
const AMBER = "#b45309";
const rangeDays: Record<Preset, number> = { "7d": 7, "30d": 30, "3m": 90, "6m": 180, ytd: 0 };
type SummaryCard = [string, string | number, ElementType, string];

function isoDate(date: Date) { return date.toISOString(); }
function getDates(preset: Preset) {
  const to = new Date();
  const from = new Date(to);
  if (preset === "ytd") from.setUTCMonth(0, 1);
  else from.setUTCDate(from.getUTCDate() - rangeDays[preset] + 1);
  from.setUTCHours(0, 0, 0, 0);
  return { from: isoDate(from), to: isoDate(to) };
}
function number(value: number | null | undefined, suffix = "") {
  return value === null || value === undefined ? "Not available" : `${value.toLocaleString()}${suffix}`;
}
function csv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return false;
  const keys = Object.keys(rows[0]);
  const body = [keys, ...rows.map(row => keys.map(key => String(row[key] ?? "").replaceAll('"', '""')))]
    .map(row => row.map(value => `"${value}"`).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
  link.download = filename; link.click(); URL.revokeObjectURL(link.href);
  return true;
}

function ChartTable({ id, caption, headers, rows, open, onToggle }: {
  id: string; caption: string; headers: string[]; rows: Array<Array<string | number>>;
  open: boolean; onToggle: () => void;
}) {
  return (
    <div className="mt-3">
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={id}
        className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-blue-700">
        <Table2 className="h-3.5 w-3.5" aria-hidden="true" /> {open ? "Hide data table" : "Show data table"}
      </button>
      {open && <div id={id} className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[420px] text-left text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-slate-100 text-slate-600"><tr>{headers.map(header => <th key={header} scope="col" className="px-3 py-2 font-bold">{header}</th>)}</tr></thead>
          <tbody>{rows.map((row, i) => <tr key={i} className="border-t border-slate-100"><th scope="row" className="px-3 py-2 font-medium text-slate-700">{row[0]}</th>{row.slice(1).map((value, j) => <td key={j} className="px-3 py-2 tabular-nums text-slate-600">{value}</td>)}</tr>)}</tbody>
        </table>
      </div>}
    </div>
  );
}

function ChartCard({ title, description, label, children, table }: {
  title: string; description: string; label: string; children: React.ReactNode; table: React.ReactNode;
}) {
  return <Card className="border-slate-200 shadow-sm">
    <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-900">{title}</CardTitle><p className="text-xs text-slate-500">{description}</p></CardHeader>
    <CardContent>
      <div role="img" aria-label={label} className="h-[245px] w-full">{children}</div>
      {table}
    </CardContent>
  </Card>;
}

export default function AnalyticsDashboard({ currentUser }: AnalyticsDashboardProps) {
  const [preset, setPreset] = useState<Preset>("30d");
  const [bucket, setBucket] = useState<Bucket>("day");
  const [tables, setTables] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const dates = useMemo(() => getDates(preset), [preset]);
  const url = useMemo(() => `/api/analytics/overview?from=${encodeURIComponent(dates.from)}&to=${encodeURIComponent(dates.to)}&bucket=${bucket}`, [dates, bucket]);
  const query = useQuery<Overview>({ queryKey: [url] });
  const data = query.data;
  const roleLabel = currentUser.role === "admin" ? "Admin analytics" : "Instructor analytics";
  const toggle = (id: string) => setTables(current => ({ ...current, [id]: !current[id] }));

  const exportAll = () => {
    if (!data) return;
    const rows = [
      ...data.usage.map(row => ({ section: "usage", ...row })),
      ...data.scoreDistribution.map(row => ({ section: "scoreDistribution", ...row })),
      ...data.examPerformance.map(row => ({ section: "examPerformance", ...row })),
      ...data.difficultQuestions.map(row => ({ section: "difficultQuestions", ...row })),
    ];
    if (csv(rows, `opsis-analytics-${dates.from.slice(0, 10)}-${dates.to.slice(0, 10)}.csv`))
      toast({ title: "CSV exported", description: "The current analytics response was downloaded." });
  };
  const usageRows = data?.usage ?? [];
  const chartUsage = usageRows.map(row => ({ ...row, period: row.period.slice(5) }));
  const scoreRows = data?.scoreDistribution ?? [];
  const examRows = data?.examPerformance ?? [];
  const questionRows = data?.difficultQuestions ?? [];

  return <main className="min-h-[100dvh] bg-[#f4f7fb] text-slate-900">
    <header className="border-b border-blue-950/20 bg-[#102a56] text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-blue-100 hover:text-white focus-visible:outline-2 focus-visible:outline-white"><ArrowLeft className="h-4 w-4" /> Back to {currentUser.role === "admin" ? "Admin Portal" : "Instructor Portal"}</Link>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><div className="mb-2 flex items-center gap-3"><div className="rounded-xl bg-blue-400/20 p-2"><BarChart3 className="h-5 w-5 text-blue-200" aria-hidden="true" /></div><span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">{roleLabel}</span></div><h1 className="text-3xl font-bold tracking-tight">Evidence, not assumptions.</h1><p className="mt-1 max-w-xl text-sm text-blue-100">A measured view of examination activity, outcomes, and question difficulty.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="date-preset">Date range</label><select id="date-preset" value={preset} onChange={e => setPreset(e.target.value as Preset)} className="h-9 rounded-md border border-blue-200/30 bg-blue-950/30 px-3 text-sm text-white"><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="3m">Last 3 months</option><option value="6m">Last 6 months</option><option value="ytd">Year to date</option></select>
            <div className="flex rounded-md border border-blue-200/30 bg-blue-950/30 p-0.5" aria-label="Chart bucket">
              {(["day", "week", "month"] as Bucket[]).map(value => <button key={value} type="button" onClick={() => setBucket(value)} aria-pressed={bucket === value} className={`rounded px-3 py-1.5 text-xs font-bold capitalize ${bucket === value ? "bg-white text-[#102a56]" : "text-blue-100 hover:bg-white/10"}`}>{value}</button>)}
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => query.refetch()} disabled={query.isFetching} className="border-blue-200/30 bg-transparent text-white hover:bg-white/10"><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />Refresh</Button>
            <Button type="button" size="sm" onClick={exportAll} disabled={!data} className="bg-blue-500 text-white hover:bg-blue-400"><Download className="mr-2 h-4 w-4" aria-hidden="true" />Export CSV</Button>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs text-blue-100"><CalendarDays className="h-4 w-4" aria-hidden="true" />{dates.from.slice(0, 10)} to {dates.to.slice(0, 10)} <span className="text-blue-300">•</span> Data updates when you change the range or bucket.</div>
      </div>
    </header>

    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {query.isPending && <div aria-live="polite" className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />)}</div>}
      {query.isError && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><div><strong>Analytics could not be loaded.</strong><p className="mt-1">{query.error instanceof Error ? query.error.message : "The server did not return a usable response."}</p><Button onClick={() => query.refetch()} size="sm" variant="outline" className="mt-3 border-red-300">Try again</Button></div></div>}
      {data && <>
        <section aria-labelledby="summary-heading"><div className="mb-3 flex items-center justify-between"><div><h2 id="summary-heading" className="text-lg font-bold">Overview</h2><p className="text-xs text-slate-500">Only values returned by the analytics service are shown.</p></div></div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {([
              ["Attempts", data.totals.attempts, FileText, "Examination attempts in range"],
              ["Completed", data.totals.completed, CheckCircle2, "Completed examination attempts"],
              ["Students", data.totals.students, Users, "Distinct students with attempts"],
              ["Code submissions", data.totals.codeSubmissions, FileCode2, "Code submissions in range"],
              ["Average score", number(data.totals.averageScore, "%"), GraduationCap, "Average score for scored completed attempts"],
              ["Avg. completion", number(data.totals.averageCompletionMinutes, " min"), Clock3, "Average recorded completion time"],
            ] as SummaryCard[]).map(([label, value, Icon, description]) => <Card key={String(label)} className="border-slate-200 shadow-sm"><CardContent className="p-4"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold text-slate-500">{label}</p><Icon className="h-4 w-4 text-blue-700" aria-hidden="true" /></div><p className="mt-3 text-2xl font-bold tabular-nums text-slate-950">{value}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{description}</p></CardContent></Card>)}
          </div>
        </section>

        {data.unavailableMetrics.length > 0 && <aside className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" aria-label="Metrics not yet tracked"><Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" /><div><strong>Not yet tracked</strong><p className="mt-1 text-xs">Voice and accessibility telemetry are not charted because the service does not provide these measures.</p><ul className="mt-2 list-inside list-disc text-xs">{data.unavailableMetrics.map(metric => <li key={metric}>{metric}</li>)}</ul></div></aside>}

        <section aria-labelledby="activity-heading"><div className="mb-3"><h2 id="activity-heading" className="text-lg font-bold">Activity and outcomes</h2><p className="text-xs text-slate-500">Counts and averages grouped by {bucket}.</p></div><div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <ChartCard title="Usage over time" description="Attempts, completions, and distinct students" label={`Usage over time for ${bucket} buckets. ${usageRows.length} periods returned.`} table={<ChartTable id="usage-table" caption="Usage over time" headers={["Period", "Attempts", "Completed", "Students"]} rows={usageRows.map(row => [row.period, row.attempts, row.completed, row.students])} open={!!tables.usage} onToggle={() => toggle("usage")} />}>
            {chartUsage.length ? <ResponsiveContainer><AreaChart data={chartUsage}><CartesianGrid stroke="#e2e8f0" vertical={false} /><XAxis dataKey="period" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Area type="monotone" dataKey="attempts" name="Attempts" stroke={BLUE} fill="#bfdbfe" fillOpacity={0.7} /><Area type="monotone" dataKey="completed" name="Completed" stroke={TEAL} fill="#99f6e4" fillOpacity={0.55} /></AreaChart></ResponsiveContainer> : <EmptyChart />}
          </ChartCard>
          <ChartCard title="Completion time trend" description="Average recorded minutes per completed attempt" label={`Average completion time across ${usageRows.filter(row => row.averageCompletionMinutes !== null).length} ${bucket} buckets with recorded durations.`} table={<ChartTable id="completion-table" caption="Average completion time over time" headers={["Period", "Average completion time"]} rows={usageRows.map(row => [row.period, number(row.averageCompletionMinutes, " min")])} open={!!tables.completion} onToggle={() => toggle("completion")} />}>
            {usageRows.some(row => row.averageCompletionMinutes !== null) ? <ResponsiveContainer><LineChart data={chartUsage}><CartesianGrid stroke="#e2e8f0" vertical={false} /><XAxis dataKey="period" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} unit="m" /><Tooltip /><Line type="monotone" dataKey="averageCompletionMinutes" name="Average completion minutes" connectNulls stroke={AMBER} strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer> : <EmptyChart />}
          </ChartCard>
          <ChartCard title="Score distribution" description="Completed attempts with a score" label={`Score distribution across ${scoreRows.reduce((sum, row) => sum + row.count, 0)} scored attempts.`} table={<ChartTable id="score-table" caption="Score distribution" headers={["Score range", "Count"]} rows={scoreRows.map(row => [row.range, row.count])} open={!!tables.score} onToggle={() => toggle("score")} />}>
            {scoreRows.length ? <ResponsiveContainer><BarChart data={scoreRows}><CartesianGrid stroke="#e2e8f0" vertical={false} /><XAxis dataKey="range" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" name="Attempts" fill={BLUE} radius={[4, 4, 0, 0]}>{scoreRows.map((_, i) => <Cell key={i} fill={i < 2 ? AMBER : i === 5 ? TEAL : BLUE} />)}</Bar></BarChart></ResponsiveContainer> : <EmptyChart />}
          </ChartCard>
        </div></section>

        <section aria-labelledby="performance-heading"><div className="mb-3"><h2 id="performance-heading" className="text-lg font-bold">Exam performance</h2><p className="text-xs text-slate-500">Completion and score metrics are calculated only where evidence exists.</p></div><ChartCard title="Exam comparison" description="Completion rate and average score by exam" label={`Exam performance for ${examRows.length} exams. Bars show completion rate and average score.`} table={<ChartTable id="exam-table" caption="Exam performance" headers={["Exam", "Attempts", "Completion rate", "Average score"]} rows={examRows.map(row => [row.title, row.attempts, `${row.completionRate}%`, number(row.averageScore, "%")])} open={!!tables.exam} onToggle={() => toggle("exam")} />}>
          {examRows.length ? <ResponsiveContainer><BarChart data={examRows} margin={{ left: 0, right: 10 }}><CartesianGrid stroke="#e2e8f0" vertical={false} /><XAxis dataKey="title" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={55} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="completionRate" name="Completion rate %" fill={BLUE} radius={[4, 4, 0, 0]} /><Bar dataKey="averageScore" name="Average score %" fill={TEAL} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyChart />}
        </ChartCard></section>

        <section aria-labelledby="questions-heading"><div className="mb-3"><h2 id="questions-heading" className="text-lg font-bold">Questions needing review</h2><p className="text-xs text-slate-500">Coding questions with the lowest observed success rates.</p></div><ChartCard title="Difficult questions" description="Success rates use the latest available submission per attempt" label={`Difficult questions list with ${questionRows.length} questions, ordered by success rate.`} table={<ChartTable id="question-table" caption="Difficult questions" headers={["Question", "Attempts", "Success rate"]} rows={questionRows.map(row => [row.text, row.attempts, `${row.successRate}%`])} open={!!tables.questions} onToggle={() => toggle("questions")} />}>
          {questionRows.length ? <ResponsiveContainer><LineChart data={questionRows.map(row => ({ ...row, label: row.text.slice(0, 20) }))} margin={{ left: 0, right: 16 }}><CartesianGrid stroke="#e2e8f0" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="successRate" name="Success rate %" stroke={AMBER} strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer> : <EmptyChart />}
        </ChartCard></section>
      </>}
      {!query.isPending && !query.isError && data && !data.usage.length && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center"><p className="font-semibold">No examination activity in this range.</p><p className="mt-1 text-sm text-slate-500">Try a wider date range. No metrics have been inferred.</p></div>}
      <footer className="flex items-center gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500"><Info className="h-4 w-4" aria-hidden="true" /> Reports are scoped to examinations you can access. Empty values mean no underlying evidence was available.</footer>
    </div>
  </main>;
}

function EmptyChart() {
  return <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-500">No data returned for this chart.</div>;
}