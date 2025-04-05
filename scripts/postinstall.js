// * ! ==================================================
// * ! Postinstall script for Packr
// * ! ==================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// * Check if user has write permissions for a directory
function hasWritePermission(dirPath) {
	try {
		const testFile = path.join(dirPath, '.permission-test');
		fs.writeFileSync(testFile, 'test');
		fs.unlinkSync(testFile);
		return true;
	} catch (err) {
		return false;
	}
}

// * Check if user has execute permissions for a file
function hasExecutePermission(filePath) {
	try {
		fs.accessSync(filePath, fs.constants.X_OK);
		return true;
	} catch (err) {
		return false;
	}
}

// * Set file permissions with error handling
function setFilePermissions(filePath, mode) {
	try {
		fs.chmodSync(filePath, mode);
		return true;
	} catch (err) {
		console.error(`Failed to set permissions on ${filePath}: ${err.message}`);
		return false;
	}
}

// * Ensure bin directory exists and is writable
const binDir = path.join(__dirname, '..', 'bin');
if (!fs.existsSync(binDir)) {
	try {
		fs.mkdirSync(binDir, { recursive: true });
	} catch (err) {
		console.error(`Failed to create bin directory: ${err.message}`);
		process.exit(1);
	}
}

if (!hasWritePermission(binDir)) {
	console.error('No write permission for bin directory');
	process.exit(1);
}

const isWindows = process.platform === 'win32';
const cliPath = path.join(binDir, 'packr.js');
const destBinaryName = isWindows ? 'packr.exe' : 'packr';
const destBinaryPath = path.join(binDir, destBinaryName);

// * Copy Rust binary from target directory
const targetDir = path.join(__dirname, '..', 'target', 'release');
const sourceBinaryName = isWindows ? 'asset-pipeline.exe' : 'asset-pipeline';
const sourceBinaryPath = path.join(targetDir, sourceBinaryName);

if (!fs.existsSync(sourceBinaryPath)) {
	console.error(`Rust binary not found at ${sourceBinaryPath}`);
	console.error('Please run "npm run build" first');
	process.exit(1);
}

try {
	fs.copyFileSync(sourceBinaryPath, destBinaryPath);
} catch (err) {
	console.error(`Failed to copy binary: ${err.message}`);
	process.exit(1);
}

// * Set binary permissions
if (!setFilePermissions(destBinaryPath, '755')) {
	process.exit(1);
}

// * CLI wrapper script for running the Rust binary
const cliScript = `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const binary = path.join(__dirname, ${isWindows ? `'packr.exe'` : `'packr'`});

if (!fs.existsSync(binary)) {
  console.error(\`Binary not found at \${binary}\`);
  process.exit(1);
}

const args = process.argv.slice(2);
const child = spawn(binary, args, {
  stdio: 'inherit',
  shell: ${isWindows}
});

child.on('close', (code) => process.exit(code));
child.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
`.trim() + '\n';

// * Write CLI script with permission check
try {
	fs.writeFileSync(cliPath, cliScript);
} catch (err) {
	console.error(`Failed to write CLI script: ${err.message}`);
	process.exit(1);
}

// * Set CLI script permissions
if (!setFilePermissions(cliPath, '755')) {
	process.exit(1);
}

console.log('Packr installation complete!');