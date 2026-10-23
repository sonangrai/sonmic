"use client";

import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AudioPlaylist,
  type AudioTrack,
  Button,
  Dialog,
  Drawer,
  EmptyState,
  Text,
} from "sonahang-ui";
import { deleteAudio, listAudio, type SavedAudio } from "@/lib/audioStore";
import { formatDate, formatSize } from "@/lib/format";
import { lastPlayedSetting } from "@/lib/lastPlayed";
import { playModeSetting } from "@/lib/playMode";
import { useStoredSetting } from "@/lib/useStoredSetting";
import { AddAudioForm } from "../components/AddAudioForm";
import { ChevronUpIcon, LibraryIcon, MusicIcon, PlayPauseIcon } from "../components/icons";
import { Header } from "../components/layout/Header";
import { TrackLabel } from "../components/TrackLabel";
import "./player.css";

// Each track gets one object URL for as long as it's in the library. Rebuilding them
// whenever the list changed gave the playing track a new src and cut it off.
type LibraryItem = SavedAudio & { url: string };
const withUrl = (item: SavedAudio): LibraryItem => ({ ...item, url: URL.createObjectURL(item.blob) });

/** Jumps to `time`, unless the track had (almost) finished: then it starts from the top. */
function resumeFrom(audio: HTMLAudioElement, time: number) {
  if (time < audio.duration - 2) audio.currentTime = time;
}

// The phone layout in player.css, where tapping the bar opens the now-playing view.
const PHONE_QUERY = "(max-width: 720px)";

function createPlayerHost() {
  const node = document.createElement("div");
  node.className = "player-host";
  return node;
}

export function Player() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const playMode = useStoredSetting(playModeSetting);
  // The playlist's <audio> element, as state so effects can attach to it once it exists.
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  // Set when the user picks a track here; the playlist only auto-plays its own moves.
  const playOnSelect = useRef(false);
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<LibraryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  // The playlist renders into this node, which moves between the bar and the
  // now-playing dialog. A second playlist there would mean a second <audio> and cut
  // playback; moving the node keeps the same element, mid-track.
  const [playerNode, setPlayerNode] = useState<HTMLDivElement | null>(null);
  const [barSlot, setBarSlot] = useState<HTMLDivElement | null>(null);
  const [nowPlayingSlot, setNowPlayingSlot] = useState<HTMLDivElement | null>(null);

  // Created once the bar is in the page (not during render, which also runs on the server).
  const barSlotRef = useCallback((slot: HTMLDivElement | null) => {
    setBarSlot(slot);
    if (slot) setPlayerNode((node) => node ?? createPlayerHost());
  }, []);

  useEffect(() => {
    const slot = nowPlayingOpen ? nowPlayingSlot : barSlot;
    if (playerNode && slot && playerNode.parentNode !== slot) slot.appendChild(playerNode);
  }, [playerNode, barSlot, nowPlayingSlot, nowPlayingOpen]);

  // The dialog is a phone view; widening the window puts the player back in the bar.
  useEffect(() => {
    if (!nowPlayingOpen) return;
    const phone = window.matchMedia(PHONE_QUERY);
    const closeIfWide = () => !phone.matches && setNowPlayingOpen(false);
    phone.addEventListener("change", closeIfWide);
    return () => phone.removeEventListener("change", closeIfWide);
  }, [nowPlayingOpen]);

  // Load once per page instance. Next keeps this page alive (hidden) while you visit
  // other pages and re-runs effects on return; reloading then gave every track a new
  // object URL, which swapped the playing track's src and stopped it.
  const libraryLoaded = useRef(false);
  useEffect(() => {
    if (libraryLoaded.current) return;
    libraryLoaded.current = true;
    listAudio()
      .then((list) => {
        setItems(list.map(withUrl));
        // Reload the track from last time, if it's still in the library.
        const last = lastPlayedSetting.get();
        if (last && list.some((item) => item.id === last.id)) setSelectedId(last.id);
      })
      .catch(() => setError("Could not read saved audio from browser storage."))
      .finally(() => setLoaded(true));
  }, []);

  // Object URLs are released when a track is deleted, and by the browser when the page
  // closes. Not on effect cleanup: Next keeps this page alive (hidden) while you visit
  // other pages, so cleanups run on a trip to Settings and revoking there broke playback.

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.title.toLowerCase().includes(q)) : items;
  }, [items, query]);

  // The loaded track: the one picked, else the first, so the bar (and its play modes) is
  // ready before anything has played.
  const selectedIndex = items.findIndex((i) => i.id === selectedId);
  const currentIndex = selectedIndex >= 0 ? selectedIndex : items.length > 0 ? 0 : -1;
  const currentId = currentIndex >= 0 ? items[currentIndex].id : null;
  const totalSize = items.reduce((sum, i) => sum + i.blob.size, 0);
  const isPlaying = (id: string) => id === currentId && playing;

  // The playlist plays the whole library in saved order; search only filters the table.
  const tracks = useMemo<AudioTrack[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        src: item.url,
        title: item.title,
        subtitle: formatSize(item.blob.size),
      })),
    [items],
  );

  // AudioPlaylist has no play/pause callbacks, so follow the element itself.
  useEffect(() => {
    if (!audio) return;
    const sync = () => setPlaying(!audio.paused);
    const events = ["play", "pause", "ended", "emptied"] as const;
    events.forEach((e) => audio.addEventListener(e, sync));
    return () => events.forEach((e) => audio.removeEventListener(e, sync));
  }, [audio]);

  // Remember the loaded track and its position: on switching tracks, every few seconds
  // while playing, on pause, and when the page is hidden or left.
  useEffect(() => {
    if (!audio || !currentId) return;

    // Pick up where this track was left, but only on a freshly loaded element (a new
    // visit or a reload). Coming back from another page, the same element is still
    // here and may have kept playing; seeking then would rewind it.
    const saved = lastPlayedSetting.get();
    let position = saved?.id === currentId ? saved.time : 0;
    const seek = () => resumeFrom(audio, position);
    if (position > 0 && audio.currentTime < 0.5) {
      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) seek();
      else audio.addEventListener("loadedmetadata", seek, { once: true });
    }

    // Tracked here rather than read at save time: by teardown the element may be reset.
    const track = () => {
      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) position = audio.currentTime;
    };
    const save = () => lastPlayedSetting.set({ id: currentId, time: position });
    let lastSaved = 0;
    const saveWhilePlaying = () => {
      track();
      if (Date.now() - lastSaved < 3000) return;
      lastSaved = Date.now();
      save();
    };
    const saveOnPause = () => {
      track();
      save();
    };
    const saveIfHidden = () => {
      if (document.visibilityState === "hidden") save();
    };

    // Start from the element's real position: after a seek above, or a track that kept
    // playing while another page was open.
    track();
    save();
    audio.addEventListener("timeupdate", saveWhilePlaying);
    audio.addEventListener("pause", saveOnPause);
    document.addEventListener("visibilitychange", saveIfHidden);
    window.addEventListener("pagehide", save);
    return () => {
      audio.removeEventListener("loadedmetadata", seek);
      audio.removeEventListener("timeupdate", saveWhilePlaying);
      audio.removeEventListener("pause", saveOnPause);
      document.removeEventListener("visibilitychange", saveIfHidden);
      window.removeEventListener("pagehide", save);
      save();
    };
  }, [audio, currentId]);

  // Runs after the new track's src is committed, so play() starts the right one.
  useEffect(() => {
    if (!playOnSelect.current || !audio) return;
    playOnSelect.current = false;
    audio.play().catch(() => {});
  }, [currentIndex, audio]);

  function play(id: string) {
    if (id === currentId) {
      if (audio) void (audio.paused ? audio.play().catch(() => {}) : audio.pause());
      return;
    }
    playOnSelect.current = true;
    setSelectedId(id);
  }

  function openNowPlayingFromBar(event: MouseEvent) {
    if (tracks.length === 0 || !window.matchMedia(PHONE_QUERY).matches) return;
    // Leave the bar's own controls (play, skip, seek, volume) to do their job.
    if ((event.target as Element).closest("button, input, [role='slider']")) return;
    setNowPlayingOpen(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setDeleting(true);
    try {
      await deleteAudio(id);
      if (id === currentId) {
        // Stop rather than jump into another track's audio.
        audio?.pause();
        setSelectedId(null);
      }
      URL.revokeObjectURL(pendingDelete.url);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setPendingDelete(null);
    } catch {
      setError("Could not delete that audio from browser storage.");
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
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
            <MusicIcon />
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
            onClick={() => currentId && play(currentId)}
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
                      onClick={() => setPendingDelete(item)}
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

      <footer className="player-bar" onClick={openNowPlayingFromBar}>
        <div ref={barSlotRef} className="player-bar-slot" />
        {playerNode &&
          tracks.length > 0 &&
          createPortal(
            // Previous/Next, end-of-track and the play-mode button (in order, repeat all,
            // repeat one, shuffle) are handled by the playlist; it reports moves here.
            <AudioPlaylist
              ref={setAudio}
              className="player-bar-audio"
              label="Saved Audio"
              tracks={tracks}
              trackIndex={currentIndex}
              onTrackChange={(index) => setSelectedId(items[index].id)}
              playMode={playMode}
              onPlayModeChange={playModeSetting.set}
              hideTrackList
            />,
            playerNode,
          )}
        {tracks.length > 0 ? (
          <button
            type="button"
            className="player-bar-expand"
            aria-label="Open now playing"
            onClick={() => setNowPlayingOpen(true)}
          >
            <ChevronUpIcon />
          </button>
        ) : (
          <Text variant="body-sm" color="subtle" className="player-bar-idle">
            Add some audio to start listening.
          </Text>
        )}
      </footer>

      <Dialog
        open={nowPlayingOpen && tracks.length > 0}
        onClose={() => setNowPlayingOpen(false)}
        size="fullscreen"
        title="Now playing"
        closeLabel="Close now playing"
        className="now-playing"
      >
        <div className="now-playing-cover" aria-hidden>
          <MusicIcon />
        </div>
        <div ref={setNowPlayingSlot} className="now-playing-slot" />
      </Dialog>

      <Drawer
        open={adding}
        onClose={() => setAdding(false)}
        title="Add audio"
        description="Paste a YouTube link to save its audio in this browser."
      >
        <AddAudioForm
          onSaved={(item) => {
            setItems((prev) => [withUrl(item), ...prev]);
            setAdding(false);
          }}
        />
      </Drawer>

      <Dialog
        open={pendingDelete !== null}
        onClose={() => !deleting && setPendingDelete(null)}
        role="alertdialog"
        size="sm"
        title="Delete audio?"
        description={
          <>
            <strong>{pendingDelete?.title}</strong> will be removed from this browser. You&apos;ll
            need to download it again to play it.
          </>
        }
        footer={
          <>
            <Button
              variant="secondary"
              autoFocus
              disabled={deleting}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button loading={deleting} onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      />
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
