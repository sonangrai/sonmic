"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Alert, Button, Input } from "sonahang-ui";
import {
  backendUrlSetting,
  isBackendReachable,
  normalizeBackendUrl,
} from "@/lib/backend";
import { sessionSetting } from "@/lib/session";

export function SetupForm() {
  const router = useRouter();
  const [draft, setDraft] = useState(() => backendUrlSetting.get() ?? "");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const url = normalizeBackendUrl(draft);
    if (!url) {
      setError("Enter a full address, like https://example.trycloudflare.com");
      return;
    }
    setError(null);
    setChecking(true);
    const ok = await isBackendReachable(url);
    setChecking(false);
    if (!ok) {
      setError(`Couldn't reach a sonmic backend at ${new URL(url).host}.`);
      return;
    }
    backendUrlSetting.set(url);
    router.replace(sessionSetting.get() ? "/player" : "/login");
  }

  return (
    // noValidate: the browser would reject "host.example" without a scheme; normalizeBackendUrl adds it.
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <Input
        label="Backend address"
        type="url"
        inputMode="url"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="https://example.trycloudflare.com"
        helperText="Run pnpm backend on the Mac and paste the address it prints."
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
        autoFocus
      />
      {error && <Alert variant="error">{error}</Alert>}
      <Button
        type="submit"
        loading={checking}
        disabled={!draft.trim()}
        fullWidth
      >
        {checking ? "Connecting…" : "Connect"}
      </Button>
    </form>
  );
}
