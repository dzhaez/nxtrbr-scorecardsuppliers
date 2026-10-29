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

// Processes the redirect response when the page loads after Microsoft login.
// Returns the id_token if the redirect carried one, or null otherwise.
export async function handleEntraRedirect(): Promise<string | null> {
  if (isDevMode || !clientId) return null;
  try {
    const msal = await getMsal();
    const response = await msal.handleRedirectPromise();
    return response?.idToken ?? null;
  } catch {
    return null;
  }
}

// Navigates the current tab to Microsoft login. The browser leaves the app,
// the user signs in, and Microsoft redirects back with the token.
export async function startEntraSignIn(): Promise<void> {
  if (isDevMode) return;
  const msal = await getMsal();
  await msal.loginRedirect({
    scopes: resolvedScopes(),
  });
}

export async function signOutOfEntra(): Promise<void> {
  if (isDevMode) return;
  const msal = await getMsal();
  await msal.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
}
