# Server Not Working Investigation

## Problem Statement
Server claims to be listening on port 8765 but:
- API calls fail with "fetch failed"
- lsof shows nothing on port 8765
- Multiple nodemon processes were running
- Can't verify if auth removal actually works for users

## Initial Discovery
- Found 16 node processes running!
- Multiple nodemon instances competing for the same port
- Server says it's listening but port is likely blocked by another process

## Hypotheses

### H1: Port Conflict (CONFIRMED)
Multiple node processes trying to bind to the same port. When one fails, it doesn't error out properly.

### H2: Nodemon Not Cleaning Up
Nodemon is spawning new processes without killing old ones, leading to zombie processes.

### H3: Auth Removal Broke Something
The auth removal might have introduced an error that's preventing proper startup.

### H4: Database Lock
SQLite database might be locked by multiple processes.

## Test Plan

1. Kill all processes and start fresh
2. Start server with simple node instead of nodemon
3. Check if server actually responds
4. If it works, investigate nodemon configuration

## Test Results

### Test 1: Clean start
- Killed all 16 node processes
- Need to start fresh and test