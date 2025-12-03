import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';

const widgetDir = __dirname;
const rootDir = path.resolve(widgetDir, '..');

export default defineConfig({
  root: widgetDir,
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
  ],
  css: {
    // Explicitly define an empty plugin list to stop Vite/PostCSS from searching for a config file
    postcss: {
      plugins: []
    },
  },
  build: {
    outDir: path.resolve(rootDir, 'public'),
    emptyOutDir: false,
    lib: {
      entry: path.resolve(widgetDir, 'src/app.jsx'),
      name: 'TravelVoiceWidget',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
    rollupOptions: {
      external: [], 
    },
    minify: 'esbuild',
  },
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify('production'),
    },
  },
});
