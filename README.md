# Liminal Type Chat

An open-source, local-first GenAI chat application designed for individuals and small teams who want to leverage their own API keys to interact with various language models (LLMs).

## Documentation

- [Development Standards](docs/DEVELOPMENT_STANDARDS.md) - Coding standards, patterns, and best practices
- [Error Codes](docs/ERROR_CODES.md) - Complete error code reference
- [Roadmap](docs/ROADMAP.md) - Future enhancements and planned features
- [Security Policy](.github/SECURITY.md) - Security information and reporting vulnerabilities
- [Contributing](.github/CONTRIBUTING.md) - Guidelines for contributing to the project

## Project Status

### Initial Development Plan

- ✅ **Milestone 0**: Project Initialization & First Commit - **COMPLETED**
  - Set up the Node.js/TypeScript project structure and configuration files
  - Initialize Git repository and perform initial commit

- ✅ **Milestone 1**: Basic HTTP Server & Domain Health Endpoint - **COMPLETED**
  - Stand up Express.js application with architectural folder structure
  - Implement domain health check endpoint and comprehensive error handling
  - Add unit and integration tests with proper coverage

- ✅ **Milestone 2**: SQLite Database Connectivity & Domain DB Health Endpoint - **COMPLETED**
  - Set up SQLite with better-sqlite3 and create database provider
  - Implement health check table and schema initialization
  - Extend health service with database connection checks
  - Add database health check endpoint with visual dashboard

- ✅ **Milestone 3**: Edge-to-Domain Pattern Implementation for Health Checks - **COMPLETED**
  - Implemented domain client adapter pattern for tier communication
  - Created edge routes that use the domain client to access domain services
  - Added support for both direct and HTTP communication modes
  - Implemented comprehensive test suite for both communication modes
  - Enhanced health dashboard with domain and edge tier visualization

- ✅ **Milestone 4**: React TypeScript Frontend with Health Check Features - **COMPLETED**
  - Created React TypeScript frontend with Chakra UI for modern, responsive design
  - Implemented server and database health check components with real-time status display
  - Configured Vite build process with automatic deployment to Express static directory
  - Added comprehensive component and integration tests with 80% coverage
  - Implemented type-safe API communication with domain and edge tiers

### Next Development Phase

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
├── client/                  # React TypeScript frontend application
│   ├── scripts/             # Deployment and utility scripts
│   ├── src/                 # Frontend source code
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   ├── services/        # API services and data access
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   └── tsconfig.json        # TypeScript configuration for frontend
├── server/                  # Node.js backend application
│   ├── db/                  # SQLite database directory
│   ├── scripts/             # Server management scripts
│   ├── src/                 # Backend source code
│   │   ├── config/          # Configuration
│   │   ├── middleware/      # Express middleware
│   │   ├── providers/       # Service providers
│   │   │   └── db/          # Database providers (SQLite)
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

## Security & Privacy

Liminal Type Chat is designed as a local-first application, meaning your data primarily stays on your machine. However, please be aware of the following:

- When using external LLM providers, your prompts and data will be sent to their APIs
- If deploying the Edge tier to a cloud environment, ensure proper security measures are in place
- The application stores conversations in a local SQLite database by default
- Always keep your API keys secure and never share them

For more details, see our [Security Policy](.github/SECURITY.md).

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

#### Server Management Scripts

The project includes several useful server management scripts in the `server/scripts` directory:

```bash
# Start the server on port 8765
./server/scripts/server-control.sh start

# Stop the server
./server/scripts/server-control.sh stop

# Check server status
./server/scripts/server-control.sh status

# Create a database backup
./server/scripts/db-backup.sh

# Check database health and integrity
./server/scripts/db-health-check.sh

# Set up development environment
./server/scripts/dev-setup.sh
```

See the [Server Scripts README](server/scripts/README.md) for more details.

#### Running the Client

```bash
# From the client directory
cd client
npm start

# To build and deploy to the server
cd client
npm run deploy
```

### Running Tests

```bash
# Run server tests from root
npm run test:server

# Or from the server directory
cd server
npm test

# Run client tests
cd client
npm test
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
