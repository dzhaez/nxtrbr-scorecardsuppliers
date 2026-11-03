import { PublicClientApplication } from '@azure/msal-browser';
import { setting, isDevMode } from './config';

export { isDevMode };

const tenantId = setting('VITE_ENTRA_TENANT_ID');
const clientId = setting('VITE_ENTRA_CLIENT_ID');
const authority = setting('VITE_ENTRA_AUTHORITY');
const apiScope = setting('VITE_ENTRA_API_SCOPE');

// Stable Azure portal — redirect URI is registered in the Entra app registration.
const STABLE_PORTAL = 'https://it-ea-app-scorecard-suppliers-0b9ddd.azurewebsites.net/';

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

// Processes the redirect response on the stable portal (non-embedded).
// Consumes and removes the entra_login=1 query parameter, then initiates
// loginRedirect to Microsoft. The memoized promise survives React StrictMode
// remounts so the redirect is only processed once.
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

// In embedded mode (Bolt preview iframe), navigates the top-level browser tab
// to the stable Azure portal with entra_login=1. The portal is a full-page
// origin whose redirect URI is registered in Entra, so the redirect flow
// completes normally. No popup, no window.open, no new tab — same tab only.
// In non-embedded mode, initiates loginRedirect directly.
export async function startEntraSignIn(): Promise<void> {
  if (isDevMode) return;
  if (isEmbedded()) {
    const url = new URL(STABLE_PORTAL);
    url.searchParams.set('entra_login', '1');
    window.top!.location.href = url.href;
    return;
  }
  const msal = await getMsal();
  await msal.loginRedirect({ scopes: resolvedScopes() });
}

// Logout: in embedded mode, navigates the top-level tab to the stable portal.
// In non-embedded mode, uses logoutRedirect to Microsoft's end-session
// endpoint, which redirects back to the portal after sign-out.
export async function signOutOfEntra(): Promise<void> {
  if (isDevMode) return;
  if (isEmbedded()) {
    window.top!.location.href = STABLE_PORTAL;
    return;
  }
  const msal = await getMsal();
  await msal.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
}
