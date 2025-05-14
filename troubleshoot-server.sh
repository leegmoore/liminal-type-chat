#!/bin/bash

# Troubleshooting script for Claude 3.7 Sonnet integration
echo "========================================"
echo "Liminal Type Chat - Troubleshooting Tool"
echo "========================================"
echo

# 1. Check environment
echo "Checking environment..."
if [ ! -f "./server/.env.local" ]; then
  echo "❌ .env.local file is missing in server directory"
  echo "   Creating a default .env.local file..."
  cp "./server/.env.local.example" "./server/.env.local" 2>/dev/null || echo "   Failed to create .env.local file"
else
  echo "✅ .env.local file exists"
fi

# 2. Check authentication bypass
grep -q "BYPASS_AUTH=true" "./server/.env.local" 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✅ Authentication bypass is enabled"
else
  echo "❌ Authentication bypass is not enabled"
  echo "   Add BYPASS_AUTH=true to your .env.local file"
fi

# 3. Check if JWT fix is applied
grep -q "typeof this.expiresIn" "./server/src/providers/auth/jwt/JwtService.ts" 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✅ JWT type handling fix is applied"
else
  echo "❌ JWT type handling fix is not applied"
fi

# 4. Try to start the minimal server
echo
echo "Starting minimal server for testing..."
echo "Press Ctrl+C to stop the server when done testing."
echo

# Set an empty ANTHROPIC_API_KEY if none is set to avoid errors
export ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-""}

# Start the server
# First, try to determine which server to run
if [ -f "./server/super-minimal-server.js" ]; then
  echo "Found super-minimal-server.js - using implementation with NO dependencies"
  cd server && node super-minimal-server.js
elif [ -f "./server/dev-server.js" ]; then
  echo "Found dev-server.js - using mock implementation without dependencies"
  cd server && node dev-server.js
else
  echo "Using minimal server implementation"
  cd server && node minimal-server.js
fi