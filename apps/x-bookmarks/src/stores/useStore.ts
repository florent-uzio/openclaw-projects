import { create } from 'zustand';

interface AppState {
  selectedFolderId: string | null | 'all';
  setSelectedFolderId: (id: string | null | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useStore = create<AppState>((set) => ({
  selectedFolderId: 'all',
  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
