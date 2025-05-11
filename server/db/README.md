# Database Directory

This directory contains the SQLite database files for the Liminal Type Chat application.

## Overview

- Database files are stored locally with the `.db` extension
- The default database file is `liminal-chat.db` (configurable in `.env`)
- Journal files may be created with the `.db-journal` extension

## Development Notes

- Database files are excluded from version control via `.gitignore`
- If running the application for the first time, the database will be automatically created
- To start with a fresh database, simply delete the `.db` file and restart the application

## Milestone 2 Implementation (Completed)

Milestone 2 has been completed with the following implementations:

### Database Provider
- Created a lightweight `DatabaseProvider` interface in `server/src/providers/db/database-provider.ts`
- Implemented `SQLiteProvider` class in `server/src/providers/db/sqlite-provider.ts` using the better-sqlite3 package
- Added methods for queries, executing statements, transactions, and health checks

### Health Check Table
- Automatically creates a `health_checks` table during initialization with the following schema:
  ```sql
  CREATE TABLE IF NOT EXISTS health_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    check_type TEXT NOT NULL,
    status TEXT NOT NULL,
    timestamp TEXT NOT NULL
  )
  ```
- Stores health check records when database checks are performed

### Health Service Integration
- Enhanced `HealthService` to accept an optional database provider
- Added `checkDbConnection()` method to verify database connectivity
- Integrated with the error handling system for consistent error responses

### Health Endpoint
- Added `/api/v1/domain/health/db` endpoint for checking database health
- Created a visual dashboard in the root route for testing health checks
