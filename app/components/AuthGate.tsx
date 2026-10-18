"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import { backendUrlSetting } from "@/lib/backend";
import { sessionSetting } from "@/lib/session";
import { useStoredSetting } from "@/lib/useStoredSetting";

const noop = () => () => {};

/**
 * Sends the user through first-launch setup and login.
 * - "app": needs a backend address and a session (player, settings).
 * - "login": needs a backend address; already logged in goes to the player.
 * - "setup": no requirements; just waits for the browser so forms can read saved values.
 *
 * This only steers the UI. The backend is what actually refuses requests without a
 * valid token, which matters because everything here runs in the user's browser.
 */
export function AuthGate({
  mode,
  children,
}: {
  mode: "app" | "login" | "setup";
  children: ReactNode;
}) {
  const router = useRouter();
  // localStorage isn't readable on the server or during hydration; wait for the client.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const backendUrl = useStoredSetting(backendUrlSetting);
  const session = useStoredSetting(sessionSetting);

  const redirectTo =
    !hydrated || mode === "setup"
      ? null
      : !backendUrl
      ? "/setup"
      : mode === "app" && !session
        ? "/login"
        : mode === "login" && session
          ? "/player"
          : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  // Re-check a saved login once per visit. A 401 clears it (see api()); an unreachable
  // backend is fine, so saved audio still plays while the backend is off.
  const token = session?.token;
  useEffect(() => {
    if (mode === "app" && token) void api("/auth/me").catch(() => {});
  }, [mode, token]);

  if (!hydrated || redirectTo) return null;
  return children;
}
