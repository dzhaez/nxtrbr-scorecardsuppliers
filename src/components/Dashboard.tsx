import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  ClipboardList,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  AlertTriangle,
  Activity,
  Gauge,
  Target,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Line,
  Cell,
} from 'recharts';
import type { SupplierWithOrders } from '@/lib/supabase';
import { useI18n } from '@/i18n/LanguageContext';

export type KpiFilter = 'todos' | 'avaliados' | 'pendentes' | 'otimos' | 'bons' | 'ruins';

interface DashboardProps {
  suppliers: SupplierWithOrders[];
  activeFilter: KpiFilter;
  onFilterChange: (f: KpiFilter) => void;
}

/* ── KPI Card ──────────────────────────────────────────────────────── */

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  glow: string;
  filter: KpiFilter;
  active: boolean;
  onClick: () => void;
  subtitle?: string;
  trend?: number;
}

function KpiCard({ label, value, icon, accent, glow, active, onClick, subtitle, trend }: KpiCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative text-left rounded-2xl border transition-all duration-300 animate-slide-up overflow-hidden ${
        active
          ? 'border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/10 scale-[1.02]'
          : 'border-border hover:border-primary/50 hover:shadow-md'
      } bg-card`}
    >
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 ${glow} transition-opacity duration-300 ${active ? 'opacity-40' : 'group-hover:opacity-30'}`} />
      <div className={`absolute inset-x-0 top-0 h-0.5 ${glow} ${active ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'}`} />
      <div className="p-4 relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold text-foreground mt-1.5 tabular-nums leading-none">{value}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-1.5">{subtitle}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl ${glow} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${active ? 'scale-110' : ''}`}>
            <span className={accent}>{icon}</span>
          </div>
        </div>
        {typeof trend === 'number' && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className={`w-3 h-3 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400 rotate-180'}`} />
            <span className={`text-[11px] font-medium tabular-nums ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

/* ── Chart tooltip ─────────────────────────────────────────────────── */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl">
      {label && <p className="text-xs font-semibold text-foreground mb-1">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color || p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold text-foreground tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Rating distribution donut (recharts) ─────────────────────────── */

function RatingDonutChart({ otimos, bons, ruins, total, t }: { otimos: number; bons: number; ruins: number; total: number; t: ReturnType<typeof useI18n>['t'] }) {
  const data = [
    { name: t.tierExcellent, value: otimos, fill: '#10b981' },
    { name: t.tierGood, value: bons, fill: '#f59e0b' },
    { name: t.tierPoor, value: ruins, fill: '#ef4444' },
  ];
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative w-36 h-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="62%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, Math.max(total, 1)]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'hsl(var(--muted))' }}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </RadialBar>
            <Tooltip content={<ChartTooltip />} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-foreground tabular-nums">{total}</span>
          <span className="text-[10px] text-muted-foreground uppercase">{t.evaluated}</span>
        </div>
      </div>
      <div className="space-y-2.5 flex-1 w-full">
        {data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.fill }} />
              <span className="text-sm font-medium text-foreground">{d.name}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden ml-2">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: d.fill }} />
              </div>
              <span className="text-sm font-bold tabular-nums w-6 text-right" style={{ color: d.fill }}>{d.value}</span>
              <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Score by criterion (bar chart) ────────────────────────────────── */

function CriterionBarChart({ suppliers, t }: { suppliers: SupplierWithOrders[]; t: ReturnType<typeof useI18n>['t'] }) {
  const data = useMemo(() => {
    const avaliados = suppliers.filter((s) => s.status === 'avaliado' && s.avaliacao);
    if (avaliados.length === 0) return null;
    const avg = (key: 'nota1' | 'nota2' | 'nota3') =>
      avaliados.reduce((sum, s) => sum + (s.avaliacao?.[key] ?? 0), 0) / avaliados.length;
    return [
      { name: t.quality, score: parseFloat(avg('nota1').toFixed(2)) },
      { name: t.delivery, score: parseFloat(avg('nota2').toFixed(2)) },
      { name: t.cost, score: parseFloat(avg('nota3').toFixed(2)) },
    ];
  }, [suppliers, t.quality, t.delivery, t.cost]);

  if (!data) {
    return <p className="text-sm text-muted-foreground text-center py-8">{t.noEvaluations}</p>;
  }
  const colors = ['#f97316', '#f59e0b', '#fb923c'];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} width={70} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
        <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={28}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Trend chart: evaluations over time ───────────────────────────── */

function TrendChart({ suppliers, t }: { suppliers: SupplierWithOrders[]; t: ReturnType<typeof useI18n>['t'] }) {
  const data = useMemo(() => {
    const avaliados = suppliers.filter((s) => s.status === 'avaliado' && s.avaliacao?.data_avaliacao);
    if (avaliados.length === 0) return [];
    const sorted = [...avaliados].sort(
      (a, b) => new Date(a.avaliacao!.data_avaliacao).getTime() - new Date(b.avaliacao!.data_avaliacao).getTime(),
    );
    const points: { label: string; media: number; count: number }[] = [];
    let cumulativeSum = 0;
    sorted.forEach((s, i) => {
      cumulativeSum += s.avaliacao!.media;
      points.push({
        label: `#${i + 1}`,
        media: parseFloat((cumulativeSum / (i + 1)).toFixed(2)),
        count: i + 1,
      });
    });
    return points;
  }, [suppliers]);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{t.noEvaluations}</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="media" name={t.accumulatedAverage} stroke="#f97316" strokeWidth={2.5} fill="url(#trendGrad)" dot={{ r: 3, fill: '#f97316' }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="count" name={t.count} stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Commodity performance chart ──────────────────────────────────── */

function CommodityChart({ suppliers, t }: { suppliers: SupplierWithOrders[]; t: ReturnType<typeof useI18n>['t'] }) {
  const data = useMemo(() => {
    const groups = new Map<string, { sum: number; count: number }>();
    suppliers
      .filter((s) => s.status === 'avaliado' && s.avaliacao && s.commodities)
      .forEach((s) => {
        const key = s.commodities!;
        const cur = groups.get(key) ?? { sum: 0, count: 0 };
        cur.sum += s.avaliacao!.media;
        cur.count += 1;
        groups.set(key, cur);
      });
    return Array.from(groups.entries())
      .map(([name, v]) => ({ name, media: parseFloat((v.sum / v.count).toFixed(2)), count: v.count }))
      .sort((a, b) => b.media - a.media)
      .slice(0, 8);
  }, [suppliers]);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{t.noEvaluations}</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: -20, right: 10, top: 5, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" interval={0} />
        <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
        <Bar dataKey="media" name={t.generalAverage} radius={[6, 6, 0, 0]} barSize={32}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.media >= 4 ? '#10b981' : d.media >= 2 ? '#f59e0b' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Completion gauge ─────────────────────────────────────────────── */

function CompletionGauge({ pct, t }: { pct: number; t: ReturnType<typeof useI18n>['t'] }) {
  const data = [{ name: 'progress', value: pct, fill: pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f97316' }];
  return (
    <div className="relative w-40 h-40 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'hsl(var(--muted))' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-4xl font-bold text-foreground tabular-nums">{pct}%</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.completed}</span>
      </div>
    </div>
  );
}

/* ── Main Dashboard ────────────────────────────────────────────────── */

export default function Dashboard({ suppliers, activeFilter, onFilterChange }: DashboardProps) {
  const { t } = useI18n();

  const filteredSuppliers = useMemo(() => {
    switch (activeFilter) {
      case 'avaliados':
        return suppliers.filter((s) => s.status === 'avaliado');
      case 'pendentes':
        return suppliers.filter((s) => s.status === 'pendente');
      case 'otimos':
        return suppliers.filter((s) => s.status === 'avaliado' && (s.avaliacao?.media ?? 0) >= 4.0);
      case 'bons':
        return suppliers.filter((s) => {
          const m = s.avaliacao?.media ?? 0;
          return s.status === 'avaliado' && m >= 2.0 && m < 4.0;
        });
      case 'ruins':
        return suppliers.filter((s) => s.status === 'avaliado' && (s.avaliacao?.media ?? 0) < 2.0);
      default:
        return suppliers;
    }
  }, [suppliers, activeFilter]);

  const totalFornecedores = filteredSuppliers.length;
  const totalOrdens = filteredSuppliers.reduce((sum, s) => sum + s.totalOrdens, 0);
  const avaliados = filteredSuppliers.filter((s) => s.status === 'avaliado');
  const totalAvaliados = avaliados.length;
  const totalPendentes = totalFornecedores - totalAvaliados;

  const { medias, mediaGeral, otimos, bons, ruins } = useMemo(() => {
    const meds: number[] = [];
    let ot = 0, bo = 0, ru = 0;
    for (const s of avaliados) {
      const m = s.avaliacao?.media ?? 0;
      if (m > 0) {
        meds.push(m);
        if (m >= 4.0) ot++;
        else if (m >= 2.0) bo++;
        else ru++;
      }
    }
    const mg = meds.length > 0 ? (meds.reduce((a, b) => a + b, 0) / meds.length).toFixed(1) : '—';
    return { medias: meds, mediaGeral: mg, otimos: ot, bons: bo, ruins: ru };
  }, [avaliados]);

  const pctConcluido = totalFornecedores > 0 ? Math.round((totalAvaliados / totalFornecedores) * 100) : 0;

  const taxaAprovacao = totalAvaliados > 0 ? Math.round((otimos / totalAvaliados) * 100) : 0;
  const taxaRisco = totalAvaliados > 0 ? Math.round((ruins / totalAvaliados) * 100) : 0;
  const mediaNotas = medias.length > 0 ? medias.reduce((a, b) => a + b, 0) : 0;
  const desvioPadrao = useMemo(() => {
    if (medias.length < 2) return 0;
    const mean = medias.reduce((a, b) => a + b, 0) / medias.length;
    return Math.sqrt(medias.map((m) => Math.pow(m - mean, 2)).reduce((a, b) => a + b, 0) / medias.length);
  }, [medias]);
  const consistencia = Math.max(0, Math.round((1 - desvioPadrao / 2.5) * 100));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label={t.totalSuppliers}
          value={totalFornecedores}
          icon={<Users className="w-5 h-5" />}
          accent="text-orange-400"
          glow="bg-orange-500/15"
          filter="todos"
          active={activeFilter === 'todos'}
          onClick={() => onFilterChange('todos')}
          subtitle={`${totalOrdens} ${t.orders}`}
        />
        <KpiCard
          label={t.evaluated}
          value={totalAvaliados}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="text-emerald-400"
          glow="bg-emerald-500/15"
          filter="avaliados"
          active={activeFilter === 'avaliados'}
          onClick={() => onFilterChange('avaliados')}
          subtitle={`${pctConcluido}% ${t.ofTotal}`}
        />
        <KpiCard
          label={t.pending}
          value={totalPendentes}
          icon={<Clock className="w-5 h-5" />}
          accent="text-amber-300"
          glow="bg-amber-500/15"
          filter="pendentes"
          active={activeFilter === 'pendentes'}
          onClick={() => onFilterChange('pendentes')}
          subtitle={`${totalFornecedores > 0 ? 100 - pctConcluido : 0}% ${t.ofTotal}`}
        />
        <KpiCard
          label={t.generalAverage}
          value={mediaGeral}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="text-orange-300"
          glow="bg-orange-500/15"
          filter="todos"
          active={false}
          onClick={() => onFilterChange('todos')}
          subtitle={`${medias.length} ${t.evaluationsCount}`}
        />
        <KpiCard
          label={t.approvalRate}
          value={`${taxaAprovacao}%`}
          icon={<Award className="w-5 h-5" />}
          accent="text-emerald-400"
          glow="bg-emerald-500/15"
          filter="otimos"
          active={activeFilter === 'otimos'}
          onClick={() => onFilterChange('otimos')}
          subtitle={`${otimos} ${t.excellentSuppliers}`}
        />
        <KpiCard
          label={t.riskSuppliers}
          value={ruins}
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="text-red-400"
          glow="bg-red-500/15"
          filter="ruins"
          active={activeFilter === 'ruins'}
          onClick={() => onFilterChange('ruins')}
          subtitle={`${taxaRisco}% ${t.ofTotal}`}
        />
        <KpiCard
          label={t.consistency}
          value={`${consistencia}%`}
          icon={<Gauge className="w-5 h-5" />}
          accent="text-cyan-400"
          glow="bg-cyan-500/15"
          filter="todos"
          active={false}
          onClick={() => onFilterChange('todos')}
          subtitle={`${t.deviation}: ${desvioPadrao.toFixed(2)}`}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="brand-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t.evaluationDistribution}</h3>
            </div>
            <RatingDonutChart otimos={otimos} bons={bons} ruins={ruins} total={totalAvaliados} t={t} />
            {activeFilter !== 'todos' && (
              <p className="text-[11px] text-primary mt-3 text-center">{t.activeFilter} {activeFilter}</p>
            )}
          </CardContent>
        </Card>

        <Card className="brand-card shadow-sm">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-4 self-start">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t.cycleProgress}</h3>
            </div>
            <CompletionGauge pct={pctConcluido} t={t} />
            <div className="mt-4 grid grid-cols-2 gap-3 w-full">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                <p className="text-xs text-muted-foreground">{t.completed}</p>
                <p className="text-xl font-bold text-emerald-400 tabular-nums">{totalAvaliados}</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                <p className="text-xs text-muted-foreground">{t.remaining}</p>
                <p className="text-xl font-bold text-amber-400 tabular-nums">{totalPendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="brand-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t.scoreByCriterion}</h3>
            </div>
            <CriterionBarChart suppliers={filteredSuppliers} t={t} />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="brand-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t.evaluationTrend}</h3>
            </div>
            <TrendChart suppliers={filteredSuppliers} t={t} />
          </CardContent>
        </Card>

        <Card className="brand-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t.performanceByCommodity}</h3>
            </div>
            <CommodityChart suppliers={filteredSuppliers} t={t} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
