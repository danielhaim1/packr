#!/bin/bash

# * Get the release type from argument or default to patch
RELEASE_TYPE=${1:-patch}

# * Clean everything
echo "Cleaning..."
npm run clean:all

# * Bump version
echo "Bumping version to $RELEASE_TYPE..."
npm version $RELEASE_TYPE

# * Build
echo "Building..."
npm run build

# * Git operations
echo "Committing changes..."
git add -A
git commit -m "Release: v$(node -p "require('./package.json').version")"
git push
git push --tags

# * Publish
echo "Publishing to npm..."
npm publish

echo "Release complete!" 