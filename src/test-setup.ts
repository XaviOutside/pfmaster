import '@testing-library/jest-dom/vitest';
import './test-utils/i18n'; // Mock useTranslation — returns keys as values
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// In-memory Storage polyfill for environments where localStorage is unavailable.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

function isUsableStorage(candidate: unknown): candidate is Storage {
  try {
    const storage = candidate as Storage;
    storage.setItem('__probe__', '1');
    storage.removeItem('__probe__');
    return true;
  } catch {
    return false;
  }
}

// Node.js 23+ ships an experimental `globalThis.localStorage` that is undefined
// when --localstorage-file is not provided. It shadows jsdom's window.localStorage,
// leaving tests with NO working localStorage at all. Guarantee a usable one:
// prefer the real global, then jsdom's, then fall back to MemoryStorage.
(function ensureLocalStorage() {
  if (isUsableStorage(globalThis.localStorage)) return;

  const win = (globalThis as { window?: { localStorage?: unknown } }).window;
  const fallback = isUsableStorage(win?.localStorage) ? win.localStorage : new MemoryStorage();

  Object.defineProperty(globalThis, 'localStorage', {
    value: fallback,
    writable: true,
    configurable: true,
  });
})();

afterEach(() => {
  cleanup();
});
