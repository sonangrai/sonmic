// Audio blobs are too large for localStorage (~5 MB, strings only), so they live in IndexedDB.

const DB_NAME = "sonmic";
const STORE = "audio";

export type SavedAudio = {
  id: string;
  title: string;
  sourceUrl: string;
  blob: Blob;
  createdAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function listAudio(): Promise<SavedAudio[]> {
  const items = await run<SavedAudio[]>("readonly", (s) => s.getAll());
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveAudio(item: SavedAudio): Promise<void> {
  await run("readwrite", (s) => s.put(item));
}

export async function deleteAudio(id: string): Promise<void> {
  await run("readwrite", (s) => s.delete(id));
}
