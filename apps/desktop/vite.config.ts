import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: 'renderer',
  plugins: [
    react(),
    electron({
      main: {
        entry: path.resolve(__dirname, 'electron/main/index.ts'),
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron/main'),
            rollupOptions: {
              // pdfjs-dist gestiona su propio worker vía require.resolve() en tiempo
              // de ejecución (ver pdf-text-extractor.ts) — debe quedar externo por
              // completo, incluyendo subpaths como 'pdfjs-dist/legacy/build/pdf.mjs',
              // para que esa resolución apunte al paquete real en node_modules.
              // playwright/playwright-core tienen su propia lógica de lanzamiento de
              // navegador (usa `eval` y resuelve sus binarios descargados en
              // node_modules) — empaquetarlos rompe esa resolución.
              external: (id) =>
                id === '@prisma/client' ||
                id === 'electron' ||
                id.startsWith('pdfjs-dist') ||
                id.startsWith('playwright'),
            },
          },
        },
      },
      preload: {
        input: path.resolve(__dirname, 'electron/preload/index.ts'),
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron/preload'),
          },
        },
      },
    }),
  ],
  build: {
    outDir: '../dist',
  },
});
