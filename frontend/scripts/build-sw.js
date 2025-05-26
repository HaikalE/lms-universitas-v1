const fs = require('fs');
const path = require('path');

// Path to the service worker file
const swPath = path.join(__dirname, '../public/sw.js');
const buildPath = path.join(__dirname, '../build');
const buildSwPath = path.join(buildPath, 'sw.js');

// Ensure build directory exists
if (!fs.existsSync(buildPath)) {
  console.log('Build directory not found, skipping service worker copy');
  process.exit(0);
}

// Copy service worker to build directory
try {
  if (fs.existsSync(swPath)) {
    fs.copyFileSync(swPath, buildSwPath);
    console.log('Service worker copied to build directory');
  } else {
    console.log('Service worker source file not found, skipping copy');
  }
} catch (error) {
  console.error('Error copying service worker:', error);
  process.exit(1);
}
