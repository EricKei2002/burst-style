"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { buildSiteCopy, type Locale } from "./siteCopy";

export type { Locale } from "./siteCopy";

const STORAGE_KEY = "burst-style-locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ja") {
      setLocaleState(stored);
    } else if (navigator.language.toLowerCase().startsWith("ja")) {
      setLocaleState("ja");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale === "ja" ? "ja" : "en";
  }, [locale, hydrated]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useSiteCopy() {
  const { locale } = useLocale();
  return useMemo(() => buildSiteCopy(locale), [locale]);
}
