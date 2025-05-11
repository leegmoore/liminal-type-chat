#!/bin/bash
# Database health check script for Liminal Type Chat
# This script performs basic health checks on the SQLite database

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# Configuration
DB_PATH="../db/liminal-chat.db"

# Check if sqlite3 is installed
if ! command -v sqlite3 &> /dev/null; then
  echo -e "${RED}Error: sqlite3 command not found. Please install SQLite.${NC}"
  exit 1
fi

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
  echo -e "${RED}Database file not found at $DB_PATH${NC}"
  exit 1
fi

# Check database integrity
echo -e "${YELLOW}Checking database integrity...${NC}"
INTEGRITY=$(sqlite3 "$DB_PATH" "PRAGMA integrity_check;")
if [ "$INTEGRITY" == "ok" ]; then
  echo -e "${GREEN}Database integrity check: PASSED${NC}"
else
  echo -e "${RED}Database integrity check: FAILED${NC}"
  echo -e "${RED}$INTEGRITY${NC}"
fi

# Check database size
DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
echo -e "${YELLOW}Database size: $DB_SIZE${NC}"

# Count tables
TABLE_COUNT=$(sqlite3 "$DB_PATH" "SELECT count(*) FROM sqlite_master WHERE type='table';")
echo -e "${YELLOW}Number of tables: $TABLE_COUNT${NC}"

# List tables
echo -e "${YELLOW}Tables in database:${NC}"
sqlite3 "$DB_PATH" ".tables"

# Show schema for health_checks table
echo -e "\n${YELLOW}Schema for health_checks table:${NC}"
sqlite3 "$DB_PATH" ".schema health_checks"

# Count records in health_checks table
HEALTH_COUNT=$(sqlite3 "$DB_PATH" "SELECT count(*) FROM health_checks;")
echo -e "${YELLOW}Records in health_checks table: $HEALTH_COUNT${NC}"

# Show recent health checks
echo -e "\n${YELLOW}Recent health checks:${NC}"
sqlite3 "$DB_PATH" "SELECT * FROM health_checks ORDER BY timestamp DESC LIMIT 5;"
