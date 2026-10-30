import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      // The server's guard accepts only its own host and origin.
      '/api': {
        target: 'http://localhost:3433',
        changeOrigin: true,
        configure: (proxy) => {
          // Only the dev page's own origin is translated, so the guard still rejects other sites.
          proxy.on('proxyReq', (proxyReq) => {
            if (proxyReq.getHeader('origin') === 'http://localhost:5173') {
              proxyReq.setHeader('origin', 'http://localhost:3433')
            }
          })
        },
      },
    },
  },
})
