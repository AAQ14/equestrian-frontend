import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server forwards /api and /auth calls to Spring Boot on port 8000.
// The browser only talks to localhost:5173, so the backend needs NO CORS config.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
    },
  },
});
