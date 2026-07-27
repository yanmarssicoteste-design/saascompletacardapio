import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // ── Cloudflare Pages: serve todos os assets a partir da raiz ──
  base: '/',

  build: {
    // Diretório de saída (CF Pages aponta para 'dist' por padrão)
    outDir: 'dist',
    // Gera sourcemaps apenas em staging, não em produção
    sourcemap: false,
    // Tamanho máximo de chunk antes de warning (CF Pages sem limite real)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      // ── MPA: 4 entradas independentes ──
      input: {
        main:  resolve(__dirname, 'index.html'),
        auth:  resolve(__dirname, 'auth.html'),
        admin: resolve(__dirname, 'admin.html'),
        loja:  resolve(__dirname, 'loja.html'),
      },
      output: {
        // Nomeia os chunks por template de forma previsível no CDN
        chunkFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',
        entryFileNames:  'assets/[name]-[hash].js',
        // Divide Firebase e os templates em chunks separados para melhor cache
        manualChunks(id) {
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('templates/classic'))   return 'tpl-classic';
          if (id.includes('templates/editorial')) return 'tpl-editorial';
          if (id.includes('templates/dark'))      return 'tpl-dark';
        },
      },
    },
  },

  // ── Dev server ──
  server: {
    port: 5173,
    open: true,
  },
});
