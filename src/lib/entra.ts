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

// Clears any stale redirect state on load. Popup is the primary login method.
export async function clearEntraRedirect(): Promise<void> {
  if (isDevMode || !clientId) return;
  try {
    const msal = await getMsal();
    await msal.handleRedirectPromise();
  } catch {
    // ignore — popup flow doesn't depend on redirect state
  }
}

// Opens a Microsoft login popup and resolves with the id_token.
// Works inside iframes because the popup is a separate top-level window.
export async function startEntraSignIn(): Promise<string> {
  if (isDevMode) return '';
  const msal = await getMsal();
  const response = await msal.loginPopup({
    scopes: resolvedScopes(),
    popupWindowAttributes: {
      popupSize: { height: 700, width: 500 },
    },
  });
  return response.idToken;
}

export async function signOutOfEntra(): Promise<void> {
  if (isDevMode) return;
  const msal = await getMsal();
  await msal.logoutPopup({ postLogoutRedirectUri: window.location.origin });
}
