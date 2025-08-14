// src/store/useAuthStore.js
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,
  purchasedBooks: [], // 新增: 存储已购买书籍的ID

  login: () => set({
    isAuthenticated: true,
    user: { name: 'John Doe', email: 'john.doe@example.com' }
  }),

  logout: () => set({
    isAuthenticated: false,
    user: null,
    purchasedBooks: [] // 登出时清空购买记录
  }),

  // 新增: 购买一本书的 action
  purchaseBook: (bookId) => set((state) => ({
    // 确保不重复添加
    purchasedBooks: state.purchasedBooks.includes(bookId) 
      ? state.purchasedBooks 
      : [...state.purchasedBooks, bookId]
  })),
}));