import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Mail, RefreshCw, AlertCircle, CheckCircle2, Gauge, Clock, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { setting } from '@/lib/config';
import { useI18n } from '@/i18n/LanguageContext';

export interface SlaIndicator {
  owner: string;
  email: string | null;
  total_suppliers: number;
  avaliados: number;
  pendentes: number;
  percentual_concluido: number;
  fornecedores_aguardando: number;
  dias_sem_avaliacao: number | null;
  ultimo_ciclo_import: string | null;
}

interface SlaPanelProps {
  ciclo: string;
}

export default function SlaPanel({ ciclo }: SlaPanelProps) {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<SlaIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSla = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_sla_indicators', {
      p_ciclo: ciclo || null,
    });
    if (error) {
      console.error('Failed to load SLA indicators:', error);
      setRows([]);
    } else {
      setRows((data as SlaIndicator[]) || []);
    }
    setLoading(false);
  }, [ciclo]);

  useEffect(() => {
    loadSla();
  }, [loadSla]);

  async function handleSend(owner: string) {
    setSending(owner);
    setMsg(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('no_session');
      const url = `${setting('VITE_SUPABASE_URL')}/functions/v1/sla-email`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ciclo: ciclo || null, owner }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const body = await res.json();
      if (body.enviados > 0) {
        setMsg({ type: 'success', text: t.slaEmailSent.replace('{owner}', owner) });
      } else {
        const first = body.results?.[0];
        const reason = first?.skipped === 'sem_email'
          ? t.slaNoEmail
          : first?.skipped === 'sem_pendencias'
            ? t.slaNoPending
            : first?.error === 'email_nao_configurado'
              ? t.slaEmailNotConfigured
              : t.slaSendError;
        setMsg({ type: 'error', text: reason });
      }
    } catch (err) {
      console.error('SLA e-mail failed:', err);
      setMsg({ type: 'error', text: t.slaSendError });
    } finally {
      setSending(null);
    }
  }

  const totals = rows.reduce(
    (acc, r) => ({
      total: acc.total + Number(r.total_suppliers),
      avaliados: acc.avaliados + Number(r.avaliados),
      pendentes: acc.pendentes + Number(r.pendentes),
    }),
    { total: 0, avaliados: 0, pendentes: 0 },
  );
  const overallPct = totals.total > 0 ? Math.round((100 * totals.avaliados) / totals.total) : 0;
  const critical = rows.filter((r) => Number(r.pendentes) > 0 && (r.dias_sem_avaliacao ?? 0) >= 15).length;

  function pctColor(pct: number): string {
    if (pct >= 100) return 'text-emerald-500';
    if (pct >= 50) return 'text-amber-500';
    return 'text-red-500';
  }

  function slaColor(days: number | null): string {
    if (days === null) return 'text-muted-foreground';
    if (days >= 15) return 'text-red-500';
    if (days >= 7) return 'text-amber-500';
    return 'text-emerald-500';
  }

  return (
    <div className="grid gap-6">
      <Card className="brand-card shadow-lg animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            {t.slaPanelTitle}
          </CardTitle>
          <CardDescription>{t.slaPanelDesc}{ciclo ? ` — ${t.cycle}: ${ciclo}` : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t.slaNoData}</p>
          ) : (
            <>
              {msg && (
                <div className={`flex items-start gap-2 p-3 rounded-lg text-sm mb-4 animate-fade-in ${
                  msg.type === 'success'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {msg.type === 'success'
                    ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                  <span>{msg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Users className="w-3.5 h-3.5" /> {t.slaOwnersCount}
                  </div>
                  <div className="text-2xl font-bold text-foreground">{rows.length}</div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Gauge className="w-3.5 h-3.5" /> {t.slaOverallProgress}
                  </div>
                  <div className={`text-2xl font-bold ${pctColor(overallPct)}`}>{overallPct}%</div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Clock className="w-3.5 h-3.5" /> {t.slaCriticalOwners}
                  </div>
                  <div className="text-2xl font-bold text-red-500">{critical}</div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Mail className="w-3.5 h-3.5" /> {t.slaPendingTotal}
                  </div>
                  <div className="text-2xl font-bold text-amber-500">{totals.pendentes}</div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{t.slaByOwner}</p>
                <Button variant="outline" size="sm" onClick={loadSla}>
                  <RefreshCw className="w-4 h-4 mr-2" /> {t.refresh}
                </Button>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <div className="max-h-[540px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>{t.owner}</TableHead>
                        <TableHead>{t.colEmail}</TableHead>
                        <TableHead className="text-center">{t.slaProgress}</TableHead>
                        <TableHead className="text-center">{t.slaEvaluated}</TableHead>
                        <TableHead className="text-center">{t.slaDaysWithout}</TableHead>
                        <TableHead className="text-right">{t.slaSendReminder}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => {
                        const pct = Number(r.percentual_concluido);
                        return (
                          <TableRow key={r.owner}>
                            <TableCell className="font-medium">{r.owner}</TableCell>
                            <TableCell className="text-xs">
                              {r.email || <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="min-w-[140px]">
                              <div className="flex items-center gap-2">
                                <Progress value={pct} className="h-2 flex-1" />
                                <span className={`text-xs font-semibold w-10 text-right ${pctColor(pct)}`}>
                                  {pct}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {r.avaliados}/{r.total_suppliers}
                            </TableCell>
                            <TableCell className={`text-center text-sm font-semibold ${slaColor(r.dias_sem_avaliacao)}`}>
                              {r.dias_sem_avaliacao ?? '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={sending !== null || !r.email}
                                onClick={() => handleSend(r.owner)}
                                title={!r.email ? t.slaNoEmail : undefined}
                              >
                                {sending === r.owner ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Mail className="w-4 h-4 mr-1" />
                                )}
                                {t.slaSendReminder}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
