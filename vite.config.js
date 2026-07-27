import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // ── Plugins: React (JSX/TSX) + Tailwind CSS v4 ──
  plugins: [
    react(),
    tailwindcss(),
  ],

  // ── Cloudflare Pages: serve todos os assets a partir da raiz ──
  base: '/',

  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      // ── MPA: 4 entradas independentes ──
      input: {
        main:  resolve(__dirname, 'index.html'),
        auth:  resolve(__dirname, 'auth.html'),
        admin: resolve(__dirname, 'admin.html'),
        loja:  resolve(__dirname, 'loja.html'),
      },
      output: {
        chunkFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',
        entryFileNames:  'assets/[name]-[hash].js',
        manualChunks(id) {
          if (id.includes('firebase'))            return 'vendor-firebase';
          if (id.includes('react-dom'))           return 'vendor-react';
          if (id.includes('lucide-react'))        return 'vendor-lucide';
          if (id.includes('templates/classic'))   return 'tpl-classic';
          if (id.includes('templates/editorial')) return 'tpl-editorial';
          if (id.includes('templates/dark'))      return 'tpl-dark';
        },
      },
    },
  },

  server: {
    port: 5173,
    open: true,
  },
});
