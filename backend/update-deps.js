/**
 * This script helps fix the deprecated dependencies by removing the package-lock.json
 * and node_modules, then reinstalling everything with the overrides in package.json.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if package-lock.json exists and remove it
const packageLockPath = path.join(__dirname, 'package-lock.json');
if (fs.existsSync(packageLockPath)) {
  console.log('Removing package-lock.json...');
  fs.unlinkSync(packageLockPath);
}

// Check if node_modules exists and remove it
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('Removing node_modules directory...');
  
  // Use a cross-platform way to remove directories
  try {
    if (process.platform === 'win32') {
      execSync('rmdir /s /q "' + nodeModulesPath + '"', { stdio: 'inherit' });
    } else {
      execSync('rm -rf "' + nodeModulesPath + '"', { stdio: 'inherit' });
    }
    console.log('node_modules removed successfully');
  } catch (error) {
    console.error('Failed to remove node_modules:', error.message);
  }
}

// Reinstall dependencies
console.log('Reinstalling dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('\nDependencies reinstalled successfully!');
  console.log('\nThe overrides in package.json should have fixed the deprecated packages.');
} catch (error) {
  console.error('Failed to reinstall dependencies:', error.message);
}
