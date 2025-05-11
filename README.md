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

- **Backend**: Node.js/Express/TypeScript with SQLite database
- **Frontend**: React/TypeScript application
- **Architecture**: Clean separation between Domain, Edge/XPI, and UI tiers
- **Error Handling**: Standardized error codes and response formats
- **Testing**: Jest with Supertest, high test coverage requirements

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm 9.x or later

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/liminal-type-chat.git
   cd liminal-type-chat
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   ```
   cp .env.example .env
   ```
   Edit the `.env` file to configure your settings and API keys.

4. Run the development server
   ```
   npm run dev
   ```

5. Access the application at `http://localhost:3000`

## Development

- Run tests: `npm test`
- Build for production: `npm run build`
- Start production server: `npm start`

## License

MIT

## Contributing

This project is in early development. Contribution guidelines will be added soon.
