// src/main.jsx
// 在所有其他导入之前设置这些
import { Buffer } from 'buffer';
import process from 'process';

// 立即设置全局变量
globalThis.Buffer = Buffer;
globalThis.process = process;
window.Buffer = Buffer;
window.process = process;
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'

// 创建一个 QueryClient 实例
const queryClient = new QueryClient();

// 创建一个基础的 MUI 主题 (可以自定义颜色等)
const theme = createTheme({
  palette: {
    background: {
      default: '#f5f5f5' // 类似Z-Library的浅灰色背景
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline /> {/* 提供一个优雅的基础样式重置 */}
          <App />
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)