import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, ArrowLeft, Loader2, CheckCircle2, AlertCircle, History, BarChart3, Shield, UserPlus, Trash2 } from 'lucide-react';
import { supabase, gerarCiclo, type Importacao, type Acesso } from '@/lib/supabase';
import { setting } from '@/lib/config';

import { useI18n } from '@/i18n/LanguageContext';
const ManagementPanel = lazy(() => import('./ManagementPanel'));

interface AdminScreenProps {
  onBack: () => void;
}

interface ParsedRow {
  ord: string;
  locEmb: string;
  nomeClas: string;
  cnpjCpf: string;
  commodities: string;
  idUsuario: string;
  owner: string;
}

interface AdminAuthorization {
  entra_tenant_id: string;
  entra_oid: string;
  entra_display_name: string | null;
  authorized_by: string | null;
  created_at: string;
}

interface AuditEntry {
  id: string;
  action: string;
  target_oid: string;
  target_tenant_id: string;
  actor_id: string | null;
  actor_id_usuario: string | null;
  created_at: string;
}

export default function AdminScreen({ onBack }: AdminScreenProps) {
  const { t, locale } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ step: string; current: number; total: number } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importacoes, setImportacoes] = useState<Importacao[]>([]);
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentCiclo, setCurrentCiclo] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [adminAuths, setAdminAuths] = useState<AdminAuthorization[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [newAdminOid, setNewAdminOid] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMsg, setAdminMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const entraTenantId = setting('VITE_ENTRA_TENANT_ID');

  const loadCicloAtual = useCallback(async () => {
    const { data } = await supabase
      .from('importacoes')
      .select('ciclo')
      .order('data_importacao', { ascending: false })
      .limit(1)
      .maybeSingle();
    setCurrentCiclo(data?.ciclo || '');
  }, []);


  useEffect(() => {
    loadCicloAtual();
  }, [loadCicloAtual]);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('importacoes')
      .select('*')
      .order('data_importacao', { ascending: false });
    setImportacoes(data || []);
  }, []);

  const loadAcessos = useCallback(async () => {
    const { data } = await supabase
      .from('acessos')
      .select('*')
      .order('data_hora', { ascending: false })
      .limit(200);
    setAcessos(data || []);
  }, []);

  const loadAdminAuths = useCallback(async () => {
    const { data, error } = await supabase.rpc('list_admin_authorizations');
    if (error) {
      console.error('Failed to load admin authorizations:', error);
      return;
    }
    setAdminAuths((data as AdminAuthorization[]) || []);
  }, []);

  const loadAuditLog = useCallback(async () => {
    const { data, error } = await supabase.rpc('list_admin_audit_log', { p_limit: 100 });
    if (error) {
      console.error('Failed to load audit log:', error);
      return;
    }
    setAuditEntries((data as AuditEntry[]) || []);
  }, []);

  async function handleAddAdmin() {
    if (!newAdminOid.trim()) return;
    setAdminBusy(true);
    setAdminMsg(null);
    try {
      const { error } = await supabase.rpc('add_admin_authorization', {
        p_tenant: entraTenantId,
        p_oid: newAdminOid.trim(),
        p_display_name: newAdminName.trim() || null,
      });
      if (error) throw error;
      setAdminMsg({ type: 'success', text: t.adminAdded });
      setNewAdminOid('');
      setNewAdminName('');
      await loadAdminAuths();
      await loadAuditLog();
    } catch (err) {
      console.error('Failed to add admin:', err);
      setAdminMsg({ type: 'error', text: t.adminAddError });
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleRemoveAdmin(oid: string, name: string | null) {
    if (!confirm(t.removeAdminConfirm)) return;
    setAdminBusy(true);
    setAdminMsg(null);
    try {
      const { error } = await supabase.rpc('remove_admin_authorization', {
        p_tenant: entraTenantId,
        p_oid: oid,
      });
      if (error) {
        if (error.message.includes('cannot_remove_last_admin')) {
          setAdminMsg({ type: 'error', text: t.cannotRemoveLastAdmin });
        } else {
          throw error;
        }
      } else {
        setAdminMsg({ type: 'success', text: t.adminRemoved });
        await loadAdminAuths();
        await loadAuditLog();
      }
    } catch (err) {
      console.error('Failed to remove admin:', err);
      setAdminMsg({ type: 'error', text: t.adminRemoveError });
    } finally {
      setAdminBusy(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParsedData([]);
    setMessage(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const ab = ev.target?.result;
        const XLSX = await import('xlsx');
        const wb = XLSX.read(ab, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        const mapped: ParsedRow[] = rows.map((row) => {
          const keys = Object.keys(row);
          const get = (aliases: string[]) => {
            for (const a of aliases) {
              const found = keys.find((k) => k.toLowerCase().replace(/\s+/g, '').includes(a.toLowerCase()));
              if (found) return String(row[found] ?? '').trim();
            }
            return '';
          };
          return {
            ord: get(['ORD', 'Ord', 'Ordem']),
            locEmb: get(['LocEmb', 'LocEmb', 'LocalEmbark']),
            nomeClas: get(['NomeClas', 'NomeClas', 'NomeClassificacao']),
            cnpjCpf: get(['CNPJCPF', 'CNPJ', 'CPF', 'CnpjCpf']),
            commodities: get(['Commodities', 'Commodity', 'Commodit']),
            idUsuario: get(['IDUSER', 'IdUsuario', 'IDUsuario', 'ID']),
            owner: get(['OWNER', 'Owner']),
          };
        }).filter((r) => r.cnpjCpf && r.ord);
        setParsedData(mapped);
        if (mapped.length === 0) {
          setMessage({ type: 'error', text: t.noValidRecords });
        }
      } catch (error) {
        console.error('Failed to parse file:', error);
        setMessage({ type: 'error', text: t.errorReadingFile });
      }
    };
    reader.readAsArrayBuffer(f);
  }

  async function handleImport() {
    if (parsedData.length === 0) return;
    setImporting(true);
    setMessage(null);
    try {
      const ciclo = gerarCiclo();

      const { data: impData, error: impError } = await supabase
        .from('importacoes')
        .insert({ nome_arquivo: file?.name || 'planilha.xlsx', ciclo })
        .select()
        .single();
      if (impError) throw impError;

      const fornecedoresMap = new Map<string, ParsedRow>();
      parsedData.forEach((r) => {
        if (!fornecedoresMap.has(r.cnpjCpf)) {
          fornecedoresMap.set(r.cnpjCpf, r);
        }
      });
      const fornecedoresArr = Array.from(fornecedoresMap.entries()).map(([cnpj, r]) => ({
        codigo_fornecedor: cnpj,
        razao_social: r.nomeClas || cnpj,
        cnpj_cpf: cnpj,
        nome_clas: r.nomeClas,
        commodities: r.commodities,
        loc_emb: r.locEmb,
        owner: r.owner,
      }));
      setImportProgress({ step: t.importStepSuppliers, current: 0, total: Math.ceil(fornecedoresArr.length / 500) });
      for (let i = 0; i < fornecedoresArr.length; i += 500) {
        const chunk = fornecedoresArr.slice(i, i + 500);
        const { error: fornError } = await supabase
          .from('fornecedores')
          .upsert(chunk, { onConflict: 'codigo_fornecedor' });
        if (fornError) throw fornError;
        setImportProgress({ step: t.importStepSuppliers, current: Math.floor(i / 500) + 1, total: Math.ceil(fornecedoresArr.length / 500) });
      }

      await supabase.from('ordens_compra').delete().eq('ciclo', ciclo);

      const seen = new Set<string>();
      const ordensToInsert: { codigo_fornecedor: string; ordem_compra: string; numero_requisicao: string; data: string | null; id_usuario: string; ciclo: string; loc_emb: string | null; nome_clas: string | null; commodities: string | null; owner: string | null }[] = [];
      parsedData.forEach((r) => {
        const key = `${r.cnpjCpf}|${r.ord}`;
        if (seen.has(key)) return;
        seen.add(key);
        ordensToInsert.push({
          codigo_fornecedor: r.cnpjCpf,
          ordem_compra: r.ord,
          numero_requisicao: '',
          data: null,
          id_usuario: r.idUsuario,
          ciclo,
          loc_emb: r.locEmb || null,
          nome_clas: r.nomeClas || null,
          commodities: r.commodities || null,
          owner: r.owner || null,
        });
      });
      const totalOrdemChunks = Math.ceil(ordensToInsert.length / 500);
      setImportProgress({ step: t.importStepOrders, current: 0, total: totalOrdemChunks });
      for (let i = 0; i < ordensToInsert.length; i += 500) {
        const chunk = ordensToInsert.slice(i, i + 500);
        const { error: ordError } = await supabase.from('ordens_compra').insert(chunk);
        if (ordError) throw ordError;
        setImportProgress({ step: t.importStepOrders, current: Math.floor(i / 500) + 1, total: totalOrdemChunks });
      }

      setMessage({
        type: 'success',
        text: t.importSuccess.replace('{ciclo}', ciclo).replace('{count}', String(fornecedoresArr.length)),
      });
      setFile(null);
      setParsedData([]);
      if (inputRef.current) inputRef.current.value = '';
      void impData;
      await loadCicloAtual();
    } catch (err) {
      console.error('Import failed:', err);
      setMessage({ type: 'error', text: t.importError });
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  }

  return (
    <div className="brand-shell">
      <header className="brand-header border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images-removebg-preview.png"
              alt="Nexteer Automotive"
              className="h-10 w-auto object-contain shrink-0"
            />
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> {t.back}
            </Button>
          </div>
          <h1 className="text-lg font-semibold text-foreground">{t.adminArea}</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowHistory(true); loadHistory(); }}>
              <History className="w-4 h-4 mr-2" /> {t.history}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="painel" className="w-full" onValueChange={(v) => {
          if (v === 'acessos') loadAcessos();
          if (v === 'admins') { loadAdminAuths(); loadAuditLog(); }
        }}>
          <TabsList className="grid w-full grid-cols-4 max-w-lg mb-6">
            <TabsTrigger value="painel">
              <BarChart3 className="w-4 h-4 mr-2" /> {t.panel}
            </TabsTrigger>
            <TabsTrigger value="importar">
              <Upload className="w-4 h-4 mr-2" /> {t.import}
            </TabsTrigger>
            <TabsTrigger value="admins">
              <Shield className="w-4 h-4 mr-2" /> {t.admins}
            </TabsTrigger>
            <TabsTrigger value="acessos">
              <History className="w-4 h-4 mr-2" /> {t.accesses}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="painel">
            <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
              <ManagementPanel cicloAtual={currentCiclo} />
            </Suspense>
          </TabsContent>

          <TabsContent value="importar">
            <div className="grid gap-6">
              <Card className="brand-card shadow-lg animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                    {t.importExcel}
                  </CardTitle>
                  <CardDescription>
                    {t.importDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={() => inputRef.current?.click()}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    {file ? (
                      <div>
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {parsedData.length} {t.recordsDetected}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-foreground">{t.clickToSelect}</p>
                        <p className="text-sm text-muted-foreground mt-1">{t.supportedFormats}</p>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">{t.expectedColumns}</p>
                    <ul className="grid grid-cols-2 gap-1 text-xs">
                      <li>• {t.colLocEmb}</li>
                      <li>• {t.colNomeClas}</li>
                      <li>• {t.colCnpjCpf}</li>
                      <li>• {t.colCommodities}</li>
                      <li>• {t.colIdUser}</li>
                      <li>• {t.colOwner}</li>
                    </ul>
                  </div>

                  {message && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg text-sm animate-fade-in ${
                      message.type === 'success'
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {message.type === 'success'
                        ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                        : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                      <span>{message.text}</span>
                    </div>
                  )}

                  {parsedData.length > 0 && (
                    <div className="animate-fade-in">
                      <div className="rounded-lg border border-border overflow-hidden">
                        <div className="max-h-64 overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t.colLocEmb}</TableHead>
                                <TableHead>{t.colNomeClas}</TableHead>
                                <TableHead>{t.colCnpjCpf}</TableHead>
                                <TableHead>{t.colCommodities}</TableHead>
                                <TableHead>{t.colIdUser}</TableHead>
                                <TableHead>{t.colOwner}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {parsedData.slice(0, 50).map((r, i) => (
                                <TableRow key={i}>
                                  <TableCell className="text-xs">{r.locEmb}</TableCell>
                                  <TableCell className="text-xs">{r.nomeClas}</TableCell>
                                  <TableCell className="text-xs font-mono">{r.cnpjCpf}</TableCell>
                                  <TableCell className="text-xs">{r.commodities}</TableCell>
                                  <TableCell className="text-xs">{r.idUsuario}</TableCell>
                                  <TableCell className="text-xs">{r.owner}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {parsedData.length > 50 && (
                          <p className="text-xs text-muted-foreground p-2 text-center">
                            {t.showing} 50 {t.of} {parsedData.length} {t.records}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleImport}
                    disabled={parsedData.length === 0 || importing}
                    className="w-full h-11"
                    size="lg"
                  >
                    {importing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {importProgress ? `${importProgress.step} (${importProgress.current}/${importProgress.total})` : t.importing}</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" /> {t.importAndGenerate}</>
                    )}
                  </Button>

                  {importing && importProgress && (
                    <div className="space-y-1.5 animate-fade-in">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 ease-out"
                          style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        {importProgress.step} — {importProgress.current}/{importProgress.total}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="admins">
            <div className="grid gap-6">
              <Card className="brand-card shadow-lg animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    {t.admins}
                  </CardTitle>
                  <CardDescription>{t.adminsDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {adminMsg && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg text-sm animate-fade-in ${
                      adminMsg.type === 'success'
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {adminMsg.type === 'success'
                        ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                        : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                      <span>{adminMsg.text}</span>
                    </div>
                  )}

                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <UserPlus className="w-4 h-4 text-primary" /> {t.addByOid}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t.objectId}</Label>
                        <Input
                          value={newAdminOid}
                          onChange={(e) => setNewAdminOid(e.target.value)}
                          placeholder={t.adminOidPlaceholder}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t.adminDisplayName}</Label>
                        <Input
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          placeholder={t.adminDisplayNamePlaceholder}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleAddAdmin}
                      disabled={!newAdminOid.trim() || adminBusy}
                      className="w-full"
                    >
                      {adminBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                      {t.addAdminButton}
                    </Button>
                  </div>

                  {adminAuths.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">{t.noAdminsRegistered}</p>
                  ) : (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t.adminDisplayName}</TableHead>
                            <TableHead>{t.objectId}</TableHead>
                            <TableHead>{t.authorizedAt}</TableHead>
                            <TableHead className="text-right">{t.removeAdmin}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adminAuths.map((a) => (
                            <TableRow key={a.entra_oid}>
                              <TableCell className="font-medium">{a.entra_display_name || '—'}</TableCell>
                              <TableCell className="font-mono text-xs">{a.entra_oid.substring(0, 8)}…</TableCell>
                              <TableCell className="text-xs">
                                {new Date(a.created_at).toLocaleDateString(locale)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveAdmin(a.entra_oid, a.entra_display_name)}
                                  disabled={adminBusy}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="brand-card shadow-lg animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    {t.auditLog}
                  </CardTitle>
                  <CardDescription>{t.auditLogDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  {auditEntries.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">{t.noAuditEntries}</p>
                  ) : (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="max-h-[400px] overflow-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                              <TableHead>{t.auditAction}</TableHead>
                              <TableHead>{t.auditTarget}</TableHead>
                              <TableHead>{t.auditActor}</TableHead>
                              <TableHead className="text-right">{t.auditDate}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {auditEntries.map((e) => (
                              <TableRow key={e.id}>
                                <TableCell>
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                                    e.action === 'grant'
                                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                      : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                  }`}>
                                    {e.action === 'grant' ? t.grant : t.revoke}
                                  </span>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{e.target_oid.substring(0, 8)}…</TableCell>
                                <TableCell className="text-xs">{e.actor_id_usuario || '—'}</TableCell>
                                <TableCell className="text-right text-xs">
                                  {new Date(e.created_at).toLocaleString(locale, {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
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
            </div>
          </TabsContent>

          <TabsContent value="acessos">
            <Card className="brand-card shadow-lg animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
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
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="max-h-[500px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
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
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {showHistory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowHistory(false)}>
            <div className="bg-background rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t.importHistory}</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>{t.close}</Button>
              </div>
              <div className="overflow-auto p-4">
                {importacoes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t.noImportsRegistered}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.cycle}</TableHead>
                        <TableHead>{t.file}</TableHead>
                        <TableHead>{t.date}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importacoes.map((imp) => (
                        <TableRow key={imp.id}>
                          <TableCell className="font-medium">{imp.ciclo}</TableCell>
                          <TableCell>{imp.nome_arquivo}</TableCell>
                          <TableCell className="text-xs">{new Date(imp.data_importacao).toLocaleString(locale)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
