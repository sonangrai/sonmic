import { createStoredSetting } from "./storedSetting";

export type LastPlayed = { id: string; time: number };

/** The track that was loaded and how far in it was, so the player can pick up there. */
export const lastPlayedSetting = createStoredSetting<LastPlayed | null>({
  key: "sonmic-last-played",
  parse: (raw) => {
    try {
      const value = JSON.parse(raw ?? "null");
      return typeof value?.id === "string" && Number.isFinite(value?.time)
        ? { id: value.id, time: Math.max(0, value.time) }
        : null;
    } catch {
      return null;
    }
  },
  serialize: (value) => (value ? JSON.stringify(value) : null),
});
