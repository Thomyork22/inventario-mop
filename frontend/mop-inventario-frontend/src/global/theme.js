export const THEME_STORAGE_KEY = "pref_dark";
export const DARK_CLASS = "dark";

function readStoredDarkMode() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "true") return true;
  if (saved === "false") return false;
  return null;
}

export function getInitialDarkMode() {
  if (typeof window === "undefined") return false;

  const stored = readStoredDarkMode();
  if (stored !== null) return stored;

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}

export function applyDarkClass(isDark) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  if (isDark) root.classList.add(DARK_CLASS);
  else root.classList.remove(DARK_CLASS);
}

export function persistDarkMode(isDark) {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, String(isDark));
}

export function initTheme() {
  const isDark = getInitialDarkMode();
  applyDarkClass(isDark);
  persistDarkMode(isDark);
  return isDark;
}
