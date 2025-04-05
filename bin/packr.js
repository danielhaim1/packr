#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const binary = path.join(__dirname, 'packr');

if (!fs.existsSync(binary)) {
  console.error(`Binary not found at ${binary}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const child = spawn(binary, args, {
  stdio: 'inherit',
  shell: false
});

child.on('close', (code) => process.exit(code));
child.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
