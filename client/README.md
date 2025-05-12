# Liminal Type Chat - Client (`/client`)

[<< Back to Root README](../README.md)

This directory contains the React TypeScript frontend for the Liminal Type Chat application. The frontend implements a modern, responsive UI for monitoring the health of both the domain and edge tiers of the application.

## Directory Structure

- `src/` - Frontend source code
  - `components/` - Reusable UI components
  - `pages/` - Page-level components
  - `services/` - API services and data access
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions
- `public/` - Static assets
- `scripts/` - Deployment and utility scripts
- `build/` - Production build output (generated during build process)

## Features

### Implemented (Milestone 4)

- Health Check Dashboard
  - Domain and edge tier health monitoring
  - Server health status checks
  - Database connection verification
  - Visual status indicators
  - Responsive layout for all device sizes

- Modern UI with Chakra UI
  - Clean, accessible component library
  - Consistent styling and theming
  - Responsive design principles

- Type Safety
  - Full TypeScript implementation
  - Shared types between components
  - Type-safe API communication

### Planned for Future Milestones

- Chat interface for interacting with various LLMs
- Support for conversation history and context management
- API key management and provider selection

## Development

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The development server will start on port 3000 and automatically proxy API requests to the backend server running on port 8765.

### Testing

```bash
# Run tests
npm test

# Run tests with coverage report
npm test -- --coverage
```

The project maintains a minimum of 80% test coverage across all components.

### Building and Deployment

```bash
# Build for production
npm run build

# Deploy to server's public directory
npm run deploy
```

The deploy script automatically copies the built assets to the server's public directory for serving.
