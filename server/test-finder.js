/**
 * Temporary script to help identify failing tests
 */
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// Get all test files
const testFiles = execSync('find test -name "*.test.ts"', { cwd: __dirname }).toString().trim().split('\n');

console.log('Found test files:', testFiles.length);

// Test each file individually
testFiles.forEach(file => {
  console.log(`\n\nTesting file: ${file}`);
  try {
    execSync(`npx jest ${file}`, { 
      cwd: __dirname,
      stdio: 'inherit'
    });
    console.log(`✅ PASSED: ${file}`);
  } catch (e) {
    console.log(`❌ FAILED: ${file}`);
  }
});
