import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { type LanguageCode, type Translation, translations, getLocale } from './translations';

interface I18nContextValue {
  lang: LanguageCode;
  t: Translation;
  setLang: (code: LanguageCode) => void;
  locale: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'scorecard-lang';

function getInitialLang(): LanguageCode {
  if (typeof window === 'undefined') return 'pt';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'pt' || stored === 'en' || stored === 'pl' || stored === 'es') return stored;
  return 'pt';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(getInitialLang);

  const setLang = useCallback((code: LanguageCode) => {
    setLangState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value: I18nContextValue = {
    lang,
    t: translations[lang],
    setLang,
    locale: getLocale(lang),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider');
  return ctx;
}
