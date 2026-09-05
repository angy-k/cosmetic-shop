"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { dictionaries, DEFAULT_LANGUAGE, translate, plural as pluralFor } from "../lib/translations";
import { API_URL } from "../lib/apiUrl";

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => key,
  plural: () => "",
});

// Reactive replacement for lib/translations' plain t()/pluralSr() - mirrors
// ThemeProvider (localStorage + synced account preference), so components
// using useTranslation() re-render on language change.
export function useTranslation() {
  return useContext(LanguageContext);
}

export default function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, apiCall } = useAuth();

  // Initialize from localStorage once on the client, matching ThemeProvider's hydration handling.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("language");
      if (stored === "sr" || stored === "en") {
        setLanguageState(stored);
      }
    } catch {}
    setMounted(true);
  }, []);

  // Reflect the language on <html lang>, like ThemeProvider's data-theme.
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = language;
  }, [language, mounted]);

  // Pull the logged-in user's saved language preference, so it follows the
  // account rather than just the browser.
  useEffect(() => {
    const saved = user?.preferences?.language;
    if ((saved === "sr" || saved === "en") && saved !== language) {
      setLanguageState(saved);
    }
    // Re-run only when the user's saved preference changes, not on every local switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.preferences?.language]);

  const setLanguage = (lang) => {
    if (lang !== "sr" && lang !== "en") return;
    setLanguageState(lang);
    try {
      localStorage.setItem("language", lang);
    } catch {}

    if (isAuthenticated) {
      apiCall(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        body: JSON.stringify({
          preferences: { ...user?.preferences, language: lang },
        }),
      }).catch(() => {
        // Best-effort - the switch already happened locally either way.
      });
    }
  };

  const value = useMemo(() => {
    const dict = dictionaries[language] || dictionaries[DEFAULT_LANGUAGE];
    return {
      language,
      setLanguage,
      t: (key, params) => translate(dict, key, params),
      plural: (wordKey, count) => pluralFor(language, wordKey, count),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, isAuthenticated, user]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
