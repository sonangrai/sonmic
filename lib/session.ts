import { createStoredSetting } from "./storedSetting";

export type Session = { token: string; username: string };

/**
 * The login token from the backend. Kept in localStorage because the app and the
 * backend are on different sites, where browsers block cookies.
 */
export const sessionSetting = createStoredSetting<Session | null>({
  key: "sonmic-session",
  parse: (raw) => {
    try {
      const value = JSON.parse(raw ?? "null");
      return typeof value?.token === "string" && typeof value?.username === "string"
        ? { token: value.token, username: value.username }
        : null;
    } catch {
      return null;
    }
  },
  serialize: (session) => (session ? JSON.stringify(session) : null),
});
