#!/bin/bash

# Direct test script for Claude 3.7 Sonnet
echo "========================================"
echo "Testing Claude 3.7 Sonnet Direct Integration"
echo "========================================"
echo

# Check if API key was provided
if [ -z "$1" ]; then
  echo "❌ No API key provided"
  echo "Usage: ./test-claude37.sh YOUR_ANTHROPIC_API_KEY"
  exit 1
fi

# Store API key
API_KEY=$1

# Test direct Claude integration
echo "Testing direct Claude 3.7 Sonnet API integration..."
cd server
node test-claude37-direct.js $API_KEY

# If that works, test our service wrapper
echo
echo "========================================"
echo "Testing Claude 3.7 Sonnet with service wrapper..."
echo "========================================"
echo
node test-claude37.js $API_KEY

echo
echo "If both tests completed successfully, your Claude 3.7 Sonnet integration is working!"
echo "Next, try running the minimal server with:"
echo "./troubleshoot-server.sh"