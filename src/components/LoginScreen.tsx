import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Loader2, Globe, ShieldCheck } from 'lucide-react';
import { exchangeEntraToken, registrarAcesso, EntraAccessDeniedError } from '@/lib/supabase';
import {
  startEntraSignIn,
  handleEntraRedirect,
  isEntraConfigured,
  isDevMode,
} from '@/lib/entra';
import { useI18n } from '@/i18n/LanguageContext';
import { LANGUAGES, type LanguageCode } from '@/i18n/translations';

interface LoginScreenProps {
  onLogin: (userId: string, isAdmin: boolean) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const { t, lang, setLang } = useI18n();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'popup'>('idle');
  const [error, setError] = useState('');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const redirectHandled = useRef(false);

  async function finishSignIn(idToken: string) {
    setStatus('verifying');
    try {
      const { id_usuario, is_admin } = await exchangeEntraToken(idToken);
      await registrarAcesso(id_usuario);
      onLogin(id_usuario, is_admin);
    } catch (err) {
      console.error('Entra sign-in failed:', err);
      setError(err instanceof EntraAccessDeniedError ? t.entraNotAuthorized : t.entraError);
      setStatus('idle');
    }
  }

  useEffect(() => {
    if (!isEntraConfigured || redirectHandled.current) return;
    redirectHandled.current = true;
    (async () => {
      try {
        const idToken = await handleEntraRedirect();
        if (idToken) await finishSignIn(idToken);
      } catch (err) {
        console.error('Entra redirect failed:', err);
        setError(t.entraError);
        setStatus('idle');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignIn() {
    setError('');
    setStatus('popup');
    try {
      await startEntraSignIn();
      // Browser navigates away to Microsoft; when it comes back,
      // the useEffect above picks up the redirect response.
    } catch (err) {
      console.error('Entra redirect failed:', err);
      setError(t.entraError);
      setStatus('idle');
    }
  }

  function handleDevMode() {
    onLogin('dev-user', true);
  }

  function selectLanguage(code: LanguageCode) {
    setLang(code);
    setShowLangMenu(false);
  }

  const busy = status !== 'idle';
  const message = error || (isEntraConfigured ? '' : t.entraNotConfigured);

  return (
    <div className="brand-shell flex flex-col items-center justify-center min-h-screen p-6 relative">
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card/80 backdrop-blur-sm hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium text-foreground"
        >
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-lg">{LANGUAGES.find((l) => l.code === lang)?.flag}</span>
          <span className="hidden sm:inline">{LANGUAGES.find((l) => l.code === lang)?.label}</span>
        </button>
        {showLangMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />
            <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-popover shadow-xl z-20 overflow-hidden animate-fade-in">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => selectLanguage(l.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${
                    lang === l.code
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="text-lg">{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="w-full max-w-lg animate-slide-up flex flex-col items-center">
        <div className="flex flex-col items-center mb-10">
          <img
            src="/images-removebg-preview.png"
            alt="Nexteer Automotive"
            className="h-88 w-auto object-contain mb-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
          />
          <p className="text-base text-muted-foreground tracking-wide">{t.appSubtitle}</p>
        </div>

        <Card className="brand-card shadow-2xl w-full max-w-md mx-auto">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">{t.appTitle}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {t.entraDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <Button
              type="button"
              className="w-full h-12 text-base"
              onClick={handleSignIn}
              disabled={busy || (!isEntraConfigured && !isDevMode)}
            >
              {busy ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t.signingIn}</>
              ) : (
                <><ShieldCheck className="w-4 h-4 mr-2" /> {t.entraSignInButton}</>
              )}
            </Button>

            {isDevMode && (
              <Button
                type="button"
                variant="secondary"
                className="w-full h-11 text-sm"
                onClick={handleDevMode}
                disabled={busy}
              >
                {t.devModeButton}
              </Button>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-8">
          © {new Date().getFullYear()} Nexteer Automotive.
          {lang === 'pt' ? ' Todos os direitos reservados.'
            : lang === 'en' ? ' All rights reserved.'
            : lang === 'pl' ? ' Wszelkie prawa zastrzeżone.'
            : ' Todos los derechos reservados.'}
        </p>
      </div>
    </div>
  );
}
