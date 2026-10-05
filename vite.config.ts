import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// npm run build          → dist/ (웹 배포용, Cloudflare Pages)
// npm run build:offline  → dist-offline/index.html (더블클릭으로 여는 한 파일 버전)
export default defineConfig(({ mode }) =>
  mode === 'offline'
    ? {
        base: './',
        plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
        publicDir: false,
        build: {
          target: 'es2020',
          outDir: 'dist-offline',
          assetsInlineLimit: () => true,
          chunkSizeWarningLimit: 50000,
        },
      }
    : {
        plugins: [react()],
        build: { target: 'es2020', chunkSizeWarningLimit: 2500 },
      },
);
