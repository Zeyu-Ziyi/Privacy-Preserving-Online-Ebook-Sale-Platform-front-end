// src/store/useAuthStore.js
import { create } from 'zustand';

// 帮助函数：从 localStorage 安全地初始化状态
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
  // purchasedBooks 数组不再需要，因为购买状态在服务器上

  login: (userData, token) => {
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('jwtUser', JSON.stringify(userData));
    set({ isAuthenticated: true, user: userData, token: token });
  },

  logout: () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('jwtUser');
    set({ isAuthenticated: false, user: null, token: null });
    // 登出时应导航到首页 (这在 Header.jsx 中处理)
  },
  
  // 原来的 purchaseBook action 被移除，因为它将被新的支付流程取代
}));