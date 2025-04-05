const fs = require('fs');
const path = require('path');

// * Clean up test directories
function cleanTests() {
  const testDirs = [
    'test-packr-default',
    'test-packr-custom-config',
    'test-packr-format',
    'test-packr-no-sourcemaps',
    'test-packr-minify',
    'test-packr-eslint',
    'test-packr-env'
  ];

  console.log('Cleaning test directories...');

  testDirs.forEach(dir => {
    const fullPath = path.resolve(__dirname, dir);
    if (fs.existsSync(fullPath)) {
      // Remove dist and public directories
      const distDir = path.resolve(fullPath, 'dist');
      const publicDir = path.resolve(fullPath, 'public');

      [distDir, publicDir].forEach(dir => {
        if (fs.existsSync(dir)) {
          console.log(`Removing ${dir}...`);
          fs.rmSync(dir, { recursive: true, force: true });
        }
      });
    }
  });

  console.log('Test directories cleaned successfully!');
}

// Run cleanup
cleanTests(); 