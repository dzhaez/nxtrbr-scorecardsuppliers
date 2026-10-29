import { PublicClientApplication } from '@azure/msal-browser';
import { setting, isDevMode } from './config';

export { isDevMode };

const tenantId = setting('VITE_ENTRA_TENANT_ID');
const clientId = setting('VITE_ENTRA_CLIENT_ID');
const authority = setting('VITE_ENTRA_AUTHORITY');
const apiScope = setting('VITE_ENTRA_API_SCOPE');

export const isEntraConfigured = Boolean(tenantId && clientId) || isDevMode;

function resolvedAuthority(): string {
  if (authority) return authority;
  return `https://login.microsoftonline.com/${tenantId}`;
}

function resolvedScopes(): string[] {
  if (apiScope) return [apiScope];
  return ['openid', 'profile', 'email'];
}

let msalPromise: Promise<PublicClientApplication> | null = null;
let redirectPromise: Promise<string | null> | null = null;

function createMsal(client: string): PublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: client,
      authority: resolvedAuthority(),
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: { cacheLocation: 'sessionStorage' },
  });
}

async function getMsal(): Promise<PublicClientApplication> {
  if (!clientId) {
    throw new Error('entra_not_configured');
  }
  if (!msalPromise) {
    const instance = createMsal(clientId);
    msalPromise = instance.initialize().then(() => instance);
  }
  return msalPromise;
}

export async function startEntraSignIn(): Promise<void> {
  if (isDevMode) return;
  const msal = await getMsal();
  await msal.loginRedirect({ scopes: resolvedScopes() });
}

export function completeEntraSignIn(): Promise<string | null> {
  if (isDevMode) return Promise.resolve(null);
  redirectPromise ??= getMsal()
    .then((msal) => msal.handleRedirectPromise())
    .then((result) => result?.idToken ?? null);
  return redirectPromise;
}

export async function signOutOfEntra(): Promise<void> {
  if (isDevMode) return;
  const msal = await getMsal();
  await msal.logoutRedirect();
}
