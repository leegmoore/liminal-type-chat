# Liminal Type Chat - Server

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

- ✅ **Basic HTTP Server & Domain Health Endpoint** (Milestone 1)
  - Express.js application with architectural folder structure
  - Domain health check endpoint
  - Comprehensive error handling

- ✅ **SQLite Database Connectivity & Health Checks** (Milestone 2)
  - SQLite with better-sqlite3 integration
  - Database provider interface
  - Health check table and schema initialization
  - Database health check endpoint

- ✅ **Edge-to-Domain Communication** (Milestone 3)
  - Domain client adapter pattern
  - Support for both direct and HTTP communication modes
  - Edge tier health check routes

- ✅ **React Frontend Serving** (Milestone 4)
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

- **GET /api/health** - Domain tier health check
- **GET /api/health/db** - Database health check
- **GET /api/edge/health** - Edge tier health check
- **GET /api/edge/health/db** - Edge tier database health check

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
