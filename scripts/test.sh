#!/bin/bash

# * Set environment
export NODE_ENV=production

# * Check if a specific test was requested
if [ -n "$1" ]; then
    echo "Running specific test: $1"
    node __tests__/test.js --test "$1"
else
    echo "Running all tests..."
    node __tests__/test.js
fi

# * Check exit code
if [ $? -eq 0 ]; then
    echo "Tests passed!"
else
    echo "Tests failed!"
    exit 1
fi 