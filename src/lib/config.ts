declare global {
  interface Window {
    __APP_CONFIG__?: Record<string, string>;
  }
}

export function setting(key: string): string {
  const runtime = window.__APP_CONFIG__?.[key];
  if (runtime) return runtime.trim();
  // import.meta.env is only available as a fallback during local dev.
  // In production builds, all config comes from /app-config.json.
  if (import.meta.env.DEV) {
    return (import.meta.env[key] ?? '').trim();
  }
  return '';
}

export const isDevMode =
  import.meta.env.DEV &&
  setting('VITE_DEV_MODE') === 'true';

export function validateConfig() {
  const keys = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    ...(!isDevMode
      ? ['VITE_ENTRA_TENANT_ID', 'VITE_ENTRA_CLIENT_ID']
      : []),
  ];

  const missing = keys.filter(key => !setting(key));

  if (missing.length) {
    throw new Error(
      `Configuração ausente: ${missing.join(', ')}`
    );
  }

  const url = new URL(setting('VITE_SUPABASE_URL'));

  if (
    url.protocol !== 'https:' &&
    !(import.meta.env.DEV && url.hostname === 'localhost')
  ) {
    throw new Error('VITE_SUPABASE_URL deve usar HTTPS.');
  }
}
