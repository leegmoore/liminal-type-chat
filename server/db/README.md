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

## Milestone 2 Implementation

This database directory will be used in Milestone 2 when implementing:
- SQLite database connectivity
- Health check table and schema initialization
- Database connection checks for the health service
