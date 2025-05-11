/**
 * Deploy script to copy React build files to the server's public directory
 */
const fs = require('fs-extra');
const path = require('path');

// Paths
const buildDir = path.resolve(__dirname, '../dist');
const publicDir = path.resolve(__dirname, '../../server/public');

// Check if build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  console.log('Creating public directory...');
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy build files to public directory
console.log('Copying build files to server public directory...');

try {
  // Clean the public directory first
  fs.emptyDirSync(publicDir);
  
  // Copy files
  fs.copySync(buildDir, publicDir, { overwrite: true });
  
  console.log('✅ Successfully deployed to server/public directory');
} catch (err) {
  console.error('❌ Error deploying files:', err);
  process.exit(1);
}
