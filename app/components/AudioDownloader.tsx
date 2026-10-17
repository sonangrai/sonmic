"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { Alert, Button, EmptyState, Input, Text } from "sonahang-ui";
import {
  deleteAudio,
  listAudio,
  saveAudio,
  type SavedAudio,
} from "@/lib/audioStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// FastAPI sends `filename*=utf-8''Encoded%20Name.m4a`; fall back to plain `filename="..."`.
function titleFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const encoded = header.match(/filename\*=utf-8''([^;]+)/i);
  const plain = header.match(/filename="?([^";]+)"?/i);
  const name = encoded ? decodeURIComponent(encoded[1]) : plain?.[1];
  return name ? name.replace(/\.[^.]+$/, "") : null;
}

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AudioDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SavedAudio[]>([]);

  useEffect(() => {
    listAudio()
      .then(setItems)
      .catch(() => setError("Could not read saved audio from browser storage."));
  }, []);

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
      setItems((prev) => [item, ...prev]);
      setUrl("");
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

  async function handleDelete(id: string) {
    await deleteAudio(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="downloader">
      <form className="downloader-form" onSubmit={handleSubmit}>
        <Input
          className="downloader-input"
          label="YouTube URL"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={loading}
        />
        <Button type="submit" loading={loading} disabled={!url.trim()}>
          {loading ? "Downloading…" : "Download"}
        </Button>
      </form>

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {items.length === 0 ? (
        <EmptyState
          size="sm"
          title="No saved audio yet"
          description="Paste a YouTube link above to save its audio in this browser."
        />
      ) : (
        <ul className="audio-list">
          {items.map((item) => (
            <AudioItem key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AudioItem({
  item,
  onDelete,
}: {
  item: SavedAudio;
  onDelete: (id: string) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Object URLs pin the blob in memory, so revoke on unmount.
  useEffect(() => {
    const objectUrl = URL.createObjectURL(item.blob);
    if (audioRef.current) audioRef.current.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [item.blob]);

  return (
    <li className="audio-item">
      <div className="audio-item-header">
        <div>
          <Text variant="body" weight="medium">
            {item.title}
          </Text>
          <Text variant="caption" color="subtle">
            {formatSize(item.blob.size)} ·{" "}
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onDelete(item.id)}>
          Delete
        </Button>
      </div>
      <audio ref={audioRef} controls preload="metadata" />
    </li>
  );
}
