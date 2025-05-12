# Project Setup

This section outlines the minimal setup for the project.

- **Runtime Environment**: 
  - Node.js LTS (Long-Term Support) version, currently Node.js 20.x
  - Express.js for HTTP server, API routes, and serving static content
- **Package Manager**: npm
- **Version Control**: Git
- **Open Source License**: MIT License
- **Project Status**: Early development, not yet stable enough for external contributions

- **Application Structure**: 
  - Single Express.js application that serves both the API and static UI files
  - Clear internal separation between Edge/XPI, Domain, and UI tiers
  - Frontend code (React or similar) built and deployed to Express public directory

- **Directory Structure**:
  - `/server`: Backend Node.js/Express application
    - `/src`: Server source code
      - `/routes`: API routes
        - `/edge`: Edge/XPI tier routes (UI-optimized endpoints - `/api/v1/edge/...`)
        - `/domain`: Domain API routes (canonical formats - `/api/v1/domain/...`) 
      - `/services`: Business logic (Domain tier)
        - `/core`: Core domain services
        - `/adapters`: Adapters for external integrations (DB, LLMs)
      - `/models`: Data models and interfaces
        - `/domain`: Canonical domain models
        - `/dto`: Data Transfer Objects (UI/external formats)
        - `/transforms`: Transform functions between domain and DTO models
      - `/clients`: Client libraries
        - `/domain-client`: Adapter for edge-to-domain communication (configurable for in-process or HTTP)
      - `/providers`: Integration adapters 
        - `/db`: Database access 
        - `/storage`: Document storage (local/cloud) 
        - `/llm`: Language model providers
      - `/config`: Configuration management
      - `/middleware`: Express middleware
      - `/utils`: Utility functions
    - `/test`: Test files separated by type
      - `/unit`: Unit tests targeting individual functions and classes
        - Structure mirrors src directory (e.g., `/unit/services/`)
      - `/integration`: Integration tests targeting component interactions
        - Structure reflects logical module groupings (e.g., `/integration/routes/`)
    - `/public`: Static frontend files (served by Express)
    - `/dist`: Compiled JavaScript
    - `/db`: Database files and migrations
    - `/data`: Document/file storage

    **NOTE**: The Edge-to-Domain communication pattern uses a configurable adapter approach. When running in a single process, the Edge routes can call Domain services directly via the domain-client adapter for efficiency. When distributed across processes, the same adapter seamlessly switches to making HTTP calls to the Domain API endpoints. This provides flexibility in deployment while optimizing for the local-first case.

  - `/client`: Frontend application
    - `/src`: Frontend source code
    - `/public`: Static assets
    - `/test`: Test files (will be implemented in Milestone 4)
      - `/unit`: Unit tests for React components
      - `/integration`: Integration tests for component interactions
      - `/__mocks__`: Mock files for testing
    - `/build`: Build output (copied to `/server/public` during deployment)

- **Configuration Files**:
  - `package.json`: Project metadata, dependencies, and scripts (one each for server and client)
  - `tsconfig.json`: TypeScript compiler options
  - `.env`: Environment variables (not checked into version control)
  - `.gitignore`: Files/directories to ignore in version control
        
- **Future Scaling Considerations**:
  - **Database**: Design with adapter pattern to allow transition from SQLite to PostgreSQL if needed
  - **Document Storage**: Implement abstraction that works with local files or cloud storage (S3, etc.)
  - **Process Distribution**: Maintain clean separation of tiers to allow future distribution
  - **Multi-tenancy**: Consider data isolation patterns if moving beyond personal/family use
