import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env.IS_PREACT': JSON.stringify('false'),
  },
  server: {
    port: 3000,
    host: true,
  },
});
