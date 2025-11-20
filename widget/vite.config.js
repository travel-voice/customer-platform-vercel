import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
  ],
  build: {
    outDir: '../public',
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/app.jsx'),
      name: 'NeuralVoiceWidget',
      fileName: () => 'widget.js',
      formats: ['iife'], // Immediately Invoked Function Expression for direct browser use
    },
    rollupOptions: {
      // Ensure external dependencies are bundled since this is a standalone widget
      // We do NOT want to externalize React, we want to bundle it
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

