#!/bin/bash
# Server control script for Liminal Type Chat server
# This script provides consistent management of the server process

SERVER_PORT=8765
SERVER_PROCESS_NAME="node dist/server.js"

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# Function to check if server is running
is_server_running() {
  pgrep -f "$SERVER_PROCESS_NAME" > /dev/null
  return $?
}

# Function to check if port is in use
is_port_in_use() {
  lsof -i:"$SERVER_PORT" > /dev/null 2>&1
  return $?
}

# Function to clear port if in use
clear_port() {
  if is_port_in_use; then
    echo -e "${YELLOW}Port $SERVER_PORT is in use. Attempting to free it...${NC}"
    
    # Get PID using the port
    PORT_PID=$(lsof -i:"$SERVER_PORT" -t)
    if [ ! -z "$PORT_PID" ]; then
      echo -e "${YELLOW}Killing process $PORT_PID using port $SERVER_PORT...${NC}"
      kill -9 $PORT_PID
      sleep 1
      
      if is_port_in_use; then
        echo -e "${RED}Failed to free port $SERVER_PORT. Please check manually with: lsof -i:$SERVER_PORT${NC}"
        return 1
      else
        echo -e "${GREEN}Successfully freed port $SERVER_PORT${NC}"
        return 0
      fi
    else
      echo -e "${RED}Could not determine process using port $SERVER_PORT${NC}"
      return 1
    fi
  else
    echo -e "${GREEN}Port $SERVER_PORT is available.${NC}"
    return 0
  fi
}

# Function to start the server
start_server() {
  echo -e "${YELLOW}Preparing to start Liminal Type Chat server on port $SERVER_PORT...${NC}"
  
  # Kill any server processes we're running
  if is_server_running; then
    echo -e "${YELLOW}Stopping any running server instances...${NC}"
    pkill -f "$SERVER_PROCESS_NAME" > /dev/null 2>&1
    sleep 1
  fi
  
  # Ensure the port is free
  clear_port
  if [ $? -ne 0 ]; then
    echo -e "${RED}Cannot start server because port $SERVER_PORT could not be freed.${NC}"
    return 1
  fi
  
  # Build and start the server
  echo -e "${GREEN}Starting server on port $SERVER_PORT...${NC}"
  PORT=$SERVER_PORT npm run build && PORT=$SERVER_PORT npm start
}

# Function to stop the server
stop_server() {
  echo "Stopping any running Liminal Type Chat server instances..."
  pkill -f "$SERVER_PROCESS_NAME" || echo "No server instances found running."
  
  # Give it a moment to shut down
  sleep 1
  
  # Double-check if server is still running
  if is_server_running; then
    echo "Server is still shutting down, sending SIGKILL..."
    pkill -9 -f "$SERVER_PROCESS_NAME"
  fi
  
  echo "Server stopped."
}

# Function to restart the server
restart_server() {
  stop_server
  echo "Waiting for port to be released..."
  sleep 2
  start_server
}

# Function to check server status
status_server() {
  if is_server_running; then
    echo "Liminal Type Chat server is RUNNING"
    echo "Process info:"
    ps -ef | grep "$SERVER_PROCESS_NAME" | grep -v grep
    
    # Get the port the server is actually running on
    PORT=$(lsof -i -P | grep LISTEN | grep node | awk '{print $9}' | sed 's/.*://')
    if [ ! -z "$PORT" ]; then
      echo "Server is listening on port: $PORT"
      echo "Dashboard URL: http://localhost:$PORT/dashboard"
    else
      echo "Server port could not be determined."
    fi
  else
    echo "Liminal Type Chat server is NOT running"
  fi
}

# Main script logic
case "$1" in
  start)
    if is_server_running; then
      echo "Server is already running. Use 'restart' to restart it."
      status_server
    else
      start_server
    fi
    ;;
  stop)
    stop_server
    ;;
  restart)
    restart_server
    ;;
  status)
    status_server
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac

exit 0
