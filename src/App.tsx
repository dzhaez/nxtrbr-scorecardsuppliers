import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import './App.css';
import LoginScreen from './components/LoginScreen';
import { Loader2 } from 'lucide-react';
import { supabase, fetchUserProfile, type Usuario } from './lib/supabase';
import { LanguageProvider, useI18n } from './i18n/LanguageContext';

const MainScreen = lazy(() => import('./components/MainScreen'));
const AdminScreen = lazy(() => import('./components/AdminScreen'));

type Screen = 'login' | 'main' | 'admin';

function FullScreenLoader() {
  const { t } = useI18n();
  return (
    <div className="brand-shell flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
      <p className="text-sm text-muted-foreground">{t.loading}</p>
    </div>
  );
}

function AppInner() {
  const { t } = useI18n();
  const [screen, setScreen] = useState<Screen>('login');
  const [userId, setUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const authReadyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // Safety timeout: if neither onAuthStateChange nor getSession resolves
    // within 5 seconds (network issue, auth client fails to initialize),
    // unblock the UI so the user sees the login screen instead of an
    // infinite spinner.
    const safetyTimer = setTimeout(() => {
      if (!cancelled && !authReadyRef.current) {
        console.warn('Auth initialization timed out — showing login screen');
        authReadyRef.current = true;
        setAuthReady(true);
        setScreen('login');
      }
    }, 5000);

    async function processSession(session: { user?: { id: string } } | null) {
      try {
        if (!session?.user) {
          if (!cancelled) {
            setUserId('');
            setIsAdmin(false);
            setScreen('login');
          }
          return;
        }

        // Retry profile fetch a few times — the database trigger that
        // auto-creates the usuarios row runs in the same transaction as
        // auth.users INSERT, but the client may receive the session event
        // before the row is visible to the anon-key client.
        let profile: Usuario | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          profile = await fetchUserProfile();
          if (profile) break;
          await new Promise((r) => setTimeout(r, 300));
        }
        if (cancelled) return;

        if (profile) {
          setUserId(profile.id_usuario);
          setIsAdmin(profile.is_admin);
          setScreen('main');
        } else {
          setScreen('login');
        }
      } catch (err) {
        console.error('Auth state processing failed:', err);
        if (!cancelled) setScreen('login');
      } finally {
        if (!cancelled && !authReadyRef.current) {
          authReadyRef.current = true;
          setAuthReady(true);
        }
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      processSession(session);
    });

    // Proactively fetch the session in case onAuthStateChange's
    // INITIAL_SESSION event doesn't fire (known to happen in some browsers
    // when localStorage access is restricted or the auth client initializes
    // asynchronously after the listener is registered).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        processSession(session);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  function handleLogin(id: string, admin: boolean) {
    setUserId(id);
    setIsAdmin(admin);
    setScreen('main');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserId('');
    setIsAdmin(false);
    setScreen('login');
  }

  // The admin screen is reachable through a window event, so the event handler
  // must re-check the signed-in identity itself. Relying on the Admin button
  // being hidden is not enough: the listener is live for every signed-in user
  // and anyone can dispatch the event.
  useEffect(() => {
    function handleAdminNav() {
      if (!isAdmin) return;
      setScreen('admin');
    }
    window.addEventListener('navigate-admin', handleAdminNav);
    return () => window.removeEventListener('navigate-admin', handleAdminNav);
  }, [isAdmin]);

  if (!authReady) {
    return <FullScreenLoader />;
  }

  if (screen === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Second gate: even if the screen state were set some other way, the admin
  // screen is only rendered for the admin identity.
  if (screen === 'admin' && isAdmin) {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <AdminScreen onBack={() => setScreen('main')} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <MainScreen userId={userId} isAdmin={isAdmin} onLogout={handleLogout} />
    </Suspense>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

export default App;
