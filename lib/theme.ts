import { createStoredSetting } from "./storedSetting";

// "system" means no data-theme attribute: sonahang-ui then follows prefers-color-scheme.
export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "sonmic-theme";

/** Runs in <head> before first paint so a saved theme never flashes the default. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export const themeSetting = createStoredSetting<Theme>({
  key: STORAGE_KEY,
  parse: (raw) => (raw === "light" || raw === "dark" ? raw : "system"),
  serialize: (theme) => (theme === "system" ? null : theme),
});

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function setTheme(theme: Theme) {
  applyTheme(theme);
  themeSetting.set(theme);
}
