import { THEME_STORAGE_KEY } from "@uganda-cbc-sms/brand";

export type ThemeChoice = "light" | "dark" | "system";

export function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  if (choice === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return choice;
}

export function applyTheme(choice: ThemeChoice) {
  const resolved = resolveTheme(choice);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function setThemeChoice(choice: ThemeChoice) {
  localStorage.setItem(THEME_STORAGE_KEY, choice);
  applyTheme(choice);
}

export function readThemeChoice(): ThemeChoice {
  return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeChoice | null) ?? "system";
}

/** Inline script for layout — prevents flash of wrong theme on static pages */
export function themeInitScript() {
  return `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k)||'system';var d=s==='dark'||(s==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
}
