import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase, classificacaoMedia } from '@/lib/supabase';
import { useI18n } from '@/i18n/LanguageContext';

interface CicloListItem {
  ciclo: string;
  data_importacao: string;
}

interface SupplierCycleScore {
  codigo_fornecedor: string;
  ciclo: string;
  media: number | string;
}

interface OrdemCicloRef {
  codigo_fornecedor: string;
  ciclo: string;
}

interface CycleSummary {
  ciclo: string;
  dataImportacao: string;
  totalFornecedores: number;
  avaliados: number;
  media: number | null;
}

interface CyclesPanelProps {
  onViewResults: (ciclo: string) => void;
  onCycleRemoved: () => void;
}

export default function CyclesPanel({ onViewResults, onCycleRemoved }: CyclesPanelProps) {
  const { t, locale } = useI18n();
  const [summaries, setSummaries] = useState<CycleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removalError, setRemovalError] = useState(false);
  const [removedNotice, setRemovedNotice] = useState<string | null>(null);

  const loadSummaries = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    const [ciclosRes, scoresRes, ordensRes] = await Promise.all([
      supabase.rpc('list_ciclos'),
      supabase.rpc('get_supplier_cycle_history'),
      supabase.from('ordens_compra').select('codigo_fornecedor, ciclo'),
    ]);
    if (ciclosRes.error || scoresRes.error || ordensRes.error) {
      console.error('Failed to load cycles summary:', ciclosRes.error ?? scoresRes.error ?? ordensRes.error);
      setLoadFailed(true);
      setLoading(false);
      return;
    }

    const ciclos = (ciclosRes.data ?? []) as CicloListItem[];
    const scores = (scoresRes.data ?? []) as SupplierCycleScore[];
    const ordens = (ordensRes.data ?? []) as OrdemCicloRef[];

    const suppliersByCiclo = new Map<string, Set<string>>();
    for (const o of ordens) {
      if (!suppliersByCiclo.has(o.ciclo)) suppliersByCiclo.set(o.ciclo, new Set());
      suppliersByCiclo.get(o.ciclo)!.add(o.codigo_fornecedor);
    }
    const mediasByCiclo = new Map<string, number[]>();
    for (const s of scores) {
      if (!mediasByCiclo.has(s.ciclo)) mediasByCiclo.set(s.ciclo, []);
      mediasByCiclo.get(s.ciclo)!.push(Number(s.media));
    }

    setSummaries(
      ciclos.map((c) => {
        const medias = mediasByCiclo.get(c.ciclo) ?? [];
        const media = medias.length > 0 ? medias.reduce((acc, v) => acc + v, 0) / medias.length : null;
        return {
          ciclo: c.ciclo,
          dataImportacao: c.data_importacao,
          totalFornecedores: suppliersByCiclo.get(c.ciclo)?.size ?? 0,
          avaliados: medias.length,
          media: media === null ? null : Math.round(media * 100) / 100,
        };
      }),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  async function handleConfirmRemoval() {
    if (!pendingRemoval) return;
    setRemoving(true);
    setRemovalError(false);
    const { error } = await supabase.rpc('admin_delete_ciclo', { p_ciclo: pendingRemoval });
    setRemoving(false);
    if (error) {
      console.error('Failed to remove cycle:', error);
      setRemovalError(true);
      return;
    }
    setRemovedNotice(pendingRemoval);
    setPendingRemoval(null);
    onCycleRemoved();
    await loadSummaries();
  }

  function formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(locale);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">{t.cyclesTitle}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t.cyclesDesc}</p>
      </div>

      {removedNotice && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-foreground">
          {t.cycleRemoved.replace('{ciclo}', removedNotice)}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : loadFailed ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {t.cyclesLoadError}
        </div>
      ) : summaries.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">{t.cyclesEmpty}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map((s) => {
            const progress = s.totalFornecedores > 0 ? Math.round((s.avaliados / s.totalFornecedores) * 100) : 0;
            const classe = s.media === null
              ? null
              : classificacaoMedia(s.media, { poor: t.classificationPoor, good: t.classificationGood, excellent: t.classificationExcellent });
            return (
              <Card key={s.ciclo} className="transition-shadow hover:shadow-md">
                <CardContent className="p-5 space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t.cycleImportedOn} {formatDate(s.dataImportacao)}</p>
                      <h3 className="text-xl font-semibold text-foreground">{t.cycle} {s.ciclo}</h3>
                    </div>
                    {classe && (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${classe.bg} ${classe.color}`}>
                        {classe.label}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-semibold text-foreground">{s.totalFornecedores}</p>
                        <p className="text-xs text-muted-foreground">{t.cycleSuppliers}</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">{s.avaliados}</p>
                        <p className="text-xs text-muted-foreground">{t.cycleEvaluated}</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">{s.media === null ? '-' : s.media.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{t.cycleAvgScore}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => onViewResults(s.ciclo)}>
                      {t.cycleViewResults} <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setRemovalError(false);
                        setPendingRemoval(s.ciclo);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" /> {t.cycleRemove}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={pendingRemoval !== null} onOpenChange={(open) => { if (!open && !removing) setPendingRemoval(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.cycleRemoveTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemoval ? t.cycleRemoveConfirm.replace('{ciclo}', pendingRemoval) : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {removalError && (
            <p className="text-sm text-destructive">{t.cycleRemoveError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={removing}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmRemoval();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {t.cycleRemove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
