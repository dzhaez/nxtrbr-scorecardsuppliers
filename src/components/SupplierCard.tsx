import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle2, Clock, Lock } from 'lucide-react';
import { classificacaoMedia, type SupplierWithOrders } from '@/lib/supabase';
import { useI18n } from '@/i18n/LanguageContext';

interface SupplierCardProps {
  supplier: SupplierWithOrders;
  onAvaliar: (supplier: SupplierWithOrders) => void;
  canEvaluate: boolean;
}

export default function SupplierCard({ supplier, onAvaliar, canEvaluate }: SupplierCardProps) {
  const { t } = useI18n();
  const classif = supplier.avaliacao
    ? classificacaoMedia(supplier.avaliacao.media, {
        poor: t.classificationPoor,
        good: t.classificationGood,
        excellent: t.classificationExcellent,
      })
    : null;

  return (
    <Card className="brand-card shadow-sm hover:shadow-md transition-all animate-slide-up overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: supplier info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {supplier.ordens.map((o) => (
                <span key={o.id} className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                  {t.ord} {o.ordem_compra}
                </span>
              ))}
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {supplier.cnpj_cpf || supplier.codigo_fornecedor}
              </span>
              {supplier.nome_clas && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {supplier.nome_clas}
                </span>
              )}
              {supplier.status === 'avaliado' ? (
                <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {t.evaluatedBadge}
                </Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/20">
                  <Clock className="w-3 h-3 mr-1" /> {t.pendingBadge}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate" title={supplier.razao_social}>
              {supplier.razao_social}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              {supplier.commodities && (
                <span className="text-xs">{supplier.commodities}</span>
              )}
              {supplier.loc_emb && (
                <span className="text-xs">{t.loc}: {supplier.loc_emb}</span>
              )}
              {supplier.owner && (
                <span className="text-xs">{t.owner}: {supplier.owner}</span>
              )}
              {classif && (
                <span className={`flex items-center gap-1 font-medium ${classif.color}`}>
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {supplier.avaliacao!.media.toFixed(1)} - {classif.label}
                </span>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            {supplier.status === 'avaliado' ? (
              <Button size="sm" variant="secondary" disabled>
                <CheckCircle2 className="w-4 h-4 mr-1" /> {t.evaluatedBtn}
              </Button>
            ) : canEvaluate ? (
              <Button size="sm" onClick={() => onAvaliar(supplier)}>
                <Star className="w-4 h-4 mr-1" /> {t.evaluate}
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled title={t.pendingBadge}>
                <Lock className="w-4 h-4 mr-1" /> {t.evaluate}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
