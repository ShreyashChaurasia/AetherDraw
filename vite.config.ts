import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env.IS_PREACT': JSON.stringify('false'),
  },
  resolve: {
    alias: {
      elkjs: path.resolve(__dirname, 'node_modules/elkjs/lib/elk.bundled.js'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
