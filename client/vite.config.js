// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      include: ['**/*.jsx', '**/*.js'],
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', {
            runtime: 'automatic'
          }]
        ]
      }
    })
  ],
  server: {
    host: true, // ✅ Enable access from other devices on same network
    proxy: {
      '/api': {
        target: 'https://api.yokebud.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
