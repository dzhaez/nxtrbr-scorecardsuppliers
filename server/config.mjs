export function publicConfig(env) {
  // Somente parâmetros públicos destinados ao navegador.
  const keys = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_ENTRA_CLIENT_ID',
    'VITE_ENTRA_TENANT_ID',
    'VITE_ENTRA_AUTHORITY',
    'VITE_ENTRA_API_SCOPE',
  ];

  const config = Object.fromEntries(
    keys.map(key => [key, (env[key] || '').trim()])
  );

  const key = config.VITE_SUPABASE_ANON_KEY;

  if (key.startsWith('sb_secret_')) {
    throw new Error('Use a public Supabase key.');
  }

  if (key.split('.').length === 3) {
    const claims = JSON.parse(
      Buffer.from(
        key.split('.')[1],
        'base64url'
      ).toString()
    );

    if (claims.role !== 'anon') {
      throw new Error(
        'Only the Supabase anon key may be exposed.'
      );
    }
  }

  return config;
}
