#!/bin/bash
# Development environment setup script for Liminal Type Chat
# This script initializes the development environment with required directories and configurations

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# Configuration
SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_DIR="${SERVER_DIR}/db"
LOG_DIR="${SERVER_DIR}/logs"

echo -e "${YELLOW}Setting up development environment for Liminal Type Chat server...${NC}"
echo -e "${YELLOW}Server directory: ${SERVER_DIR}${NC}"

# Create necessary directories
echo -e "${YELLOW}Creating required directories...${NC}"

# Create database directory
if [ ! -d "$DB_DIR" ]; then
  mkdir -p "$DB_DIR"
  echo -e "${GREEN}Created database directory: $DB_DIR${NC}"
else
  echo -e "${GREEN}Database directory already exists: $DB_DIR${NC}"
fi

# Create database backups directory
if [ ! -d "$DB_DIR/backups" ]; then
  mkdir -p "$DB_DIR/backups"
  echo -e "${GREEN}Created database backups directory: $DB_DIR/backups${NC}"
else
  echo -e "${GREEN}Database backups directory already exists: $DB_DIR/backups${NC}"
fi

# Create logs directory
if [ ! -d "$LOG_DIR" ]; then
  mkdir -p "$LOG_DIR"
  echo -e "${GREEN}Created logs directory: $LOG_DIR${NC}"
else
  echo -e "${GREEN}Logs directory already exists: $LOG_DIR${NC}"
fi

# Check for .env file and create if it doesn't exist
if [ ! -f "${SERVER_DIR}/.env" ]; then
  echo -e "${YELLOW}Creating default .env file...${NC}"
  cat > "${SERVER_DIR}/.env" << EOF
# Liminal Type Chat Server Environment Variables
NODE_ENV=development
PORT=8765
DB_PATH=${DB_DIR}/liminal-chat.db
IN_PROCESS_MODE=true
API_BASE_URL=http://localhost:8765
LOG_LEVEL=debug
EOF
  echo -e "${GREEN}Created default .env file${NC}"
else
  echo -e "${GREEN}.env file already exists${NC}"
fi

# Install dependencies if package.json exists
if [ -f "${SERVER_DIR}/package.json" ]; then
  echo -e "${YELLOW}Checking for npm dependencies...${NC}"
  if [ ! -d "${SERVER_DIR}/node_modules" ]; then
    echo -e "${YELLOW}Installing npm dependencies...${NC}"
    cd "${SERVER_DIR}" && npm install
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Dependencies installed successfully${NC}"
    else
      echo -e "${RED}Failed to install dependencies${NC}"
    fi
  else
    echo -e "${GREEN}Dependencies are already installed${NC}"
  fi
fi

# Build the project
echo -e "${YELLOW}Building project...${NC}"
cd "${SERVER_DIR}" && npm run build
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Project built successfully${NC}"
else
  echo -e "${RED}Failed to build project${NC}"
fi

echo -e "${GREEN}Development environment setup complete${NC}"
echo -e "${YELLOW}You can now start the server using: ${GREEN}./scripts/server-control.sh start${NC}"
