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

function createMsal(client: string): PublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: client,
      authority: resolvedAuthority(),
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
      navigateToLoginRequestUrl: false,
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

function isEmbedded(): boolean {
  return window.self !== window.top;
}

let redirectResult: Promise<string | null> | null = null;

// Process each redirect once, including React StrictMode remounts.
export function handleEntraRedirect(): Promise<string | null> {
  if (isDevMode || !clientId || isEmbedded()) return Promise.resolve(null);
  redirectResult ??= (async () => {
    const msal = await getMsal();
    const response = await msal.handleRedirectPromise();
    if (response?.idToken) return response.idToken;
    const url = new URL(window.location.href);
    if (url.searchParams.get('entra_login') === '1') {
      url.searchParams.delete('entra_login');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      await msal.loginRedirect({ scopes: resolvedScopes() });
    }
    return null;
  })();
  return redirectResult;
}

// Leave the editor iframe in the SAME browser tab before Microsoft sign-in.
export async function startEntraSignIn(): Promise<void> {
  if (isDevMode) return;
  if (isEmbedded()) {
    const url = new URL('/', window.location.origin);
    url.searchParams.set('entra_login', '1');
    window.top!.location.href = url.href;
    return;
  }
  const msal = await getMsal();
  await msal.loginRedirect({ scopes: resolvedScopes() });
}

export async function signOutOfEntra(): Promise<void> {
  if (isDevMode) return;
  const msal = await getMsal();
  await msal.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
}
