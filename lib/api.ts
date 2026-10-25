import { backendUrlSetting } from "./backend";
import { sessionSetting, type Session } from "./session";

/** `status` 0 means the backend couldn't be reached at all. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Calls the backend with the saved address and login token. */
export async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const base = backendUrlSetting.get();
  if (!base) throw new ApiError("No backend address is set.", 0);

  const session = sessionSetting.get();
  const headers = new Headers(init.headers);
  if (session) headers.set("Authorization", `Bearer ${session.token}`);
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(`Could not reach the backend at ${new URL(base).host}.`, 0);
  }

  if (res.ok) return res;
  // An expired or revoked token: forget it, and the app sends the user to /login.
  if (res.status === 401 && session) sessionSetting.set(null);
  const detail = (await res.json().catch(() => null))?.detail;
  throw new ApiError(typeof detail === "string" ? detail : "Something went wrong.", res.status);
}

/** Fetches a track's thumbnail through the backend. Null if it can't: the cover is optional. */
export async function fetchThumbnail(src: string | null): Promise<Blob | null> {
  if (!src) return null;
  try {
    const res = await api(`/thumbnail?src=${encodeURIComponent(src)}`);
    return await res.blob();
  } catch {
    return null;
  }
}

export async function login(username: string, password: string): Promise<Session> {
  const res = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  const { token, username: name } = await res.json();
  const session = { token, username: name };
  sessionSetting.set(session);
  return session;
}

/** Ends the session on the backend if it's reachable, and always forgets it locally. */
export async function logout() {
  await api("/auth/logout", { method: "POST" }).catch(() => {});
  sessionSetting.set(null);
}
