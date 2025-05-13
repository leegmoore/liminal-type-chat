# Liminal Type Chat - Server Management Scripts

This directory contains management scripts for the Liminal Type Chat server, providing tools for server control, database management, and development environment setup.

## NPM Scripts

In addition to the shell scripts in this directory, the server provides the following npm scripts in `package.json`:

```bash
# Development server with auto-reload
npm run dev

# Compile TypeScript to JavaScript
npm run build

# Run the production server (requires build first)
npm run start

# Run with ts-node without building
npm run start:dev

# Build and run in production mode
npm run start:prod

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run linter
npm run lint

# Run linter and automatically fix issues
npm run lint:fix
```

## Available Scripts

### Server Control

**`server-control.sh`** - Main script for managing the server process

```bash
# Start the server
./scripts/server-control.sh start

# Stop the server
./scripts/server-control.sh stop

# Restart the server
./scripts/server-control.sh restart

# Check server status
./scripts/server-control.sh status
```

### Database Management

**`db-backup.sh`** - Create a backup of the SQLite database

```bash
./scripts/db-backup.sh
```

**`db-health-check.sh`** - Check the health and integrity of the SQLite database

```bash
./scripts/db-health-check.sh
```

### Development Environment

**`dev-setup.sh`** - Set up the development environment with required directories and configurations

```bash
./scripts/dev-setup.sh
```

## Script Configuration

All scripts use the server's configuration settings and maintain a consistent approach to:

1. Port management (8765 by default)
2. Database location
3. Color-coded output for better readability
4. Error handling and status reporting

## Using from Project Root

You can run these scripts from the project root using:

```bash
./server/scripts/server-control.sh start
```

Or navigate to the server directory first:

```bash
cd server
./scripts/server-control.sh start
```

## Creating New Scripts

When adding new management scripts:

1. Place them in this directory
2. Make them executable with `chmod +x scriptname.sh`
3. Follow the existing pattern for consistent output formatting
4. Update this README with documentation
