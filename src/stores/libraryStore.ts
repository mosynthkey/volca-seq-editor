import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { SequenceState } from '@/types/sequence';
import { normalizeSequenceState } from '@/types/sequenceFactory';

export interface LibraryItem {
  id: string;
  savedAt: number;
  state: SequenceState;
}

const STORAGE_KEY = 'volca-seq-editor-library';

const loadLibrary = (): LibraryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LibraryItem[];
    return parsed.map(item => ({
      ...item,
      state: normalizeSequenceState(item.state, item.state.device),
    }));
  } catch {
    return [];
  }
};

export const useLibraryStore = defineStore('library', () => {
  const items = ref<LibraryItem[]>(loadLibrary());

  const persist = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value));
  };

  const save = (state: SequenceState) => {
    const item: LibraryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      savedAt: Date.now(),
      state: normalizeSequenceState({
        ...state,
        name: state.name || `Pattern ${items.value.length + 1}`,
      }, state.device),
    };
    items.value = [item, ...items.value];
    persist();
    return item;
  };

  const remove = (id: string) => {
    items.value = items.value.filter(item => item.id !== id);
    persist();
  };

  const clear = () => {
    items.value = [];
    persist();
  };

  return { items, save, remove, clear };
});
