import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Building2,
  User,
  BarChart3,
  Trophy,
  AlertTriangle,
  Loader2,
  RefreshCw,
  History,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  Zap,
  Target,
  Activity,
  Minus,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, classificacaoMedia, type Avaliacao, type Acesso, type Importacao } from '@/lib/supabase';
import { useI18n } from '@/i18n/LanguageContext';

interface ManagementPanelProps {
  cicloAtual: string;
}

interface CicloResumo {
  ciclo: string;
  totalFornecedores: number;
  totalOrdens: number;
  totalAvaliacoes: number;
  mediaGeral: number;
  otimos: number;
  bons: number;
  ruins: number;
}

interface UsuarioResumo {
  id_usuario: string;
  owners: string[];
  totalFornecedores: number;
  avaliados: number;
  pendentes: number;
  mediaGeral: number;
}

interface FornecedorResumo {
  codigo_fornecedor: string;
  razao_social: string;
  nome_clas: string | null;
  cnpj_cpf: string | null;
  commodities: string | null;
  owner: string | null;
  totalOrdens: number;
  totalAvaliacoes: number;
  mediaGeral: number;
}

interface CommodityResumo {
  commodity: string;
  totalFornecedores: number;
  totalAvaliacoes: number;
  mediaGeral: number;
}

interface OwnerResumo {
  owner: string;
  totalFornecedores: number;
  totalAvaliacoes: number;
  mediaGeral: number;
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
          <span className="font-bold text-foreground tabular-nums">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Strategic KPI Card ───────────────────────────────────────────── */

interface StrategicKpiProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  glow: string;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  active?: boolean;
  onClick?: () => void;
  progress?: number;
}

function StrategicKpi({ label, value, icon, accent, glow, subtitle, trend, trendLabel, active, onClick, progress }: StrategicKpiProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative text-left rounded-2xl border transition-all duration-500 animate-slide-up overflow-hidden w-full ${
        active
          ? 'border-primary shadow-xl shadow-primary/20 scale-[1.03]'
          : 'border-border hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5'
      } bg-card`}
    >
      <div className={`absolute inset-0 ${glow} opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${active ? 'opacity-100' : ''}`} />
      <div className={`absolute inset-x-0 top-0 h-1 ${glow} transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-40 group-hover:opacity-80'}`} />
      <div className="p-4 sm:p-5 relative">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-11 h-11 rounded-xl ${glow} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${active ? 'scale-110' : ''}`}>
            <span className={accent}>{icon}</span>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">{label}</p>
        </div>
        <p className="text-4xl font-bold text-foreground tabular-nums leading-none tracking-tight">{value}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-2">{subtitle}</p>}
        {typeof trend === 'number' && (
          <div className="flex items-center gap-1.5 mt-2.5">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : trend < 0 ? 'bg-red-500/10 text-red-400' : 'bg-muted text-muted-foreground'}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </div>
            {trendLabel && <span className="text-[10px] text-muted-foreground">{trendLabel}</span>}
          </div>
        )}
        {typeof progress === 'number' && (
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%`, background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)/0.5))' }} />
          </div>
        )}
      </div>
    </button>
  );
}

/* ── Classificacao Badge ──────────────────────────────────────────── */

function ClassificacaoBadge({ media }: { media: number }) {
  const { t } = useI18n();
  if (media <= 0) return <span className="text-xs text-muted-foreground">—</span>;
  const c = classificacaoMedia(media, { poor: t.classificationPoor, good: t.classificationGood, excellent: t.classificationExcellent });
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${c.bg} ${c.color}`}>
      {media.toFixed(1)} · {c.label}
    </span>
  );
}

function ProgressoBar({ avaliados, total }: { avaliados: number; total: number }) {
  const pct = total > 0 ? Math.round((avaliados / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden min-w-[60px]">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">{pct}%</span>
    </div>
  );
}

/* ── Risk Matrix Scatter Chart ────────────────────────────────────── */

function RiskMatrix({ fornecedores }: { fornecedores: FornecedorResumo[] }) {
  const { t } = useI18n();
  const data = useMemo(() => {
    return fornecedores
      .filter((f) => f.mediaGeral > 0)
      .map((f) => ({
        x: f.totalAvaliacoes,
        y: f.mediaGeral,
        z: f.totalOrdens,
        name: f.nome_clas || f.razao_social,
      }));
  }, [fornecedores]);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{t.noEvaluationsForMatrix}</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ left: -10, right: 20, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          dataKey="x"
          name={t.evaluationsAxis}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          label={{ value: t.evaluationVolume, position: 'bottom', fontSize: 11, fill: 'hsl(var(--muted-foreground))', offset: 0 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={t.averageCol}
          domain={[0, 5]}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          label={{ value: t.averageScore, angle: -90, position: 'insideLeft', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <ZAxis type="number" dataKey="z" range={[40, 200]} name={t.ordersAxis} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const p = payload[0].payload as { name: string; x: number; y: number; z: number };
            return (
              <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl">
                <p className="text-xs font-semibold text-foreground mb-1">{p.name}</p>
                <p className="text-xs text-muted-foreground">{t.score}: <span className="font-bold text-foreground">{p.y.toFixed(2)}</span></p>
                <p className="text-xs text-muted-foreground">{t.evaluationsAxis}: <span className="font-bold text-foreground">{p.x}</span></p>
                <p className="text-xs text-muted-foreground">{t.ordersAxis}: <span className="font-bold text-foreground">{p.z}</span></p>
              </div>
            );
          }}
        />
        <Scatter data={data}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.y >= 4 ? '#10b981' : d.y >= 2 ? '#f59e0b' : '#ef4444'}
              fillOpacity={0.7}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ── Strategic Supplier View ──────────────────────────────────────── */

function StrategicSupplierView({ fornecedores }: { fornecedores: FornecedorResumo[] }) {
  const { t } = useI18n();
  const avaliados = fornecedores.filter((f) => f.mediaGeral > 0);
  const naoAvaliados = fornecedores.length - avaliados.length;
  const otimos = avaliados.filter((f) => f.mediaGeral >= 4).length;
  const bons = avaliados.filter((f) => f.mediaGeral >= 2 && f.mediaGeral < 4).length;
  const ruins = avaliados.filter((f) => f.mediaGeral < 2).length;
  const total = fornecedores.length;

  const tiers = [
    { label: t.tierExcellent, count: otimos, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'bg-emerald-400' },
    { label: t.tierGood, count: bons, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', bar: 'bg-amber-400' },
    { label: t.tierPoor, count: ruins, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', bar: 'bg-red-400' },
    { label: t.tierNotEvaluated, count: naoAvaliados, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', bar: 'bg-muted-foreground/40' },
  ];

  const ranked = [...avaliados].sort((a, b) => b.mediaGeral - a.mediaGeral);

  return (
    <div className="space-y-4">
      {/* Tier Distribution Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiers.map((tier) => {
          const pct = total > 0 ? Math.round((tier.count / total) * 100) : 0;
          return (
            <div key={tier.label} className={`rounded-xl border ${tier.border} ${tier.bg} p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${tier.color}`}>{tier.label}</span>
                <span className={`text-2xl font-bold tabular-nums ${tier.color}`}>{tier.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${tier.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 tabular-nums">{pct}% {t.ofTotal}</p>
            </div>
          );
        })}
      </div>

      {/* Strategic Ranking */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <Layers className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">{t.strategicRanking}</h4>
          <span className="text-xs text-muted-foreground ml-auto">{ranked.length} {t.evaluatedCount}</span>
        </div>
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-12 text-center">{t.position}</TableHead>
                <TableHead>{t.supplier}</TableHead>
                <TableHead>{t.commodity}</TableHead>
                <TableHead>{t.ownerCol}</TableHead>
                <TableHead className="text-right">{t.evaluationsCol}</TableHead>
                <TableHead className="min-w-[160px]">{t.scoreCol}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t.noSuppliersEvaluated}</TableCell>
                </TableRow>
              ) : (
                ranked.map((f, i) => {
                  const c = classificacaoMedia(f.mediaGeral);
                  const isTop = i < 3;
                  const isBottom = i >= ranked.length - 3 && f.mediaGeral < 2;
                  return (
                    <TableRow key={f.codigo_fornecedor} className={isTop ? 'bg-emerald-500/5' : isBottom ? 'bg-red-500/5' : ''}>
                      <TableCell className="text-center tabular-nums font-bold text-muted-foreground">
                        {isTop ? <span className="text-emerald-400">{i + 1}</span> : isBottom ? <span className="text-red-400">{i + 1}</span> : i + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isTop && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          {isBottom && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                          <span className="truncate max-w-[200px]" title={f.nome_clas || f.razao_social}>{f.nome_clas || f.razao_social}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{f.commodities || '—'}</TableCell>
                      <TableCell className="text-xs">{f.owner || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{f.totalAvaliacoes}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden min-w-[60px]">
                            <div className={`h-full rounded-full transition-all duration-500 ${c.bg}`} style={{ width: `${(f.mediaGeral / 5) * 100}%` }} />
                          </div>
                          <ClassificacaoBadge media={f.mediaGeral} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

/* ── Owner Performance Chart ──────────────────────────────────────── */

function OwnerPerformanceChart({ owners }: { owners: OwnerResumo[] }) {
  const { t } = useI18n();
  const data = useMemo(() => {
    const sorted = [...owners].sort((a, b) => b.totalAvaliacoes - a.totalAvaliacoes).slice(0, 12);
    return sorted.map((o) => ({
      name: o.owner.length > 14 ? o.owner.slice(0, 12) + '…' : o.owner,
      fullName: o.owner,
      media: parseFloat((o.mediaGeral || 0).toFixed(2)),
      avaliacoes: o.totalAvaliacoes,
      fornecedores: o.totalFornecedores,
    }));
  }, [owners]);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{t.noOwners}</p>;
  }

  const maxAvaliacoes = Math.max(...data.map((d) => d.avaliacoes), 1);

  return (
    <div className="space-y-4">
      {/* Bar chart: average score by owner */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t.averageByOwner}</p>
        <ResponsiveContainer width="100%" height={Math.max(220, data.length * 32)}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} width={90} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const p = payload[0].payload as { fullName: string; media: number; avaliacoes: number; fornecedores: number };
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl">
                    <p className="text-xs font-semibold text-foreground mb-1">{p.fullName}</p>
                    <p className="text-xs text-muted-foreground">{t.averageCol}: <span className="font-bold text-foreground">{p.media.toFixed(2)}</span></p>
                    <p className="text-xs text-muted-foreground">{t.evaluationsCol}: <span className="font-bold text-foreground">{p.avaliacoes}</span></p>
                    <p className="text-xs text-muted-foreground">{t.suppliersCol}: <span className="font-bold text-foreground">{p.fornecedores}</span></p>
                  </div>
                );
              }}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
            />
            <Bar dataKey="media" name={t.averageCol} radius={[0, 6, 6, 0]} barSize={20}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.media >= 4 ? '#10b981' : d.media >= 2 ? '#f59e0b' : d.media > 0 ? '#ef4444' : '#64748b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress bars: evaluation coverage by owner */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t.evaluationCoverage}</p>
        <div className="space-y-2.5">
          {data.map((d) => {
            const pct = d.fornecedores > 0 ? Math.round((d.avaliacoes / d.fornecedores) * 100) : 0;
            const barWidth = maxAvaliacoes > 0 ? (d.avaliacoes / maxAvaliacoes) * 100 : 0;
            return (
              <div key={d.fullName} className="flex items-center gap-3">
                <span className="text-xs font-medium text-foreground w-20 shrink-0 truncate" title={d.fullName}>{d.name}</span>
                <div className="flex-1 h-6 rounded-md bg-muted overflow-hidden relative">
                  <div
                    className="h-full rounded-md transition-all duration-700 flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max(barWidth, d.avaliacoes > 0 ? 8 : 0)}%`,
                      background: pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : pct > 0 ? '#f97316' : '#64748b',
                    }}
                  >
                    {d.avaliacoes > 0 && (
                      <span className="text-[10px] font-bold text-white tabular-nums">{d.avaliacoes}</span>
                    )}
                  </div>
                  {d.avaliacoes === 0 && (
                    <span className="absolute inset-0 flex items-center pl-2 text-[10px] text-muted-foreground">{t.noEvaluations}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-12 text-right shrink-0">{d.fornecedores} {t.suppliersShort}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Commodity Performance Chart ──────────────────────────────────── */

function CommodityPerformanceChart({ commodities }: { commodities: CommodityResumo[] }) {
  const { t } = useI18n();
  const data = useMemo(() => {
    const sorted = [...commodities].sort((a, b) => b.totalAvaliacoes - a.totalAvaliacoes);
    return sorted.map((c) => ({
      name: c.commodity.length > 16 ? c.commodity.slice(0, 14) + '…' : c.commodity,
      fullName: c.commodity,
      media: parseFloat((c.mediaGeral || 0).toFixed(2)),
      avaliacoes: c.totalAvaliacoes,
      fornecedores: c.totalFornecedores,
    }));
  }, [commodities]);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{t.noCommodities}</p>;
  }

  const maxAvaliacoes = Math.max(...data.map((d) => d.avaliacoes), 1);

  return (
    <div className="space-y-4">
      {/* Bar chart: average score by commodity */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t.averageByCommodity}</p>
        <ResponsiveContainer width="100%" height={Math.max(220, data.length * 32)}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} width={100} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const p = payload[0].payload as { fullName: string; media: number; avaliacoes: number; fornecedores: number };
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl">
                    <p className="text-xs font-semibold text-foreground mb-1">{p.fullName}</p>
                    <p className="text-xs text-muted-foreground">{t.averageCol}: <span className="font-bold text-foreground">{p.media.toFixed(2)}</span></p>
                    <p className="text-xs text-muted-foreground">{t.evaluationsCol}: <span className="font-bold text-foreground">{p.avaliacoes}</span></p>
                    <p className="text-xs text-muted-foreground">{t.suppliersCol}: <span className="font-bold text-foreground">{p.fornecedores}</span></p>
                  </div>
                );
              }}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
            />
            <Bar dataKey="media" name={t.averageCol} radius={[0, 6, 6, 0]} barSize={20}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.media >= 4 ? '#10b981' : d.media >= 2 ? '#f59e0b' : d.media > 0 ? '#ef4444' : '#64748b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress bars: evaluation coverage by commodity */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t.evaluationCoverage}</p>
        <div className="space-y-2.5">
          {data.map((d) => {
            const pct = d.fornecedores > 0 ? Math.round((d.avaliacoes / d.fornecedores) * 100) : 0;
            const barWidth = maxAvaliacoes > 0 ? (d.avaliacoes / maxAvaliacoes) * 100 : 0;
            return (
              <div key={d.fullName} className="flex items-center gap-3">
                <span className="text-xs font-medium text-foreground w-24 shrink-0 truncate" title={d.fullName}>{d.name}</span>
                <div className="flex-1 h-6 rounded-md bg-muted overflow-hidden relative">
                  <div
                    className="h-full rounded-md transition-all duration-700 flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max(barWidth, d.avaliacoes > 0 ? 8 : 0)}%`,
                      background: pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : pct > 0 ? '#f97316' : '#64748b',
                    }}
                  >
                    {d.avaliacoes > 0 && (
                      <span className="text-[10px] font-bold text-white tabular-nums">{d.avaliacoes}</span>
                    )}
                  </div>
                  {d.avaliacoes === 0 && (
                    <span className="absolute inset-0 flex items-center pl-2 text-[10px] text-muted-foreground">{t.noEvaluations}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-12 text-right shrink-0">{d.fornecedores} {t.suppliersShort}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Rating Distribution Donut ───────────────────────────────────── */

function RatingDonut({ otimos, bons, ruins, total }: { otimos: number; bons: number; ruins: number; total: number }) {
  const { t } = useI18n();
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

/* ── Completion Gauge ────────────────────────────────────────────── */

function CompletionGauge({ pct }: { pct: number }) {
  const { t } = useI18n();
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

/* ── Main Component ───────────────────────────────────────────────── */

export default function ManagementPanel({ cicloAtual }: ManagementPanelProps) {
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userFilter, setUserFilter] = useState<'todos' | 'avaliados' | 'pendentes' | 'otimos' | 'ruins' | 'descobertos'>('todos');
  const [ciclos, setCiclos] = useState<CicloResumo[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorResumo[]>([]);
  const [commodities, setCommodities] = useState<CommodityResumo[]>([]);
  const [owners, setOwners] = useState<OwnerResumo[]>([]);
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [fornPage, setFornPage] = useState(0);
  const fornPageSize = 20;
  const [filterCommodity, setFilterCommodity] = useState<string>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');

  const loadData = useCallback(async () => {
    try {
      const [avalRes, ordRes, fornRes, impRes, accRes] = await Promise.all([
        supabase.from('avaliacoes').select('*'),
        supabase.from('ordens_compra').select('*'),
        supabase.from('fornecedores').select('*'),
        supabase.from('importacoes').select('*').order('data_importacao', { ascending: false }),
        supabase.from('acessos').select('*').order('data_hora', { ascending: false }).limit(200),
      ]);

      const avaliacoes = (avalRes.data || []) as Avaliacao[];
      const ordens = ordRes.data || [];
      const fornecedores = fornRes.data || [];
      setAcessos((accRes.data || []) as Acesso[]);

      // --- Ciclos resumo with classification breakdown ---
      const cicloMap = new Map<string, { fornecedores: Set<string>; ordens: number; avaliacoes: number; somaMedias: number; otimos: number; bons: number; ruins: number }>();
      const importacoes = (impRes.data || []) as Importacao[];
      (importacoes).forEach((imp) => {
        if (!cicloMap.has(imp.ciclo)) {
          cicloMap.set(imp.ciclo, { fornecedores: new Set(), ordens: 0, avaliacoes: 0, somaMedias: 0, otimos: 0, bons: 0, ruins: 0 });
        }
      });
      ordens.forEach((o) => {
        const c = cicloMap.get(o.ciclo);
        if (c) {
          c.ordens++;
          c.fornecedores.add(o.codigo_fornecedor);
        }
      });
      avaliacoes.forEach((a) => {
        const c = cicloMap.get(a.ciclo);
        if (c) {
          c.avaliacoes++;
          c.somaMedias += a.media;
          if (a.media >= 4.0) c.otimos++;
          else if (a.media >= 2.0) c.bons++;
          else c.ruins++;
        }
      });
      const ciclosArr: CicloResumo[] = Array.from(cicloMap.entries())
        .map(([ciclo, d]) => ({
          ciclo,
          totalFornecedores: d.fornecedores.size,
          totalOrdens: d.ordens,
          totalAvaliacoes: d.avaliacoes,
          mediaGeral: d.avaliacoes > 0 ? d.somaMedias / d.avaliacoes : 0,
          otimos: d.otimos,
          bons: d.bons,
          ruins: d.ruins,
        }))
        .sort((a, b) => b.ciclo.localeCompare(a.ciclo));
      setCiclos(ciclosArr);

      // --- Usuários resumo ---
      const userMap = new Map<string, { fornecedores: Set<string>; owners: Set<string>; avaliacoes: number; somaMedias: number }>();
      ordens
        .filter((o) => o.ciclo === cicloAtual)
        .forEach((o) => {
          if (!userMap.has(o.id_usuario)) {
            userMap.set(o.id_usuario, { fornecedores: new Set(), owners: new Set(), avaliacoes: 0, somaMedias: 0 });
          }
          const entry = userMap.get(o.id_usuario)!;
          entry.fornecedores.add(o.codigo_fornecedor);
          if (o.owner) entry.owners.add(o.owner);
        });
      avaliacoes
        .filter((a) => a.ciclo === cicloAtual)
        .forEach((a) => {
          if (!userMap.has(a.id_usuario)) {
            userMap.set(a.id_usuario, { fornecedores: new Set(), owners: new Set(), avaliacoes: 0, somaMedias: 0 });
          }
          const u = userMap.get(a.id_usuario)!;
          u.avaliacoes++;
          u.somaMedias += a.media;
        });
      const usuariosArr: UsuarioResumo[] = Array.from(userMap.entries())
        .map(([id, d]) => ({
          id_usuario: id,
          owners: Array.from(d.owners).sort(),
          totalFornecedores: d.fornecedores.size,
          avaliados: d.avaliacoes,
          pendentes: d.fornecedores.size - d.avaliacoes,
          mediaGeral: d.avaliacoes > 0 ? d.somaMedias / d.avaliacoes : 0,
        }))
        .sort((a, b) => b.totalFornecedores - a.totalFornecedores);
      setUsuarios(usuariosArr);

      // --- Fornecedores resumo ---
      const fornMap = new Map<string, { ordens: number; avaliacoes: number; somaMedias: number }>();
      ordens.forEach((o) => {
        if (!fornMap.has(o.codigo_fornecedor)) {
          fornMap.set(o.codigo_fornecedor, { ordens: 0, avaliacoes: 0, somaMedias: 0 });
        }
        fornMap.get(o.codigo_fornecedor)!.ordens++;
      });
      avaliacoes.forEach((a) => {
        if (!fornMap.has(a.codigo_fornecedor)) {
          fornMap.set(a.codigo_fornecedor, { ordens: 0, avaliacoes: 0, somaMedias: 0 });
        }
        const f = fornMap.get(a.codigo_fornecedor)!;
        f.avaliacoes++;
        f.somaMedias += a.media;
      });
      const fornArr: FornecedorResumo[] = fornecedores.map((f) => {
        const d = fornMap.get(f.codigo_fornecedor) || { ordens: 0, avaliacoes: 0, somaMedias: 0 };
        return {
          codigo_fornecedor: f.codigo_fornecedor,
          razao_social: f.razao_social,
          nome_clas: f.nome_clas,
          cnpj_cpf: f.cnpj_cpf,
          commodities: f.commodities,
          owner: f.owner,
          totalOrdens: d.ordens,
          totalAvaliacoes: d.avaliacoes,
          mediaGeral: d.avaliacoes > 0 ? d.somaMedias / d.avaliacoes : 0,
        };
      }).sort((a, b) => b.totalAvaliacoes - a.totalAvaliacoes);
      setFornecedores(fornArr);

      // Build a fornecedor lookup map to avoid O(n²) find() calls
      const fornByCodigo = new Map(fornecedores.map((f) => [f.codigo_fornecedor, f]));

      // --- Commodities resumo ---
      const commMap = new Map<string, { fornecedores: Set<string>; avaliacoes: number; somaMedias: number }>();
      fornecedores.forEach((f) => {
        const key = f.commodities || 'Não classificado';
        if (!commMap.has(key)) {
          commMap.set(key, { fornecedores: new Set(), avaliacoes: 0, somaMedias: 0 });
        }
        commMap.get(key)!.fornecedores.add(f.codigo_fornecedor);
      });
      avaliacoes.forEach((a) => {
        const forn = fornByCodigo.get(a.codigo_fornecedor);
        const key = forn?.commodities || 'Não classificado';
        if (!commMap.has(key)) {
          commMap.set(key, { fornecedores: new Set(), avaliacoes: 0, somaMedias: 0 });
        }
        const c = commMap.get(key)!;
        c.avaliacoes++;
        c.somaMedias += a.media;
      });
      const commArr: CommodityResumo[] = Array.from(commMap.entries())
        .map(([commodity, d]) => ({
          commodity,
          totalFornecedores: d.fornecedores.size,
          totalAvaliacoes: d.avaliacoes,
          mediaGeral: d.avaliacoes > 0 ? d.somaMedias / d.avaliacoes : 0,
        }))
        .sort((a, b) => b.totalAvaliacoes - a.totalAvaliacoes);
      setCommodities(commArr);

      // --- Owners resumo ---
      const ownerMap = new Map<string, { fornecedores: Set<string>; avaliacoes: number; somaMedias: number }>();
      fornecedores.forEach((f) => {
        const key = f.owner || 'Não atribuído';
        if (!ownerMap.has(key)) {
          ownerMap.set(key, { fornecedores: new Set(), avaliacoes: 0, somaMedias: 0 });
        }
        ownerMap.get(key)!.fornecedores.add(f.codigo_fornecedor);
      });
      avaliacoes.forEach((a) => {
        const forn = fornByCodigo.get(a.codigo_fornecedor);
        const key = forn?.owner || 'Não atribuído';
        if (!ownerMap.has(key)) {
          ownerMap.set(key, { fornecedores: new Set(), avaliacoes: 0, somaMedias: 0 });
        }
        const o = ownerMap.get(key)!;
        o.avaliacoes++;
        o.somaMedias += a.media;
      });
      const ownerArr: OwnerResumo[] = Array.from(ownerMap.entries())
        .map(([owner, d]) => ({
          owner,
          totalFornecedores: d.fornecedores.size,
          totalAvaliacoes: d.avaliacoes,
          mediaGeral: d.avaliacoes > 0 ? d.somaMedias / d.avaliacoes : 0,
        }))
        .sort((a, b) => b.totalAvaliacoes - a.totalAvaliacoes);
      setOwners(ownerArr);

    } catch (error) {
      console.error('Management panel data load failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cicloAtual]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Derived KPIs ---

  const filteredUsuarios = useMemo(() => {
    switch (userFilter) {
      case 'avaliados':
        return usuarios.filter((u) => u.avaliados > 0);
      case 'pendentes':
        return usuarios.filter((u) => u.pendentes > 0);
      case 'otimos':
        return usuarios.filter((u) => u.mediaGeral >= 4.0);
      case 'ruins':
        return usuarios.filter((u) => u.mediaGeral > 0 && u.mediaGeral < 2.0);
      case 'descobertos':
        return usuarios.filter((u) => u.pendentes > 0);
      default:
        return usuarios;
    }
  }, [usuarios, userFilter]);

  const totalFornecedores = fornecedores.length;
  const {
    totalAvaliacoes, medias, mediaGeral, avaliadosCount, pendentes,
    otimos, bons, ruins, totalOrdens, ordensAvaliadas, ordensDescobertas,
  } = useMemo(() => {
    let tAval = 0, tOrd = 0, ordAval = 0;
    let avCount = 0, ot = 0, bo = 0, ru = 0;
    const meds: number[] = [];
    for (const f of fornecedores) {
      tAval += f.totalAvaliacoes;
      tOrd += f.totalOrdens;
      if (f.totalAvaliacoes > 0) {
        avCount++;
        ordAval += f.totalOrdens;
      }
      if (f.mediaGeral > 0) {
        meds.push(f.mediaGeral);
        if (f.mediaGeral >= 4.0) ot++;
        else if (f.mediaGeral >= 2.0) bo++;
        else ru++;
      }
    }
    const mg = meds.length > 0 ? meds.reduce((a, b) => a + b, 0) / meds.length : 0;
    return {
      totalAvaliacoes: tAval, medias: meds, mediaGeral: mg,
      avaliadosCount: avCount, pendentes: fornecedores.length - avCount,
      otimos: ot, bons: bo, ruins: ru,
      totalOrdens: tOrd, ordensAvaliadas: ordAval,
      ordensDescobertas: tOrd - ordAval,
    };
  }, [fornecedores]);

  // New strategic KPIs
  const pctConcluido = totalFornecedores > 0 ? Math.round((avaliadosCount / totalFornecedores) * 100) : 0;
  const taxaAprovacao = avaliadosCount > 0 ? Math.round((otimos / avaliadosCount) * 100) : 0;
  const taxaRisco = avaliadosCount > 0 ? Math.round((ruins / avaliadosCount) * 100) : 0;
  const desvioPadrao = useMemo(() => {
    if (medias.length < 2) return 0;
    const mean = medias.reduce((a, b) => a + b, 0) / medias.length;
    return Math.sqrt(medias.map((m) => Math.pow(m - mean, 2)).reduce((a, b) => a + b, 0) / medias.length);
  }, [medias]);
  const consistencia = Math.max(0, Math.round((1 - desvioPadrao / 2.5) * 100));
  const indiceCobertura = totalOrdens > 0 ? Math.round((ordensAvaliadas / totalOrdens) * 100) : 0;

  // Cycle-over-cycle trend
  const cicloTrend = useMemo(() => {
    if (ciclos.length < 2) return null;
    const sorted = [...ciclos].sort((a, b) => b.ciclo.localeCompare(a.ciclo));
    const current = sorted[0];
    const prev = sorted[1];
    if (prev.mediaGeral > 0 && current.mediaGeral > 0) {
      return ((current.mediaGeral - prev.mediaGeral) / prev.mediaGeral) * 100;
    }
    return null;
  }, [ciclos]);

  const avaliacaoTrend = useMemo(() => {
    if (ciclos.length < 2) return null;
    const sorted = [...ciclos].sort((a, b) => b.ciclo.localeCompare(a.ciclo));
    if (sorted[1].totalAvaliacoes > 0) {
      return ((sorted[0].totalAvaliacoes - sorted[1].totalAvaliacoes) / sorted[1].totalAvaliacoes) * 100;
    }
    return null;
  }, [ciclos]);

  const commodityOptions = useMemo(
    () => Array.from(new Set(fornecedores.map((f) => f.commodities).filter(Boolean))) as string[],
    [fornecedores],
  );
  const ownerOptions = useMemo(
    () => Array.from(new Set(fornecedores.map((f) => f.owner).filter(Boolean))) as string[],
    [fornecedores],
  );
  const filteredFornecedores = useMemo(() => {
    let result = fornecedores.filter((f) => {
      if (filterCommodity !== 'all' && f.commodities !== filterCommodity) return false;
      if (filterOwner !== 'all' && f.owner !== filterOwner) return false;
      return true;
    });
    if (userFilter === 'descobertos') {
      result = result.filter((f) => f.totalAvaliacoes === 0).sort((a, b) => b.totalOrdens - a.totalOrdens);
    }
    return result;
  }, [fornecedores, filterCommodity, filterOwner, userFilter]);

  useEffect(() => {
    setFornPage(0);
  }, [filterCommodity, filterOwner, userFilter]);

  function handleRefresh() {
    setRefreshing(true);
    loadData();
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">{t.loadingPanel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            {t.managementPanel}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t.managementPanelDesc.replace('{ciclo}', cicloAtual)}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          title={t.refresh}
        >
          {refreshing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
        </button>
      </div>

      {/* Strategic KPIs - Row 1: Core Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StrategicKpi
          label={t.totalSuppliers}
          value={totalFornecedores}
          icon={<Building2 className="w-5 h-5" />}
          accent="text-orange-400"
          glow="bg-orange-500/15"
          active={userFilter === 'todos'}
          onClick={() => setUserFilter('todos')}
          subtitle={`${totalOrdens} ${t.orders}`}
        />
        <StrategicKpi
          label={t.evaluations}
          value={totalAvaliacoes}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="text-emerald-400"
          glow="bg-emerald-500/15"
          active={userFilter === 'avaliados'}
          onClick={() => setUserFilter('avaliados')}
          subtitle={`${pctConcluido}% ${t.completedPct}`}
          trend={avaliacaoTrend ?? undefined}
          trendLabel={avaliacaoTrend !== null ? t.ofTotal : undefined}
        />
        <StrategicKpi
          label={t.pendingKpi}
          value={pendentes}
          icon={<Clock className="w-5 h-5" />}
          accent="text-amber-300"
          glow="bg-amber-500/15"
          active={userFilter === 'pendentes'}
          onClick={() => setUserFilter('pendentes')}
          subtitle={`${totalFornecedores > 0 ? 100 - pctConcluido : 0}% ${t.ofTotal}`}
        />
        <StrategicKpi
          label={t.generalAverageKpi}
          value={mediaGeral > 0 ? mediaGeral.toFixed(1) : '—'}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="text-orange-300"
          glow="bg-orange-500/15"
          subtitle={`${medias.length} ${t.evaluationsCount}`}
          trend={cicloTrend ?? undefined}
          trendLabel={cicloTrend !== null ? t.ofTotal : undefined}
        />
      </div>

      {/* Strategic KPIs - Row 2: Advanced Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StrategicKpi
          label="Taxa de Aprovação"
          value={`${taxaAprovacao}%`}
          icon={<Trophy className="w-5 h-5" />}
          accent="text-emerald-400"
          glow="bg-emerald-500/15"
          active={userFilter === 'otimos'}
          onClick={() => setUserFilter('otimos')}
          subtitle={`${otimos} fornecedores ótimos`}
        />
        <StrategicKpi
          label={t.riskIndex}
          value={`${taxaRisco}%`}
          icon={<ShieldAlert className="w-5 h-5" />}
          accent="text-red-400"
          glow="bg-red-500/15"
          active={userFilter === 'ruins'}
          onClick={() => setUserFilter('ruins')}
          subtitle={`${ruins} fornecedores de risco`}
        />
        <StrategicKpi
          label={t.consistencyKpi}
          value={`${consistencia}%`}
          icon={<Gauge className="w-5 h-5" />}
          accent="text-cyan-400"
          glow="bg-cyan-500/15"
          subtitle={`Desvio: ${desvioPadrao.toFixed(2)}`}
        />
        <StrategicKpi
          label="Cobertura de Compras"
          value={`${indiceCobertura}%`}
          icon={<ShieldCheck className="w-5 h-5" />}
          accent="text-blue-400"
          glow="bg-blue-500/15"
          active={userFilter === 'descobertos'}
          onClick={() => setUserFilter('descobertos')}
          subtitle={`${ordensDescobertas} ordens descobertas`}
          progress={indiceCobertura}
        />
      </div>

      {userFilter !== 'todos' && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{t.activeFilter}</span>
          <span className="font-medium text-primary capitalize">{userFilter}</span>
          <button onClick={() => setUserFilter('todos')} className="text-muted-foreground hover:text-foreground underline">{t.clear}</button>
        </div>
      )}

      {/* Visual Analytics Row: Donut + Gauge + Risk Matrix */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="brand-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t.evaluationDistribution}</h3>
            </div>
            <RatingDonut otimos={otimos} bons={bons} ruins={ruins} total={avaliadosCount} />
          </CardContent>
        </Card>

        <Card className="brand-card shadow-sm">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-4 self-start">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t.cycleProgress}</h3>
            </div>
            <CompletionGauge pct={pctConcluido} />
            <div className="mt-4 grid grid-cols-2 gap-3 w-full">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                <p className="text-xs text-muted-foreground">{t.completed}</p>
                <p className="text-xl font-bold text-emerald-400 tabular-nums">{avaliadosCount}</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                <p className="text-xs text-muted-foreground">{t.remaining}</p>
                <p className="text-xl font-bold text-amber-400 tabular-nums">{pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="brand-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t.riskMatrix}</h3>
            </div>
            <RiskMatrix fornecedores={fornecedores} />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 h-auto">
          <TabsTrigger value="usuarios" className="text-xs sm:text-sm">{t.userProgress.split(' ')[0]}</TabsTrigger>
          <TabsTrigger value="fornecedores" className="text-xs sm:text-sm">{t.allSuppliers.split(' ')[0]}</TabsTrigger>
          <TabsTrigger value="commodities" className="text-xs sm:text-sm">{t.commodityPerformance.split(' ')[0]}</TabsTrigger>
          <TabsTrigger value="owners" className="text-xs sm:text-sm">{t.ownerPerformance.split(' ')[0]}</TabsTrigger>
          <TabsTrigger value="acessos" className="text-xs sm:text-sm">{t.accesses}</TabsTrigger>
          <TabsTrigger value="ciclos" className="text-xs sm:text-sm">{t.cycleEvolution.split(' ')[0]}</TabsTrigger>
        </TabsList>

        {/* Por Usuário */}
        <TabsContent value="usuarios" className="mt-4">
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                {t.userProgress} — {t.cycle} {cicloAtual}
              </CardTitle>
              <CardDescription>
                {t.userProgressDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUsuarios.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.noUserFound}</p>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead>{t.idUser}</TableHead>
                          <TableHead>{t.ownersCol}</TableHead>
                          <TableHead className="text-right">{t.suppliersCol}</TableHead>
                          <TableHead className="text-right">{t.evaluatedCol}</TableHead>
                          <TableHead className="text-right">{t.pendingCol}</TableHead>
                          <TableHead className="min-w-[120px]">{t.progress}</TableHead>
                          <TableHead className="text-right">{t.averageCol}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsuarios.map((u) => (
                          <TableRow key={u.id_usuario}>
                            <TableCell className="font-medium">{u.id_usuario}</TableCell>
                            <TableCell>
                              {u.owners.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {u.owners.map((o) => (
                                    <span key={o} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                                      {o}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{u.totalFornecedores}</TableCell>
                            <TableCell className="text-right tabular-nums text-emerald-400 font-medium">{u.avaliados}</TableCell>
                            <TableCell className="text-right tabular-nums text-amber-300 font-medium">{u.pendentes}</TableCell>
                            <TableCell>
                              <ProgressoBar avaliados={u.avaliados} total={u.totalFornecedores} />
                            </TableCell>
                            <TableCell className="text-right">
                              <ClassificacaoBadge media={u.mediaGeral} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fornecedores */}
        <TabsContent value="fornecedores" className="mt-4 space-y-4">
          {/* Strategic Supplier View */}
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                {t.strategicSupplierView}
              </CardTitle>
              <CardDescription>
                {t.strategicSupplierDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StrategicSupplierView fornecedores={fornecedores} />
            </CardContent>
          </Card>

          {/* Full list */}
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                {t.allSuppliers}
              </CardTitle>
              <CardDescription>
                {t.allSuppliersDesc.replace('{shown}', String(filteredFornecedores.length)).replace('{total}', String(fornecedores.length))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Select value={filterCommodity} onValueChange={setFilterCommodity}>
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Commodity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allCommoditiesFilter}</SelectItem>
                    {commodityOptions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterOwner} onValueChange={setFilterOwner}>
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allOwnersFilter}</SelectItem>
                    {ownerOptions.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>{t.supplier}</TableHead>
                        <TableHead>{t.colCnpjCpf}</TableHead>
                        <TableHead>{t.commodity}</TableHead>
                        <TableHead>{t.ownerCol}</TableHead>
                        <TableHead className="text-right">{t.evaluationsCol}</TableHead>
                        <TableHead className="text-right">{t.averageCol}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFornecedores
                        .slice(fornPage * fornPageSize, (fornPage + 1) * fornPageSize)
                        .map((f) => (
                        <TableRow key={f.codigo_fornecedor}>
                          <TableCell className="font-medium">{f.nome_clas || f.razao_social}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{f.cnpj_cpf || f.codigo_fornecedor}</TableCell>
                          <TableCell className="text-xs">{f.commodities || '—'}</TableCell>
                          <TableCell className="text-xs">{f.owner || '—'}</TableCell>
                          <TableCell className="text-right tabular-nums">{f.totalAvaliacoes}</TableCell>
                          <TableCell className="text-right">
                            <ClassificacaoBadge media={f.mediaGeral} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {filteredFornecedores.length > fornPageSize && (
                  <div className="flex items-center justify-between px-2 pt-3">
                    <span className="text-xs text-muted-foreground">
                      {fornPage * fornPageSize + 1}–{Math.min((fornPage + 1) * fornPageSize, filteredFornecedores.length)} de {filteredFornecedores.length}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={fornPage === 0}
                        onClick={() => setFornPage(fornPage - 1)}
                      >
                        {t.previous}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(fornPage + 1) * fornPageSize >= filteredFornecedores.length}
                        onClick={() => setFornPage(fornPage + 1)}
                      >
                        {t.next}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commodities */}
        <TabsContent value="commodities" className="mt-4">
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                {t.commodityPerformance}
              </CardTitle>
              <CardDescription>
                {t.commodityPerformanceDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {commodities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.noCommodities}</p>
              ) : (
                <>
                  <CommodityPerformanceChart commodities={commodities} />
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.commodity}</TableHead>
                          <TableHead className="text-right">{t.suppliersCol}</TableHead>
                          <TableHead className="text-right">{t.evaluationsCol}</TableHead>
                          <TableHead className="text-right">{t.averageCol}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commodities.map((c) => (
                          <TableRow key={c.commodity}>
                            <TableCell className="font-medium">{c.commodity}</TableCell>
                            <TableCell className="text-right tabular-nums">{c.totalFornecedores}</TableCell>
                            <TableCell className="text-right tabular-nums">{c.totalAvaliacoes}</TableCell>
                            <TableCell className="text-right">
                              <ClassificacaoBadge media={c.mediaGeral} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Owners */}
        <TabsContent value="owners" className="mt-4">
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                {t.ownerPerformance}
              </CardTitle>
              <CardDescription>
                {t.ownerPerformanceDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {owners.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.noOwners}</p>
              ) : (
                <>
                  <OwnerPerformanceChart owners={owners} />
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.ownerCol}</TableHead>
                          <TableHead className="text-right">{t.suppliersCol}</TableHead>
                          <TableHead className="text-right">{t.evaluationsCol}</TableHead>
                          <TableHead className="text-right">{t.averageCol}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {owners.map((o) => (
                          <TableRow key={o.owner}>
                            <TableCell className="font-medium">{o.owner}</TableCell>
                            <TableCell className="text-right tabular-nums">{o.totalFornecedores}</TableCell>
                            <TableCell className="text-right tabular-nums">{o.totalAvaliacoes}</TableCell>
                            <TableCell className="text-right">
                              <ClassificacaoBadge media={o.mediaGeral} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ciclos */}
        <TabsContent value="ciclos" className="mt-4">
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {t.cycleEvolution}
              </CardTitle>
              <CardDescription>
                {t.cycleEvolutionDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ciclos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.noCycles}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.cycle}</TableHead>
                      <TableHead className="text-right">{t.suppliersCol}</TableHead>
                      <TableHead className="text-right">{t.evaluationsCol}</TableHead>
                      <TableHead className="text-right">{t.averageCol}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ciclos.map((c) => (
                      <TableRow key={c.ciclo} className={c.ciclo === cicloAtual ? 'bg-primary/5' : ''}>
                        <TableCell className="font-medium">
                          {c.ciclo}
                          {c.ciclo === cicloAtual && (
                            <span className="ml-2 text-xs text-primary font-normal">({t.current})</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{c.totalFornecedores}</TableCell>
                        <TableCell className="text-right tabular-nums">{c.totalAvaliacoes}</TableCell>
                        <TableCell className="text-right">
                          <ClassificacaoBadge media={c.mediaGeral} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Acessos Tab */}
        <TabsContent value="acessos" className="mt-4">
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                {t.accessHistory}
              </CardTitle>
              <CardDescription>
                {t.accessHistoryDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {acessos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.noAccessRegistered}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.user}</TableHead>
                      <TableHead className="text-right">{t.dateAndTime}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {acessos.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.id_usuario}</TableCell>
                        <TableCell className="text-right text-sm">
                          {new Date(a.data_hora).toLocaleString(locale, {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
