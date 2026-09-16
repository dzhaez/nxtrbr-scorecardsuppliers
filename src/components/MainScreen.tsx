import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LogOut, Search, Loader2, Settings, RefreshCw, Clock, CheckCircle2, Filter } from 'lucide-react';
import { supabase, type SupplierWithOrders, type SortField, type OrdemCompra, type Avaliacao } from '@/lib/supabase';
import Dashboard, { type KpiFilter } from './Dashboard';
import SupplierCard from './SupplierCard';
import { useI18n } from '@/i18n/LanguageContext';
const EvaluationForm = lazy(() => import('./EvaluationForm'));

interface MainScreenProps {
  userId: string;
  isAdmin: boolean;
  onLogout: () => void;
}

export default function MainScreen({ userId, isAdmin, onLogout }: MainScreenProps) {
  const { t } = useI18n();
  const [suppliers, setSuppliers] = useState<SupplierWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('ordem');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [evaluatingSupplier, setEvaluatingSupplier] = useState<SupplierWithOrders | null>(null);
  const [currentCiclo, setCurrentCiclo] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>('todos');
  const [filterCommodity, setFilterCommodity] = useState<string>('all');

  const [filterStatus, setFilterStatus] = useState<'all' | 'avaliado' | 'pendente'>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: cicloAtual } = await supabase.rpc('get_ciclo_atual');

      const ciclo = (cicloAtual as string | null) || '';
      setCurrentCiclo(ciclo);

      if (!ciclo) {
        setSuppliers([]);
        setLoading(false);
        return;
      }

      // Non-admin users only see orders assigned to their exact id_usuario.
      let ordensQuery = supabase.from('ordens_compra').select('*').eq('ciclo', ciclo);
      if (!isAdmin) {
        ordensQuery = ordensQuery.eq('id_usuario', userId);
      }
      const [ordensRes, avaliacoesRes] = await Promise.all([
        ordensQuery,
        supabase.from('avaliacoes').select('*').eq('ciclo', ciclo),
      ]);
      if (ordensRes.error) throw ordensRes.error;
      if (avaliacoesRes.error) throw avaliacoesRes.error;
      const ordens = ordensRes.data || [];
      const avaliacoes = avaliacoesRes.data || [];

      const avalMap = new Map<string, Avaliacao>();
      (avaliacoes || []).forEach((a) => {
        // Keep the first evaluation found per supplier
        if (!avalMap.has(a.codigo_fornecedor)) {
          avalMap.set(a.codigo_fornecedor, a);
        }
      });

      // Group by supplier
      const supplierMap = new Map<string, { razao_social: string; cnpj_cpf: string | null; nome_clas: string | null; commodities: string | null; loc_emb: string | null; owner: string | null; ordens: OrdemCompra[] }>();
      (ordens || []).forEach((o) => {
        if (!supplierMap.has(o.codigo_fornecedor)) {
          supplierMap.set(o.codigo_fornecedor, { razao_social: '', cnpj_cpf: null, nome_clas: null, commodities: null, loc_emb: null, owner: null, ordens: [] });
        }
        const entry = supplierMap.get(o.codigo_fornecedor)!;
        entry.ordens.push(o);
      });

      // Fetch supplier details
      const codigos = Array.from(supplierMap.keys());
      if (codigos.length > 0) {
        const { data: fornData } = await supabase
          .from('fornecedores')
          .select('*')
          .in('codigo_fornecedor', codigos);
        (fornData || []).forEach((f) => {
          const entry = supplierMap.get(f.codigo_fornecedor);
          if (entry) {
            entry.razao_social = f.razao_social;
            entry.cnpj_cpf = f.cnpj_cpf;
            entry.nome_clas = f.nome_clas;
            entry.commodities = f.commodities;
            entry.loc_emb = f.loc_emb;
            entry.owner = f.owner;
          }
        });
      }

      const result: SupplierWithOrders[] = codigos.map((codigo) => {
        const entry = supplierMap.get(codigo)!;
        const aval = avalMap.get(codigo);
        return {
          codigo_fornecedor: codigo,
          razao_social: entry.razao_social,
          cnpj_cpf: entry.cnpj_cpf,
          nome_clas: entry.nome_clas,
          commodities: entry.commodities,
          loc_emb: entry.loc_emb,
          owner: entry.owner,
          ordens: entry.ordens,
          totalOrdens: entry.ordens.length,
          status: aval ? 'avaliado' : 'pendente',
          avaliacao: aval,
        };
      });

      setSuppliers(result);
    } catch (error) {
      console.error('Failed to load supplier data:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAndSorted = useMemo(() => {
    let result = [...suppliers];
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (s) =>
          s.razao_social.toLowerCase().includes(q) ||
          s.codigo_fornecedor.toLowerCase().includes(q),
      );
    }
    // Apply commodity filter
    if (filterCommodity !== 'all') {
      result = result.filter((s) => s.commodities === filterCommodity);
    }
    // Apply owner filter
    if (filterOwner !== 'all') {
      result = result.filter((s) => s.owner === filterOwner);
    }
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter((s) => s.status === filterStatus);
    }
    // Apply KPI auto-filter
    switch (kpiFilter) {
      case 'avaliados':
        result = result.filter((s) => s.status === 'avaliado');
        break;
      case 'pendentes':
        result = result.filter((s) => s.status === 'pendente');
        break;
      case 'otimos':
        result = result.filter((s) => s.status === 'avaliado' && (s.avaliacao?.media ?? 0) >= 4.0);
        break;
      case 'bons':
        result = result.filter((s) => {
          const m = s.avaliacao?.media ?? 0;
          return s.status === 'avaliado' && m >= 2.0 && m < 4.0;
        });
        break;
      case 'ruins':
        result = result.filter((s) => s.status === 'avaliado' && (s.avaliacao?.media ?? 0) < 2.0);
        break;
      case 'todos':
      default:
        break;
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'nome':
          cmp = a.razao_social.localeCompare(b.razao_social);
          break;
        case 'codigo':
          cmp = a.codigo_fornecedor.localeCompare(b.codigo_fornecedor);
          break;
        case 'ordens':
          cmp = a.totalOrdens - b.totalOrdens;
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'ordem': {
          const maxOrdem = (s: SupplierWithOrders) =>
            Math.max(0, ...s.ordens.map((o) => parseInt(o.ordem_compra, 10) || 0));
          cmp = maxOrdem(a) - maxOrdem(b);
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [suppliers, search, sortField, sortDir, kpiFilter, filterCommodity, filterStatus, filterOwner]);

  const commodityOptions = useMemo(
    () => Array.from(new Set(suppliers.map((s) => s.commodities).filter(Boolean))) as string[],
    [suppliers],
  );
  const ownerOptions = useMemo(
    () => Array.from(new Set(suppliers.map((s) => s.owner).filter(Boolean))) as string[],
    [suppliers],
  );
  const pendentes = useMemo(() =>
    filteredAndSorted.filter((s) => s.status === 'pendente').sort((a, b) => b.totalOrdens - a.totalOrdens),
    [filteredAndSorted],
  );
  const avaliadosList = useMemo(
    () => filteredAndSorted.filter((s) => s.status === 'avaliado'),
    [filteredAndSorted],
  );
  const showSections = kpiFilter === 'todos' || kpiFilter === 'pendentes' || kpiFilter === 'avaliados';

  const supplierCanEvaluate = useMemo(() => {
    const map = new Map<string, boolean>();
    const uid = userId.toLowerCase();
    for (const s of suppliers) {
      map.set(s.codigo_fornecedor, s.ordens.some((o) => o.id_usuario.toLowerCase() === uid));
    }
    return map;
  }, [suppliers, userId]);

  function toggleSortDir() {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
  }

  return (
    <div className="brand-shell">
      {/* Header */}
      <header className="brand-header border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/images-removebg-preview.png"
              alt="Nexteer Automotive"
              className="h-12 w-auto object-contain shrink-0"
            />
            <div className="min-w-0 flex flex-col">
              <h1 className="text-xl font-bold text-foreground leading-tight tracking-tight">
                Scorecard Indirect Suppliers
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">{userId}</span>
                {currentCiclo && <span>· {t.cycle} {currentCiclo}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" onClick={handleRefresh} title={t.refresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('navigate-admin'))}>
                <Settings className="w-4 h-4 mr-1.5" /> {t.admin}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-1.5" /> {t.logout}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Dashboard */}
        <Dashboard suppliers={suppliers} activeFilter={kpiFilter} onFilterChange={setKpiFilter} />

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filterCommodity} onValueChange={setFilterCommodity}>
              <SelectTrigger className="w-40 h-10">
                <SelectValue placeholder="Commodity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allCommodities}</SelectItem>
                {commodityOptions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterOwner} onValueChange={setFilterOwner}>
              <SelectTrigger className="w-40 h-10">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allOwnersFilter}</SelectItem>
                {ownerOptions.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'avaliado' | 'pendente')}>
              <SelectTrigger className="w-32 h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.statusAll}</SelectItem>
                <SelectItem value="pendente">{t.statusPending}</SelectItem>
                <SelectItem value="avaliado">{t.statusEvaluated}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
              <SelectTrigger className="w-36 h-10">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ordem">{t.sortCode}</SelectItem>
                <SelectItem value="ordens">{t.sortOrders}</SelectItem>
                <SelectItem value="nome">{t.sortName}</SelectItem>
                <SelectItem value="codigo">{t.sortCode}</SelectItem>
                <SelectItem value="status">{t.sortStatus}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={toggleSortDir} title={sortDir === 'asc' ? t.ascending : t.descending}>
              {sortDir === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {/* Supplier list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">{t.loadingSuppliers}</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              {suppliers.length === 0
                ? t.noSuppliersForUser
                : t.noSuppliersMatchSearch}
            </p>
          </div>
        ) : showSections ? (
          <div className="space-y-6">
            {/* Pendentes */}
            {(kpiFilter === 'todos' || kpiFilter === 'pendentes') && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-foreground">
                    {t.pendingEvaluation}
                  </h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {pendentes.length}
                  </span>
                </div>
                {pendentes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t.allCaughtUp}</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {pendentes.map((s) => (
                      <SupplierCard key={s.codigo_fornecedor} supplier={s} onAvaliar={setEvaluatingSupplier} canEvaluate={supplierCanEvaluate.get(s.codigo_fornecedor) ?? false} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Avaliados */}
            {(kpiFilter === 'todos' || kpiFilter === 'avaliados') && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-foreground">
                    {t.evaluatedSuppliers}
                  </h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {avaliadosList.length}
                  </span>
                </div>
                {avaliadosList.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t.noSuppliersEvaluated}</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {avaliadosList.map((s) => (
                      <SupplierCard key={s.codigo_fornecedor} supplier={s} onAvaliar={setEvaluatingSupplier} canEvaluate={supplierCanEvaluate.get(s.codigo_fornecedor) ?? false} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredAndSorted.map((s) => (
              <SupplierCard key={s.codigo_fornecedor} supplier={s} onAvaliar={setEvaluatingSupplier} canEvaluate={supplierCanEvaluate.get(s.codigo_fornecedor) ?? false} />
            ))}
          </div>
        )}
      </div>

      {/* Evaluation modal */}
      {evaluatingSupplier && (
        <Suspense fallback={null}>
          <EvaluationForm
            supplier={evaluatingSupplier}
            userId={userId}
            ciclo={currentCiclo}
            onClose={() => setEvaluatingSupplier(null)}
            onSaved={() => {
              setEvaluatingSupplier(null);
              loadData();
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
