// src/store/useSearchStore.js
import { create } from 'zustand'

export const useSearchStore = create((set) => ({
  query: '',
  // Set 'title' as the new default search type
  searchType: 'title', 
  setQuery: (query) => set({ query }),
  setSearchType: (searchType) => set({ searchType }),
}));