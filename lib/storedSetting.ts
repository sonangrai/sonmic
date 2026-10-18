export type StoredSetting<T> = {
  get: () => T;
  set: (value: T) => void;
  subscribe: (onChange: () => void) => () => void;
  /** What the server renders, since it can't see localStorage. */
  serverValue: T;
};

/**
 * A per-browser preference in localStorage that components can subscribe to.
 * `serialize` returns null for the default, which clears the stored value.
 */
export function createStoredSetting<T>({
  key,
  parse,
  serialize,
}: {
  key: string;
  parse: (raw: string | null) => T;
  serialize: (value: T) => string | null;
}): StoredSetting<T> {
  const changeEvent = `${key}-change`;
  // Same raw string → same value object; useSyncExternalStore loops if get() returns
  // a fresh object every call (as parsing JSON would).
  let cache: { raw: string | null; value: T } | null = null;

  return {
    get() {
      let raw: string | null = null;
      try {
        raw = localStorage.getItem(key);
      } catch {
        // Storage blocked: behave as if nothing is saved.
      }
      if (!cache || cache.raw !== raw) cache = { raw, value: parse(raw) };
      return cache.value;
    },
    set(value) {
      const raw = serialize(value);
      try {
        if (raw === null) localStorage.removeItem(key);
        else localStorage.setItem(key, raw);
      } catch {
        // Storage blocked: subscribers still hear about it for this page view.
      }
      window.dispatchEvent(new Event(changeEvent));
    },
    // Also listens for "storage", which fires when another tab changes the value.
    subscribe(onChange) {
      const onStorage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) onChange();
      };
      window.addEventListener(changeEvent, onChange);
      window.addEventListener("storage", onStorage);
      return () => {
        window.removeEventListener(changeEvent, onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    serverValue: parse(null),
  };
}
