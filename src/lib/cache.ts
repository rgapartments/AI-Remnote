// Audio-Cache: IndexedDB, Fallback In-Memory
const DB = "ai-voice-cache";
const STORE = "audio";
const mem = new Map<string, Blob>();

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function hashKey(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getCached(key: string): Promise<Blob | undefined> {
  if (mem.has(key)) return mem.get(key);
  try {
    const db = await open();
    return await new Promise((resolve) => {
      const r = db.transaction(STORE).objectStore(STORE).get(key);
      r.onsuccess = () => resolve(r.result as Blob | undefined);
      r.onerror = () => resolve(undefined);
    });
  } catch {
    return undefined;
  }
}

export async function putCached(key: string, blob: Blob): Promise<void> {
  mem.set(key, blob);
  try {
    const db = await open();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}
