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
    system: {
      // When false (default), MSAL opens about:blank first, then calls
      // popupWindow.location.assign(authUrl). In a credentialless iframe that
      // cross-origin assignment fails and MSAL throws popup_window_error.
      // asyncPopups: true makes MSAL call window.open(authUrl) directly,
      // opening a fresh top-level window that is not constrained by the
      // credentialless iframe policy.
      asyncPopups: true,
    },
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

// Process redirect response (non-embedded only). In embedded mode the popup
// flow returns the token directly from startEntraSignIn, so this is a no-op.
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

// In embedded mode (Bolt preview iframe), uses loginPopup so the editor tab
// is never navigated away. Returns the idToken from the popup response, or
// null when the non-embedded redirect flow takes over (browser navigates to
// Microsoft and back).
export async function startEntraSignIn(): Promise<string | null> {
  if (isDevMode) return null;
  if (isEmbedded()) {
    const msal = await getMsal();
    const response = await msal.loginPopup({
      scopes: resolvedScopes(),
      popupWindowAttributes: {
        popupSize: { width: 500, height: 600 },
        popupPosition: { top: 100, left: 200 },
      },
    });
    return response?.idToken ?? null;
  }
  const msal = await getMsal();
  await msal.loginRedirect({ scopes: resolvedScopes() });
  return null;
}

export async function signOutOfEntra(): Promise<void> {
  if (isDevMode) return;
  const msal = await getMsal();
  if (isEmbedded()) {
    // logoutPopup opens a small window to Microsoft's end-session endpoint,
    // then redirects it back to postLogoutRedirectUri. post_logout_redirect_uri
    // does not need to be registered in the app registration (unlike the auth
    // redirect URI), so this works regardless of Entra redirect URI config.
    try {
      await msal.logoutPopup({
        postLogoutRedirectUri: window.location.origin,
        popupWindowAttributes: {
          popupSize: { width: 500, height: 600 },
        },
      });
    } catch {
      msal.clearCache();
    }
    return;
  }
  await msal.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
}
