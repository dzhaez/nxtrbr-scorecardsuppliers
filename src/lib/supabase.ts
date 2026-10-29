import { createClient } from '@supabase/supabase-js';
import { setting } from './config';

const supabaseUrl = setting('VITE_SUPABASE_URL');
const supabaseAnonKey = setting('VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export class EntraAccessDeniedError extends Error {}

export interface EntraExchangeResult {
  id_usuario: string;
  is_admin: boolean;
}

/**
 * Trades a Microsoft Entra ID token for a Supabase session. The server validates
 * the token signature and only admits users whose Entra identity is linked to
 * an existing account or pre-authorized as an admin. The purchasing spreadsheet
 * is no longer used for authorization.
 */
export async function exchangeEntraToken(idToken: string): Promise<EntraExchangeResult> {
  const res = await fetch(`${supabaseUrl}/functions/v1/entra-exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ id_token: idToken }),
  });
  if (res.status === 403) throw new EntraAccessDeniedError('not_authorized');
  if (!res.ok) {
    const failure = await res.json().catch(() => null);
    const code = typeof failure?.error === 'string' && /^[a-z_]{1,80}$/.test(failure.error) ? failure.error : 'unknown';
    throw new Error(`entra_exchange_failed (${res.status}): ${code}`);
  }

  const data = await res.json();
  if (!data?.access_token || !data?.refresh_token || typeof data?.id_usuario !== 'string') {
    throw new Error('entra_exchange_invalid_response');
  }

  const { error } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (error) throw error;

  return { id_usuario: data.id_usuario, is_admin: data.is_admin === true };
}

export interface Importacao {
  id: string;
  data_importacao: string;
  nome_arquivo: string;
  ciclo: string;
}

export interface Fornecedor {
  codigo_fornecedor: string;
  razao_social: string;
  cnpj_cpf: string | null;
  nome_clas: string | null;
  commodities: string | null;
  loc_emb: string | null;
  owner: string | null;
}

export interface OrdemCompra {
  id: string;
  codigo_fornecedor: string;
  ordem_compra: string;
  numero_requisicao: string;
  data: string | null;
  id_usuario: string;
  ciclo: string;
  loc_emb: string | null;
  nome_clas: string | null;
  commodities: string | null;
  owner: string | null;
}

export interface Avaliacao {
  id: string;
  codigo_fornecedor: string;
  id_usuario: string;
  ciclo: string;
  nota1: number;
  nota2: number;
  nota3: number;
  media: number;
  comentario: string;
  data_avaliacao: string;
}

export interface SupplierWithOrders {
  codigo_fornecedor: string;
  razao_social: string;
  cnpj_cpf: string | null;
  nome_clas: string | null;
  commodities: string | null;
  loc_emb: string | null;
  owner: string | null;
  ordens: OrdemCompra[];
  totalOrdens: number;
  status: 'pendente' | 'avaliado';
  avaliacao?: Avaliacao;
}

export interface Usuario {
  id: string;
  id_usuario: string;
  is_admin: boolean;
  created_at: string;
}

export interface Acesso {
  id: string;
  user_id: string;
  id_usuario: string;
  data_hora: string;
}

export type SortField = 'nome' | 'codigo' | 'ordens' | 'status' | 'ordem';
export type SortDir = 'asc' | 'desc';

export function classificacaoMedia(media: number, labels?: { poor: string; good: string; excellent: string }): { label: string; color: string; bg: string } {
  if (media < 2.0) return { label: labels?.poor ?? 'Ruim', color: 'text-red-400', bg: 'bg-red-500/15' };
  if (media < 4.0) return { label: labels?.good ?? 'Bom', color: 'text-amber-300', bg: 'bg-amber-500/15' };
  return { label: labels?.excellent ?? 'Ótimo', color: 'text-emerald-400', bg: 'bg-emerald-500/15' };
}

export function gerarCiclo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const semestre = month <= 6 ? '1' : '2';
  return `${year}-${semestre}`;
}

/**
 * Fetches the evaluator ID (id_usuario) for the currently signed-in user
 * from the usuarios table. Returns null if no profile is found.
 */
export async function fetchIdUsuario(): Promise<string | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id_usuario, is_admin')
    .maybeSingle();
  if (error || !data) return null;
  return data.id_usuario;
}

/**
 * Fetches the full user profile for the currently signed-in user.
 * Uses SECURITY DEFINER RPCs to bypass RLS recursion on the usuarios table
 * (the select policy calls is_admin_user() which itself reads usuarios).
 */
export async function fetchUserProfile(): Promise<Usuario | null> {
  const [idRes, adminRes, userRes] = await Promise.all([
    supabase.rpc('get_id_usuario'),
    supabase.rpc('is_admin_user'),
    supabase.auth.getUser(),
  ]);
  if (idRes.error || !idRes.data) return null;
  if (adminRes.error) return null;
  if (!userRes.data?.user) return null;

  return {
    id: userRes.data.user.id,
    id_usuario: idRes.data as string,
    is_admin: (adminRes.data as boolean) ?? false,
    created_at: userRes.data.user.created_at ?? '',
  };
}

/**
 * Records a login entry in the acessos table for the currently signed-in user.
 */
export async function registrarAcesso(idUsuario: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('acessos').insert({
    user_id: user?.id,
    id_usuario: idUsuario,
  });
}
