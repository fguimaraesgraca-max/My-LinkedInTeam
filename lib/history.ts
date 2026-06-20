export interface HistoryEntry {
  id: string;
  createdAt: number;
  title: string;
  tone: string;
  language: string;
  length: string;
  text: string;
  hasPdf?: boolean;   // PDF stored in IndexedDB
  pdfBase64?: string; // legacy entries only
}

const KEY = 'lkdt_history';
const MAX = 20;

// ── localStorage ──────────────────────────────────────────────────────────────

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveToHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): string {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const full: HistoryEntry = { ...entry, id, createdAt: Date.now() };
  const list = [full, ...loadHistory()].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.map(({ pdfBase64: _p, ...e }) => e)));
    } catch { /* give up */ }
  }
  return id;
}

export function removeFromHistory(id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadHistory().filter((e) => e.id !== id)));
  } catch { /* ignore */ }
  deletePdfFromIdb(id).catch(() => {});
}

// ── IndexedDB for PDF blobs ───────────────────────────────────────────────────

const IDB_NAME = 'lkdt_pdfs';
const IDB_STORE = 'pdfs';

function openPdfDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePdfToIdb(entryId: string, blobUrl: string): Promise<void> {
  try {
    const blob = await fetch(blobUrl).then((r) => r.blob());
    const db = await openPdfDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(blob, entryId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* silently ignore */ }
}

export async function getPdfBlobUrl(entryId: string): Promise<string | undefined> {
  try {
    const db = await openPdfDb();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(entryId);
      req.onsuccess = () =>
        resolve(req.result ? URL.createObjectURL(req.result as Blob) : undefined);
      req.onerror = () => resolve(undefined);
    });
  } catch {
    return undefined;
  }
}

export async function deletePdfFromIdb(entryId: string): Promise<void> {
  try {
    const db = await openPdfDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(entryId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch { /* ignore */ }
}
