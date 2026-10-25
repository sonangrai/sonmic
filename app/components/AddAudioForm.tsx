"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import { Alert, Button, Input, Text } from "sonahang-ui";
import { ApiError, api, fetchThumbnail } from "@/lib/api";
import { saveAudio, type SavedAudio } from "@/lib/audioStore";
import { backendUrlSetting } from "@/lib/backend";
import { useStoredSetting } from "@/lib/useStoredSetting";

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
  const backendUrl = useStoredSetting(backendUrlSetting);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ReactNode>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api("/download", {
        method: "POST",
        body: JSON.stringify({ url: url.trim() }),
      });
      const [blob, thumbnail] = await Promise.all([
        res.blob(),
        fetchThumbnail(res.headers.get("X-Thumbnail-Url")),
      ]);
      const item: SavedAudio = {
        id: crypto.randomUUID(),
        title: titleFromDisposition(res.headers.get("Content-Disposition")) ?? "Untitled",
        sourceUrl: url.trim(),
        blob,
        ...(thumbnail && { thumbnail }),
        createdAt: Date.now(),
      };
      await saveAudio(item);
      // Ask the browser not to evict our storage under pressure; ignored if unsupported.
      navigator.storage?.persist?.();
      setUrl("");
      onSaved(item);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 0 ? (
          <>
            {err.message} Is it running? If the address changed, update it in{" "}
            <Link href="/settings">Settings</Link>.
          </>
        ) : err instanceof Error ? (
          err.message
        ) : (
          "Something went wrong."
        ),
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

      {backendUrl && (
        <Text variant="caption" color="subtle">
          Downloading through {new URL(backendUrl).host} ·{" "}
          <Link href="/settings">Change in Settings</Link>
        </Text>
      )}
    </form>
  );
}
