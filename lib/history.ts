export interface HistoryEntry {
  id: string;
  createdAt: number;
  title: string;
  tone: string;
  language: string;
  length: string;
  text: string;
  pdfBase64?: string;
}

const KEY = 'lkdt_history';
const MAX = 20;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveToHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): void {
  const full: HistoryEntry = {
    ...entry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    createdAt: Date.now(),
  };
  const list = [full, ...loadHistory()].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // quota exceeded: retry stripping PDFs
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify(list.map(({ pdfBase64: _p, ...e }) => e))
      );
    } catch { /* give up */ }
  }
}

export function removeFromHistory(id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadHistory().filter((e) => e.id !== id)));
  } catch { /* ignore */ }
}

export async function blobUrlToBase64(url: string): Promise<string | undefined> {
  try {
    const blob = await fetch(url).then((r) => r.blob());
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}
