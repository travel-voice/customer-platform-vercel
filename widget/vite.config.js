import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';

// Since we run vite from the root but point to this config, 
// __dirname will be the directory containing this file (customer-platform/widget)
const widgetDir = __dirname;
const rootDir = path.resolve(widgetDir, '..');

export default defineConfig({
  root: widgetDir, // Set root to widget directory so it finds files correctly
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
  ],
  build: {
    // Output relative to the widgetDir (root option)
    outDir: path.resolve(rootDir, 'public'),
    emptyOutDir: false,
    lib: {
      entry: path.resolve(widgetDir, 'src/app.jsx'),
      name: 'NeuralVoiceWidget',
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
