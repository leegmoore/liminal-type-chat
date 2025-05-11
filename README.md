# Liminal Type Chat

An open-source, local-first GenAI chat application designed for individuals and small teams who want to leverage their own API keys to interact with various language models (LLMs).

## Documentation

- [Development Standards](docs/DEVELOPMENT_STANDARDS.md) - Coding standards, patterns, and best practices
- [Error Codes](docs/ERROR_CODES.md) - Complete error code reference

## Project Status

- ✅ Milestone 0: Project Initialization - **COMPLETED**
- ✅ Milestone 1: Basic HTTP Server & Domain Health Endpoint - **COMPLETED**
- ⬜ Milestone 2: Core Data Models & Initial Database Setup - *Planned*

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
