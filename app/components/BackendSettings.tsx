"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Button, Input, Text } from "sonahang-ui";
import { backendUrlSetting, isBackendReachable, normalizeBackendUrl } from "@/lib/backend";
import { useStoredSetting } from "@/lib/useStoredSetting";
import "./backend-settings.css";

const statusLabel = {
  checking: "Checking…",
  online: "Connected",
  offline: "Not reachable",
} as const;

/** Lets each device point the app at wherever the backend is running right now. */
export function BackendSettings() {
  const savedUrl = useStoredSetting(backendUrlSetting);
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  // Keyed by URL so a stale answer for a previous address never shows.
  const [check, setCheck] = useState<{ url: string; ok: boolean } | null>(null);

  const status = check?.url === savedUrl ? (check.ok ? "online" : "offline") : "checking";

  function runCheck(url: string) {
    void isBackendReachable(url).then((ok) => setCheck({ url, ok }));
  }

  useEffect(() => {
    if (savedUrl) runCheck(savedUrl);
  }, [savedUrl]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (draft === null) return;
    const url = normalizeBackendUrl(draft);
    if (!url) {
      setInvalid(true);
      return;
    }
    backendUrlSetting.set(url);
    setDraft(null);
  }

  return (
    // noValidate: the browser would reject "host.example" without a scheme; normalizeBackendUrl adds it.
    <form className="backend-settings" onSubmit={handleSubmit} noValidate>
      <Input
        label="Address"
        type="url"
        inputMode="url"
        placeholder="https://example.trycloudflare.com"
        helperText="Run pnpm backend on your Mac and paste the address it prints."
        error={invalid ? "Enter a full address, like https://example.trycloudflare.com" : undefined}
        value={draft ?? savedUrl ?? ""}
        onChange={(e) => {
          setDraft(e.target.value);
          setInvalid(false);
        }}
      />
      <div className="backend-settings-row">
        <span className="backend-status" data-status={status} role="status">
          <span className="backend-status-dot" aria-hidden />
          <Text as="span" variant="body-sm" color="subtle">
            {statusLabel[status]}
          </Text>
        </span>
        {status === "offline" && draft === null && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCheck(null);
              if (savedUrl) runCheck(savedUrl);
            }}
          >
            Check again
          </Button>
        )}
        <Button type="submit" variant="secondary" size="sm" disabled={draft === null}>
          Save
        </Button>
      </div>
    </form>
  );
}
