import { PublicClientApplication } from '@azure/msal-browser';
import { setting, isDevMode } from './config';

export { isDevMode };

const tenantId = setting('VITE_ENTRA_TENANT_ID');
const clientId = setting('VITE_ENTRA_CLIENT_ID');
const authority = setting('VITE_ENTRA_AUTHORITY');
const apiScope = setting('VITE_ENTRA_API_SCOPE');

export const isEntraConfigured = Boolean(tenantId && clientId) || isDevMode;

// MSAL redirect refuses to run inside iframes; cross-origin access to window.top also means embedded.
export const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

// Set VITE_PUBLISHED_APP_URL in app-config.json to the published Catalyst URL.
export function publishedAppUrl(): string {
  return setting('VITE_PUBLISHED_APP_URL') || window.location.href;
}

// MSAL throws popup_window_error when the popup is blocked by the browser or iframe sandbox.
export function isPopupBlockedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('popup_window_error') || msg.includes('popup');
}

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
    system: { asyncPopups: true, loggerOptions: { loggerCallback: (_level, message, containsPii) => { if (!containsPii && message.includes('error opening popup')) console.warn(message); }, piiLoggingEnabled: false } },
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

// Clears any stale redirect state on load.
export async function clearEntraRedirect(): Promise<void> {
  if (isDevMode || !clientId) return;
  try {
    const msal = await getMsal();
    await msal.handleRedirectPromise();
  } catch {
    // ignore
  }
}

// Opens a Microsoft login popup and resolves with the id_token.
// Works inside iframes because the popup is a separate top-level window,
// unless the iframe sandbox blocks popups — in that case the caller should
// catch the error and show the "open in new tab" guidance.
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
