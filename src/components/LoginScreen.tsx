import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogIn, AlertCircle, Loader2, UserPlus, KeyRound, Eye, EyeOff, Globe } from 'lucide-react';
import { supabase, callAuthBroker, fetchUserProfile, registrarAcesso } from '@/lib/supabase';
import { useI18n } from '@/i18n/LanguageContext';
import { LANGUAGES, type LanguageCode } from '@/i18n/translations';

interface LoginScreenProps {
  onLogin: (userId: string, isAdmin: boolean) => void;
}

type Mode = 'login' | 'register';

const MIN_PASSWORD_LENGTH = 8;

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const { t, lang, setLang } = useI18n();
  const [mode, setMode] = useState<Mode>('login');
  const [idUsuario, setIdUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLangMenu, setShowLangMenu] = useState(false);

  function resetFields() {
    setIdUsuario('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  }

  function switchMode(next: Mode) {
    setMode(next);
    resetFields();
  }

  function selectLanguage(code: LanguageCode) {
    setLang(code);
    setShowLangMenu(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedId = idUsuario.trim();

    if (!trimmedId || !password) {
      setError(t.fillAllFields);
      return;
    }

    if (mode === 'register') {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) {
        setError(t.fillAllFields);
        return;
      }
      if (password !== confirmPassword) {
        setError(t.passwordMismatch);
        return;
      }
    }

    // Registration enforces a real minimum length; sign-in must keep accepting
    // whatever length an existing account was created with.
    if (mode === 'register' && password.length < MIN_PASSWORD_LENGTH) {
      setError(t.passwordTooShort);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const trimmedEmail = email.trim().toLowerCase();

        const result = await callAuthBroker({
          action: 'register',
          id_usuario: trimmedId,
          password,
          email: trimmedEmail,
        });

        if (!result.ok) {
          setError(t.firstAccessError);
          setLoading(false);
          return;
        }

        const registeredId = result.id_usuario ?? trimmedId;
        try { await registrarAcesso(registeredId); } catch { /* ignore */ }
        onLogin(registeredId, result.is_admin === true);
      } else {
        const result = await callAuthBroker({
          action: 'login',
          id_usuario: trimmedId,
          password,
        });

        if (!result.ok) {
          setError(t.loginError);
          setLoading(false);
          return;
        }

        const loggedInId = result.id_usuario ?? trimmedId;
        try { await registrarAcesso(loggedInId); } catch { /* ignore */ }
        onLogin(loggedInId, result.is_admin === true);
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(t.loginError);
      setLoading(false);
    }
  }

  return (
    <div className="brand-shell flex flex-col items-center justify-center min-h-screen p-6 relative">
      {/* Language Selector */}
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
            <CardTitle className="text-3xl font-bold tracking-tight">
              {mode === 'login' ? t.appTitle : t.firstAccessTab}
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {mode === 'login'
                ? lang === 'pt' ? 'Informe seu ID e senha para acessar o sistema'
                  : lang === 'en' ? 'Enter your ID and password to access the system'
                  : lang === 'pl' ? 'Wprowadź swoje ID i hasło, aby uzyskać dostęp do systemu'
                  : 'Ingrese su ID y contraseña para acceder al sistema'
                : lang === 'pt' ? 'Cadastre sua senha para começar a usar o sistema'
                  : lang === 'en' ? 'Register your password to start using the system'
                  : lang === 'pl' ? 'Zarejestruj swoje hasło, aby zacząć korzystać z systemu'
                  : 'Registre su contraseña para comenzar a usar el sistema'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="idUsuario" className="text-sm font-medium text-foreground">
                  {t.userId}
                </label>
                <Input
                  id="idUsuario"
                  type="text"
                  value={idUsuario}
                  onChange={(e) => setIdUsuario(e.target.value)}
                  placeholder={t.userIdPlaceholder}
                  className="h-11"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {mode === 'register' && (
                <div className="space-y-2 animate-fade-in">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    {t.email}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="h-11"
                    autoComplete="email"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  {t.password}
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="h-11 pr-10"
                    maxLength={72}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-2 animate-fade-in">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    {t.confirmPassword}
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t.confirmPasswordPlaceholder}
                      className="h-11 pr-10"
                      maxLength={72}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? t.hidePassword : t.showPassword}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-fade-in">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t.signingIn}</>
                ) : mode === 'login' ? (
                  <><LogIn className="w-4 h-4 mr-2" /> {t.loginButton}</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" /> {t.registerButton}</>
                )}
              </Button>
            </form>

            <div className="text-center">
              {mode === 'login' ? (
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-sm text-primary hover:underline flex items-center justify-center gap-1.5 mx-auto"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {lang === 'pt' ? 'Primeiro acesso? Cadastre sua senha'
                    : lang === 'en' ? 'First access? Register your password'
                    : lang === 'pl' ? 'Pierwszy dostęp? Zarejestruj hasło'
                    : '¿Primer acceso? Registre su contraseña'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-sm text-primary hover:underline flex items-center justify-center gap-1.5 mx-auto"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {lang === 'pt' ? 'Já tem senha? Fazer login'
                    : lang === 'en' ? 'Already have a password? Sign in'
                    : lang === 'pl' ? 'Masz już hasło? Zaloguj się'
                    : '¿Ya tiene contraseña? Iniciar sesión'}
                </button>
              )}
            </div>
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
