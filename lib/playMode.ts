import { playModes, type PlayMode } from "sonahang-ui";
import { createStoredSetting } from "./storedSetting";

/** In order / repeat all / repeat one / shuffle, remembered per browser. */
export const playModeSetting = createStoredSetting<PlayMode>({
  key: "sonmic-play-mode",
  parse: (raw) => (playModes as readonly string[]).includes(raw ?? "") ? (raw as PlayMode) : "sequential",
  serialize: (mode) => (mode === "sequential" ? null : mode),
});
