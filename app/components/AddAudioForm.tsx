"use client";

import { type FormEvent, useState } from "react";
import { Alert, Button, Input } from "sonahang-ui";
import { saveAudio, type SavedAudio } from "@/lib/audioStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// FastAPI sends `filename*=utf-8''Encoded%20Name.m4a`; fall back to plain `filename="..."`.
function titleFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const encoded = header.match(/filename\*=utf-8''([^;]+)/i);
  const plain = header.match(/filename="?([^";]+)"?/i);
  const name = encoded ? decodeURIComponent(encoded[1]) : plain?.[1];
  return name ? name.replace(/\.[^.]+$/, "") : null;
}

/** Downloads a YouTube link's audio via the backend and stores it in IndexedDB. */
export function AddAudioForm({ onSaved }: { onSaved: (item: SavedAudio) => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const detail = body?.detail;
        throw new Error(
          typeof detail === "string" ? detail : "Enter a valid YouTube URL.",
        );
      }

      const blob = await res.blob();
      const item: SavedAudio = {
        id: crypto.randomUUID(),
        title: titleFromDisposition(res.headers.get("Content-Disposition")) ?? "Untitled",
        sourceUrl: url.trim(),
        blob,
        createdAt: Date.now(),
      };
      await saveAudio(item);
      // Ask the browser not to evict our storage under pressure; ignored if unsupported.
      navigator.storage?.persist?.();
      setUrl("");
      onSaved(item);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Could not reach the backend. Is it running?"
          : err instanceof Error
            ? err.message
            : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="add-audio-form" onSubmit={handleSubmit}>
      <Input
        label="YouTube URL"
        type="url"
        placeholder="https://www.youtube.com/watch?v=..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        disabled={loading}
        autoFocus
      />
      <Button type="submit" loading={loading} disabled={!url.trim()} fullWidth>
        {loading ? "Downloading…" : "Download"}
      </Button>

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
    </form>
  );
}
