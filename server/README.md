# Liminal Type Chat - Server (`/server`)

[<< Back to Root README](../README.md)

This directory contains the Node.js/Express backend for the Liminal Type Chat application. The server follows a tiered architecture and provides both the API endpoints and serves the React frontend.

## Directory Structure

- `src/` - Backend source code
  - `config/` - Configuration management
  - `middleware/` - Express middleware
  - `providers/` - Service providers
    - `db/` - Database providers (SQLite)
  - `routes/` - API routes
    - `domain/` - Domain tier routes
    - `edge/` - Edge tier routes
  - `services/` - Domain services
  - `utils/` - Utility functions
- `db/` - SQLite database
- `public/` - Static assets and React frontend build
- `test/` - Test files
  - `unit/` - Unit tests
  - `integration/` - Integration tests
- `scripts/` - Server management scripts

## Features

### Implemented

- **Basic HTTP Server & Domain Health Endpoint** (Milestone 0002)
  - Express.js application with architectural folder structure
  - Domain health check endpoint
  - Comprehensive error handling

- **SQLite Database Connectivity & Health Checks** (Milestone 0003)
  - SQLite with better-sqlite3 integration
  - Database provider interface
  - Health check table and schema initialization
  - Database health check endpoint

- **Core ContextThread Domain Layer** (Milestone 0006)
  - ContextThread and Message domain models
  - ContextThreadRepository for data persistence
  - ContextThreadService with standardized business logic
  - ContextThread normalization utilities
  - Domain API routes for context thread and message operations

- **Edge-to-Domain Communication** (Milestone 0004)
  - Domain client adapter pattern
  - Support for both direct and HTTP communication modes
  - Edge tier health check routes

- **React Frontend Serving** (Milestone 0005)
  - Serves the React frontend from the public directory
  - Catch-all routing for client-side React Router
  - API routes for health checks used by the frontend

## Development

### Getting Started

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

The server will start on port 8765 (or the port specified in your .env file).

### Server Management

The `scripts/` directory contains several utility scripts for server management:

```bash
# Start the server
./scripts/server-control.sh start

# Stop the server
./scripts/server-control.sh stop

# Check server status
./scripts/server-control.sh status

# Restart the server
./scripts/server-control.sh restart
```

### Database Operations

```bash
# Create a database backup
./scripts/db-backup.sh

# Check database health
./scripts/db-health-check.sh
```

### Testing

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Generate test coverage report
npm run test:coverage
```

The project maintains a minimum of 90% test coverage for domain services and 80% for other components.

## API Endpoints

### Health Check Endpoints

- **GET /api/v1/domain/health** - Domain tier system health check
- **GET /api/v1/domain/health/db** - Domain tier database health check
- **GET /api/v1/edge/health** - Edge tier system health check (via domain client)
- **GET /api/v1/edge/health/db** - Edge tier database health check (via domain client)

### ContextThread Domain API Endpoints

- **POST /api/v1/domain/threads** - Create a new context thread (with optional initial message)
- **GET /api/v1/domain/threads/:id** - Get a context thread by ID
- **PUT /api/v1/domain/threads/:id** - Update a context thread
- **DELETE /api/v1/domain/threads/:id** - Delete a context thread
- **POST /api/v1/domain/threads/:id/messages** - Add a message to a context thread
- **GET /api/v1/domain/threads/:id/messages** - Get all messages in a context thread
- **PUT /api/v1/domain/threads/:id/messages/:messageId** - Update a message in a context thread

## Frontend Integration

The Express server serves the React frontend from the `public/` directory. When the React application is built and deployed (using the deploy script in the client directory), the build files are copied to this directory.

The server includes a catch-all route to support client-side routing:

```javascript
// Catch-all route for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
```

This ensures that all React routes function correctly when accessed directly via URL.
