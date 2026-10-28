import { PublicClientApplication } from '@azure/msal-browser';

const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID as string | undefined;
const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID as string | undefined;

export const isEntraConfigured = Boolean(tenantId && clientId);

let msalPromise: Promise<PublicClientApplication> | null = null;
let redirectPromise: Promise<string | null> | null = null;

function createMsal(tenant: string, client: string) {
  return (async () => {
    const instance = new PublicClientApplication({
      auth: {
        clientId: client,
        authority: `https://login.microsoftonline.com/${tenant}`,
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
      },
      cache: { cacheLocation: 'sessionStorage' },
    });
    await instance.initialize();
    return instance;
  })();
}

function getMsal(): Promise<PublicClientApplication> {
  if (!tenantId || !clientId) {
    return Promise.reject(new Error('entra_not_configured'));
  }
  msalPromise ??= createMsal(tenantId, clientId);
  return msalPromise;
}

export async function startEntraSignIn(): Promise<void> {
  const msal = await getMsal();
  await msal.loginRedirect({ scopes: ['openid', 'profile', 'email'] });
}

/**
 * Returns the Entra ID token after the browser comes back from Microsoft, or null
 * when the page was not opened from a sign-in redirect. Memoized because the
 * redirect response can only be read once.
 */
export function completeEntraSignIn(): Promise<string | null> {
  redirectPromise ??= getMsal()
    .then((msal) => msal.handleRedirectPromise())
    .then((result) => result?.idToken ?? null);
  return redirectPromise;
}

export async function signOutOfEntra(): Promise<void> {
  const msal = await getMsal();
  await msal.logoutRedirect();
}
