"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioPlayer, Button, Drawer, EmptyState, Text } from "sonahang-ui";
import { deleteAudio, listAudio, type SavedAudio } from "@/lib/audioStore";
import { formatDate, formatSize } from "@/lib/format";
import { AddAudioForm } from "../components/AddAudioForm";
import { LibraryIcon, MicIcon, PlayPauseIcon } from "../components/icons";
import { Header } from "../components/layout/Header";
import { TrackLabel } from "../components/TrackLabel";
import "./player.css";

export function Player() {
  const [items, setItems] = useState<SavedAudio[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [adding, setAdding] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    listAudio()
      .then(setItems)
      .catch(() => setError("Could not read saved audio from browser storage."))
      .finally(() => setLoaded(true));
  }, []);

  // One object URL per blob; revoked when the list changes or the page unmounts.
  const urls = useMemo(
    () => new Map(items.map((item) => [item.id, URL.createObjectURL(item.blob)])),
    [items],
  );
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.title.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const currentIndex = items.findIndex((i) => i.id === currentId);
  const current = currentIndex >= 0 ? items[currentIndex] : null;
  const totalSize = items.reduce((sum, i) => sum + i.blob.size, 0);
  const isPlaying = (id: string) => id === currentId && playing;

  function play(id: string) {
    if (id === currentId) {
      const audio = audioRef.current;
      if (audio) void (audio.paused ? audio.play() : audio.pause());
      return;
    }
    setCurrentId(id);
  }

  function step(delta: 1 | -1) {
    if (items.length === 0) return;
    const next = (currentIndex + delta + items.length) % items.length;
    setCurrentId(items[next].id);
  }

  async function remove(id: string) {
    await deleteAudio(id);
    if (id === currentId) setCurrentId(null);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="player-shell">
      <div className="player-header">
        <Header search={{ value: query, onChange: setQuery }} onAdd={() => setAdding(true)} />
      </div>

      <aside className="player-sidebar" aria-label="Your library">
        <div className="sidebar-heading">
          <LibraryIcon />
          <Text variant="body" weight="semibold">
            Your Library
          </Text>
        </div>
        <ul className="sidebar-list">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="sidebar-item"
                data-active={item.id === currentId || undefined}
                onClick={() => play(item.id)}
              >
                <TrackLabel
                  title={item.title}
                  active={item.id === currentId}
                  subtitle={`Audio · ${formatSize(item.blob.size)}`}
                />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="player-main">
        <section className="hero">
          <div className="hero-cover" aria-hidden>
            <MicIcon />
          </div>
          <div className="hero-text">
            <Text variant="caption" weight="medium">
              Playlist
            </Text>
            <h1 className="hero-title">Saved Audio</h1>
            <Text variant="body-sm" color="subtle">
              {items.length} {items.length === 1 ? "track" : "tracks"} ·{" "}
              {formatSize(totalSize)}
            </Text>
          </div>
        </section>

        <div className="main-actions">
          <button
            type="button"
            className="play-fab"
            aria-label={playing ? "Pause" : "Play"}
            disabled={items.length === 0}
            onClick={() => play(currentId ?? items[0].id)}
          >
            <PlayPauseIcon playing={playing} />
          </button>
        </div>

        {error && (
          <Text variant="body-sm" color="subtle" className="main-message">
            {error}
          </Text>
        )}

        {loaded && items.length === 0 && (
          <EmptyState
            size="sm"
            title="Your library is empty"
            description="Save audio from a YouTube link and it will show up here."
            action={{ label: "Add audio", onClick: () => setAdding(true), variant: "primary" }}
          />
        )}

        {items.length > 0 && (
          <table className="track-table">
            <thead>
              <tr>
                <th className="col-index">#</th>
                <th>Title</th>
                <th className="col-date">Date added</th>
                <th className="col-size">Size</th>
                <th className="col-actions">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item, i) => (
                <tr
                  key={item.id}
                  className="track-row"
                  data-active={item.id === currentId || undefined}
                  onDoubleClick={() => play(item.id)}
                >
                  <td className="col-index">
                    <span className="track-number">
                      {isPlaying(item.id) ? <Equalizer /> : i + 1}
                    </span>
                    <button
                      type="button"
                      className="track-play"
                      aria-label={`${isPlaying(item.id) ? "Pause" : "Play"} ${item.title}`}
                      onClick={() => play(item.id)}
                    >
                      <PlayPauseIcon playing={isPlaying(item.id)} />
                    </button>
                  </td>
                  <td>
                    <TrackLabel title={item.title} active={item.id === currentId} />
                  </td>
                  <td className="col-date">
                    <Text variant="body-sm" color="subtle">
                      {formatDate(item.createdAt)}
                    </Text>
                  </td>
                  <td className="col-size">
                    <Text variant="body-sm" color="subtle">
                      {formatSize(item.blob.size)}
                    </Text>
                  </td>
                  <td className="col-actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete ${item.title}`}
                      onClick={() => remove(item.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      <footer className="player-bar">
        {current ? (
          <AudioPlayer
            ref={audioRef}
            className="player-bar-audio"
            src={urls.get(current.id)!}
            title={current.title}
            subtitle={formatSize(current.blob.size)}
            autoPlay
            onPrevious={() => step(-1)}
            onNext={() => step(1)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => (currentIndex < items.length - 1 ? step(1) : setPlaying(false))}
          />
        ) : (
          <Text variant="body-sm" color="subtle" className="player-bar-idle">
            Pick a track to start listening.
          </Text>
        )}
      </footer>

      <Drawer
        open={adding}
        onClose={() => setAdding(false)}
        title="Add audio"
        description="Paste a YouTube link to save its audio in this browser."
      >
        <AddAudioForm
          onSaved={(item) => {
            setItems((prev) => [item, ...prev]);
            setAdding(false);
          }}
        />
      </Drawer>
    </div>
  );
}

function Equalizer() {
  return (
    <span className="equalizer" aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}
