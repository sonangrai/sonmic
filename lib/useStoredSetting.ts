import { useSyncExternalStore } from "react";
import type { StoredSetting } from "./storedSetting";

// Kept apart from storedSetting.ts so server code (the root layout) can import settings without a hook.
export function useStoredSetting<T>(setting: StoredSetting<T>): T {
  return useSyncExternalStore(setting.subscribe, setting.get, () => setting.serverValue);
}
