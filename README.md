# Liminal Type Chat

An open-source, local-first GenAI chat application designed for individuals and small teams who want to leverage their own API keys to interact with various language models (LLMs).

## Documentation

- [Development Standards](docs/DEVELOPMENT_STANDARDS.md) - Coding standards, patterns, and best practices
- [Error Codes](docs/ERROR_CODES.md) - Complete error code reference

## Project Status

### Initial Development Plan

- ✅ **Milestone 0**: Project Initialization & First Commit - **COMPLETED**
  - Set up the Node.js/TypeScript project structure and configuration files
  - Initialize Git repository and perform initial commit

- ✅ **Milestone 1**: Basic HTTP Server & Domain Health Endpoint - **COMPLETED**
  - Stand up Express.js application with architectural folder structure
  - Implement domain health check endpoint and comprehensive error handling
  - Add unit and integration tests with proper coverage

- ⬜ **Milestone 2**: SQLite Database Connectivity & Domain DB Health Endpoint
  - Set up SQLite with better-sqlite3 and create database provider
  - Implement health check table and schema initialization
  - Extend health service with database connection checks
  - Add database health check endpoint

- ⬜ **Milestone 3**: Edge-to-Domain Pattern Implementation for Health Checks
  - Implement domain client adapter pattern for tier communication
  - Create edge routes that use the domain client to access domain services
  - Add support for both direct and HTTP communication modes
  - Implement comprehensive test suite for both communication modes

- ⬜ **Milestone 4**: React TypeScript Frontend with Health Check Features
  - Create React TypeScript frontend with modern, responsive design
  - Implement server and database health check components
  - Configure build process to deploy to Express static directory
  - Add comprehensive component and integration tests

### Future Conversation Functionality

- ⬜ **Milestone 5**: Core Conversation Models & Storage
  - Implement conversation and message data models
  - Create conversation repository and services
  - Set up SQLite tables for storing conversations and messages

- ⬜ **Milestone 6**: LLM Provider Integration
  - Implement OpenAI provider as first BYOK vendor
  - Create provider abstraction layer for future LLM providers
  - Add authentication and API key management

- ⬜ **Milestone 7**: Chat Interface & Basic Functionality
  - Build conversation UI with chat interface
  - Implement real-time message display and history
  - Add basic prompt templating

- ⬜ **Milestone 8**: Advanced Features & Deployment
  - Add support for multiple LLM providers
  - Implement conversation chain functionality
  - Create deployment packaging for local installations

## Features

- **BYOK (Bring Your Own Key)**: Use your own API keys with models from OpenAI, Anthropic, Google, and other providers
- **Local-First Design**: Run the entire application locally for privacy and control
- **Simple Deployment**: Minimal setup with Node.js and a web browser
- **Advanced LLM Orchestration**: Send prompts to multiple LLMs and chain outputs (future)
- **Extensibility Framework**: Pre and post LLM hooks, plugin system (future)

## Project Structure

This project is organized as a monorepo with separate packages for the server and client applications:

```
liminal-type-chat/
├── client/                  # React frontend application
│   ├── src/                 # Frontend source code
│   ├── test/                # Frontend tests
│   ├── package.json         # Frontend dependencies
│   └── tsconfig.json        # TypeScript configuration for frontend
├── server/                  # Node.js backend application
│   ├── src/                 # Backend source code
│   │   ├── config/          # Configuration
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Domain services
│   │   └── utils/           # Utilities
│   ├── test/                # Backend tests
│   │   ├── unit/            # Unit tests
│   │   └── integration/     # Integration tests
│   ├── package.json         # Backend dependencies
│   └── tsconfig.json        # TypeScript configuration for backend
└── docs/                    # Project documentation
```

The application follows a tiered architecture within each package:

- **Domain Tier**: Contains core business logic (services)
- **Edge/XPI Tier**: Handles API routes, transformations
- **UI Tier**: Handles presentation (React components) and response formats
- **Testing**: Jest with Supertest, high test coverage requirements

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/liminal-type-chat.git
   cd liminal-type-chat
   ```

2. Install dependencies for both client and server:
   ```bash
   npm install
   ```

3. Create a `.env` file for the server based on the example:
   ```bash
   cp server/.env.example server/.env
   ```

### Development

#### Running the Server

```bash
# From the root directory
npm run dev:server

# Or from the server directory
cd server
npm run dev
```

#### Running the Client (when implemented in Milestone 4)

```bash
# From the root directory
npm run dev:client

# Or from the client directory
cd client
npm start
```

### Running Tests

```bash
# Run server tests from root
npm run test:server

# Or from the server directory
cd server
npm test

# Run client tests (when implemented)
npm run test:client
```

### Building for Production

```bash
# Build both client and server
npm run build

# Start the production server
npm start
```

## License

MIT

## Contributing

This project is in early development. Contribution guidelines will be added soon.
