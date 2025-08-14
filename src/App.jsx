// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import BookPage from './pages/BookPage'; // 引入BookPage
import SearchResultsPage from './pages/SearchResultsPage'; // 引入新页面

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/book/:id" element={<BookPage />} />
        {/* 新增: 搜索结果页面的路由 */}
        <Route path="/search" element={<SearchResultsPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;