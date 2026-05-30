import React, { createContext, useContext, useMemo, useState } from "react";
import { translations } from "./translations";

type Language = "es" | "qu";

interface LanguageContextProps {
  language: Language;
  setLanguage: (language: Language) => void;
  t: typeof translations.es;
}

const LanguageContext = createContext<LanguageContextProps | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("geoterra_language") as Language) || "es";
  });

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem("geoterra_language", nextLanguage);
    // Dispatch general storage event to update other potential listeners
    window.dispatchEvent(new Event("storage"));
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage debe usarse dentro de un LanguageProvider");
  }
  return context;
}
