#!/bin/bash
# Database backup script for Liminal Type Chat
# This script creates backups of the SQLite database

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# Configuration
DB_PATH="../db/liminal-chat.db"
BACKUP_DIR="../db/backups"
DATE_FORMAT=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/liminal-chat-backup-$DATE_FORMAT.db"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
  echo -e "${RED}Database file not found at $DB_PATH${NC}"
  exit 1
fi

# Create backup
echo -e "${YELLOW}Creating database backup...${NC}"
if [ -f "$DB_PATH" ]; then
  if cp "$DB_PATH" "$BACKUP_FILE"; then
    echo -e "${GREEN}Database backup created successfully: ${BACKUP_FILE}${NC}"
    echo -e "${YELLOW}Backup file size: $(du -h "$BACKUP_FILE" | cut -f1)${NC}"
    
    # List recent backups
    echo -e "${GREEN}Recent backups:${NC}"
    ls -la "$BACKUP_DIR" | grep "liminal-chat-backup-" | tail -n 5
    
    exit 0
  else
    echo -e "${RED}Failed to create database backup${NC}"
    exit 1
  fi
else
  echo -e "${RED}Database file not found${NC}"
  exit 1
fi
