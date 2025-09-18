// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import BookPage from './pages/BookPage';
import SearchResultsPage from './pages/SearchResultsPage';
// --- 导入新页面 ---
import VerifyDownloadPage from './pages/VerifyDownloadPage'; // (您必须创建此文件)

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/book/:id" element={<BookPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        {/* --- 添加新路由 --- */}
        <Route path="verify/:purchaseId" element={<VerifyDownloadPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;