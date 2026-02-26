import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  applyDarkClass,
  getInitialDarkMode,
  persistDarkMode,
  THEME_STORAGE_KEY,
} from "./theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const current = localStorage.getItem(THEME_STORAGE_KEY);
    return current === null ? getInitialDarkMode() : current === "true";
  });

  useEffect(() => {
    applyDarkClass(darkMode);
    persistDarkMode(darkMode);
  }, [darkMode]);

  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      toggleDarkMode: () => setDarkMode((prev) => !prev),
    }),
    [darkMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }
  return ctx;
}
