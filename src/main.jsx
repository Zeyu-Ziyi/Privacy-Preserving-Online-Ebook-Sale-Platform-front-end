// src/main.jsx
import { Buffer } from 'buffer';
import process from 'process';

// Set global variables immediately
globalThis.Buffer = Buffer;
globalThis.process = process;
// window.Buffer = Buffer;
// window.process = process;
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'

// Create a QueryClient instance
const queryClient = new QueryClient();

// Create a basic MUI theme
const theme = createTheme({
  palette: {
    background: {
      default: '#f5f5f5' 
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline /> 
          <App />
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)