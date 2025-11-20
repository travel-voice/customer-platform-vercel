const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const postcssConfigPath = path.join(rootDir, 'postcss.config.mjs');
const tempConfigPath = path.join(rootDir, 'postcss.config.mjs.bak');

// Check if config exists
if (fs.existsSync(postcssConfigPath)) {
  console.log('Renaming postcss.config.mjs to avoid conflict...');
  fs.renameSync(postcssConfigPath, tempConfigPath);
}

try {
  console.log('Running widget build...');
  // Run vite from local node_modules
  execSync('npx vite build -c widget/vite.config.js', { 
    stdio: 'inherit',
    cwd: rootDir 
  });
  console.log('Widget build successful.');
} catch (error) {
  console.error('Widget build failed.');
  process.exit(1);
} finally {
  // Always rename back
  if (fs.existsSync(tempConfigPath)) {
    console.log('Restoring postcss.config.mjs...');
    fs.renameSync(tempConfigPath, postcssConfigPath);
  }
}

