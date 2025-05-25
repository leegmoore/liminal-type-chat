# Liminal Type Chat

An open-source, local-first GenAI chat application designed for individuals and small teams who want to leverage their own API keys to interact with various language models (LLMs).

## Documentation

### Core Reference Documentation

- [Development Standards](wiki/engineering/standards/development-standards.md) - Coding standards, patterns, and best practices
- [Automated Testing Guide](wiki/engineering/standards/automated-testing.md) - Comprehensive testing strategy and best practices
- [Security Architecture](wiki/security/architecture.md) - Security principles and architecture
- [Security Implementation](wiki/security/implementation.md) - Guide for implementing security features
- [Error Codes](wiki/engineering/reference/error-codes.md) - Complete error code reference
- [Roadmap](wiki/project/roadmap.md) - Future enhancements and planned features

### Other Resources

- [Security Policy](.github/SECURITY.md) - Security information and reporting vulnerabilities
- [Contributing](.github/CONTRIBUTING.md) - Guidelines for contributing to the project
- [Development Journals](in-progress-docs/journals/) - Historical development records and insights

## Documentation Structure

Navigating the project documentation:

- **`/README.md` (this file):** Project overview, top-level setup, and main entry point.
- **[`server/README.md`](./server/README.md):** Backend (Node.js/Express) specific setup, architecture details, and API information.
- **[`client/README.md`](./client/README.md):** Frontend (React/TypeScript) specific setup, components, and state management details.
- **[`wiki/`](./wiki/):** Contains stable, curated reference documentation:
    - [`wiki/engineering/`](./wiki/engineering/): Technical standards, reference material, and implementation guides.
        - [`standards/`](./wiki/engineering/standards/): Coding standards, testing requirements, and best practices.
        - [`reference/`](./wiki/engineering/reference/): Technical reference material like error codes and API design.
        - [`frontend/`](./wiki/engineering/frontend/): Frontend architecture and component documentation.
        - [`backend/`](./wiki/engineering/backend/): Backend architecture and service documentation.
        - [`database/`](./wiki/engineering/database/): Database schema and data access information.
    - [`wiki/security/`](./wiki/security/): Security model, implementation details, and best practices.
    - [`wiki/project/`](./wiki/project/): Project planning, roadmap, and milestone information.
    - [`wiki/api/`](./wiki/api/): API documentation and usage examples.
    - [`wiki/guides/`](./wiki/guides/): Developer guides for common tasks and workflows.
- **[`in-progress-docs/`](./in-progress-docs/):** Contains working documentation in active development:
    - [`journals/`](./in-progress-docs/journals/): Development journals and historical logs.
    - [`evaluations/`](./in-progress-docs/evaluations/): Product and feature evaluations.
    - [`planning/`](./in-progress-docs/planning/): Working plans and design documents.
    - [`archive/`](./in-progress-docs/archive/): Outdated content pending review.

## Project Status

### Phase 1: Foundation (COMPLETED)

- ✅ **Milestone 0001**: Project Initialization & First Commit
  - Set up the Node.js/TypeScript project structure and configuration files
  - Initialize Git repository and perform initial commit

- ✅ **Milestone 0002**: Basic HTTP Server & Domain Health Endpoint
  - Stand up Express.js application with architectural folder structure
  - Implement domain health check endpoint and comprehensive error handling
  - Add unit and integration tests with proper coverage

- ✅ **Milestone 0003**: SQLite Database Connectivity & Domain DB Health Endpoint
  - Set up SQLite with better-sqlite3 and create database provider
  - Implement health check table and schema initialization
  - Extend health service with database connection checks
  - Add database health check endpoint with visual dashboard

- ✅ **Milestone 0004**: Edge-to-Domain Pattern Implementation for Health Checks
  - Implemented domain client adapter pattern for tier communication
  - Created edge routes that use the domain client to access domain services
  - Added support for both direct and HTTP communication modes
  - Implemented comprehensive test suite for both communication modes
  - Enhanced health dashboard with domain and edge tier visualization

- ✅ **Milestone 0005**: React TypeScript Frontend with Health Check Features
  - Created React TypeScript frontend with Chakra UI for modern, responsive design
  - Implemented server and database health check components with real-time status display
  - Configured Vite build process with automatic deployment to Express static directory
  - Added comprehensive component and integration tests with 80% coverage
  - Implemented type-safe API communication with domain and edge tiers

### Phase 2: Core Chat Functionality

- ✅ **Milestone 0006**: Core ContextThread Domain Layer
  - Implemented ContextThread and Message data models as TypeScript interfaces
  - Created SQLite schema for storing threads with JSON-serialized messages
  - Built domain services for CRUD operations on ContextThreads and messages
  - Applied TDD with comprehensive test coverage (>90%)
  - Implemented domain API routes with full test coverage

- ✅ **Milestone 0007**: Edge Tier API for ContextThreads
  - Created edge tier routes for ContextThread operations (REST only)
  - Implemented validation and error handling
  - Followed the domain client adapter pattern consistently
  - Applied TDD testing throughout

- ✅ **Milestone 0008**: LLM Integration & Basic Chat
  - Created LLM service integration with bring-your-own-key (BYOK) support
  - Built chat functionality with streaming responses
  - Integrated with Anthropic Claude API
  - API keys are managed locally by users (not stored server-side)

- ✅ **Milestone 0009**: Security Hardening (Evolution)
  - Originally implemented OAuth authentication using GitHub with JWT tokens
  - After extensive testing, determined the complexity was excessive for a local-first BYOK application
  - Phase 1 of simplification completed: removed all authentication components
  - Future: Planning simple cookie-based auth for basic user identification (when needed)

### Phase 3: Enhancements & Refinements

- ⬜ **Milestone 0010**: Streaming Hardening
  - Improve streaming capabilities and performance
  - Handle edge cases in streaming responses
  - Optimize for reliable AI response delivery

- ⬜ **Milestone 0011**: Chat Interface Refinement Part 1
  - Enhance chat interface with usability improvements
  - Improve message rendering and formatting
  - Add UI/UX enhancements for better user experience

- ⬜ **Milestone 0012**: OpenAPI Integration
  - Develop comprehensive OpenAPI specification
  - Enable better API documentation
  - Support client SDK generation
  - Improve API testing capabilities

- ⬜ **Milestone 0013**: Chat Interface Refinement Part 2
  - Implement advanced chat interface features
  - Add responsive design optimizations
  - Improve accessibility compliance

- ⬜ **Milestone 0014**: MCP Integration
  - Integrate Model Control Protocol capabilities
  - Enable advanced AI tool interactions
  - Support extended AI functionality

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
├── wiki/                    # Stable reference documentation
└── in-progress-docs/        # Working documentation
```

The application follows a tiered architecture within each package:

- **Domain Tier**: Contains core business logic (services)
- **Edge/XPI Tier**: Handles API routes, transformations
- **UI Tier**: Handles presentation (React components) and response formats
- **Testing**: Jest with Supertest, high test coverage requirements

## Security & Privacy

Liminal Type Chat is designed as a local-first application, meaning your data primarily stays on your machine. However, please be aware of the following:

- **Authentication Status**: Currently no authentication is implemented. The application was originally built with OAuth/JWT authentication, but after evaluation, this was removed as excessive for a local-first BYOK application. A simpler cookie-based authentication system is planned for future implementation when user identification becomes necessary.
- When using external LLM providers, your prompts and data will be sent to their APIs
- If deploying the Edge tier to a cloud environment, ensure proper security measures are in place
- The application stores conversations in a local SQLite database by default
- Always keep your API keys secure and never share them
- API keys are entered directly by users and not persisted server-side

For more details, see our [Security Policy](.github/SECURITY.md) and [Security Architecture](wiki/security/architecture.md).

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

# Run client tests (with coverage enforcement)
cd client
npm test
```

The project implements a tiered coverage threshold system based on component criticality:

- **Core Business Logic (Domain Services)**: 90% statements, 80% branches, 85% functions, 90% lines
- **Utility Functions**: 90% statements, 80% branches, 90% functions, 90% lines
- **API Routes**: 75% statements, 45% branches, 75% functions, 75% lines
- **Data Access**: 80% statements, 45% branches, 75% functions, 80% lines
- **Client Components**: 85% statements, 70% branches, 80% functions, 85% lines

These thresholds are checked during CI builds and must be met for PRs to be merged. See our [Automated Testing Guide](wiki/engineering/standards/automated-testing.md) for comprehensive details.

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