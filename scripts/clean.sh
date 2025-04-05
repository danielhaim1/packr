#!/bin/bash

# * Get clean type from argument or default to basic
CLEAN_TYPE=${1:-basic}

# * Clean test outputs
echo "Cleaning test outputs..."
node __tests__/clean.js

# * Clean build artifacts
echo "Cleaning build artifacts..."
rm -rf target/ bin/ .packr-config.json Cargo.lock
echo "Cleaned build artifacts"

# * If full clean requested, remove node_modules
if [ "$CLEAN_TYPE" = "full" ]; then
    echo "Cleaning dependencies..."
    rm -rf node_modules/
    echo "Cleaned all dependencies and build artifacts"
fi

echo "Clean complete!" 