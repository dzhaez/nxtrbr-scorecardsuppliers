import { PublicClientApplication } from '@azure/msal-browser';

const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID as string | undefined;
const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID as string | undefined;
const authority = import.meta.env.VITE_ENTRA_AUTHORITY as string | undefined;
const apiScope = import.meta.env.VITE_ENTRA_API_SCOPE as string | undefined;

/** When true, the app skips Entra sign-in entirely and logs in as a dev user. */
export const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

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

/**
 * Returns the Entra ID token after the browser comes back from Microsoft, or null
 * when the page was not opened from a sign-in redirect. Memoized because the
 * redirect response can only be read once.
 */
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
