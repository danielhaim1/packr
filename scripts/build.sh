#!/bin/bash

# * Build Rust components
echo "Building Rust components..."
cargo build --release

# * Run postinstall
echo "Running postinstall..."
node scripts/postinstall.js

echo "Build complete!" 