// src/store/useAuthStore.js
import { create } from 'zustand';

// Helper function: safely initialize state from localStorage
const getToken = () => localStorage.getItem('jwtToken');
const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('jwtUser'));
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  isAuthenticated: !!getToken(),
  user: getUser(),
  token: getToken(),

  login: (userData, token) => {
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('jwtUser', JSON.stringify(userData));
    set({ isAuthenticated: true, user: userData, token: token });
  },

  logout: () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('jwtUser');
    set({ isAuthenticated: false, user: null, token: null });
  },
  
}));