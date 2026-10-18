"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Alert, Button, Input, Text } from "sonahang-ui";
import { ApiError, login } from "@/lib/api";
import { backendUrlSetting } from "@/lib/backend";
import { useStoredSetting } from "@/lib/useStoredSetting";

export function LoginForm() {
  const router = useRouter();
  const backendUrl = useStoredSetting(backendUrlSetting);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(username, password);
      router.replace("/player");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      setPassword("");
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Input
        label="Username"
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoFocus
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <Alert variant="error">{error}</Alert>}
      <Button type="submit" loading={pending} disabled={!username || !password} fullWidth>
        {pending ? "Logging in…" : "Log in"}
      </Button>
      {backendUrl && (
        <Text variant="caption" color="subtle" className="auth-footnote">
          Backend: {new URL(backendUrl).host} · <Link href="/setup">Change</Link>
        </Text>
      )}
    </form>
  );
}
