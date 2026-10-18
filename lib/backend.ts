import { createStoredSetting } from "./storedSetting";

/** Turns user input into a clean base URL ("https://host[/path]"), or null if it isn't one. */
export function normalizeBackendUrl(input: string): string | null {
  const trimmed = input.trim();
  // URL() happily percent-encodes spaces into a hostname, so reject them up front.
  if (!trimmed || /\s/.test(trimmed)) return null;
  try {
    // No scheme given: local addresses are plain http (the backend has no certificate there).
    const scheme = /^(localhost|127\.0\.0\.1)(:|\/|$)/i.test(trimmed) ? "http" : "https";
    const url = new URL(/^[a-z]+:\/\//i.test(trimmed) ? trimmed : `${scheme}://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.hostname !== "localhost" && !url.hostname.includes(".")) return null;
    return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

/** Where the backend lives. Null until the user sets it on first launch (/setup). */
export const backendUrlSetting = createStoredSetting<string | null>({
  key: "sonmic-backend-url",
  parse: (raw) => (raw && normalizeBackendUrl(raw)) || null,
  serialize: (url) => url,
});

/** True only for a sonmic backend, not just any server that answers. */
export async function isBackendReachable(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(8000) });
    const body = await res.json().catch(() => null);
    return res.ok && body?.status === "ok" && body?.app === "sonmic";
  } catch {
    return false;
  }
}
