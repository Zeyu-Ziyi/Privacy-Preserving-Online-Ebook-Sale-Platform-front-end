import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills';
export default defineConfig({
  plugins: [react(),
    nodePolyfills(),
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
    },
  },
  optimizeDeps: {
    include: [
      'buffer',
      'process',
      'util', 
      'crypto-browserify',
      'stream-browserify'
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js', 
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})