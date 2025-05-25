# Key Terminology

- **Domain Tier**: The core business logic layer that defines canonical data models and operations. It's agnostic to HTTP, UI concerns, or specific database implementations.

- **Edge/XPI Tier**: The Experience API layer that handles HTTP requests, transforms data between UI-friendly formats and domain models, and routes to appropriate domain services. XPI stands for eXperience/Proxy/Integration.

- **Canonical Models**: The definitive representation of entities within the domain tier (e.g., a ContextThread with its messages).

- **DTO (Data Transfer Object)**: Objects structured for external communication, typically more simplified or specialized than canonical models.

- **Domain Client Adapter**: A component that enables edge routes to communicate with domain services, either directly (in-process) or via HTTP calls (cross-process).

- **Provider Pattern**: An approach where core functionality depends on abstractions rather than concrete implementations, allowing different implementations (e.g., SQLite vs PostgreSQL) to be swapped without changing business logic.

- **Monorepo:** A single repository containing multiple distinct projects (e.g., `server`, `client`) with well-defined relationships.
- **BYOK (Bring Your Own Key):** Users provide their own API keys for accessing external LLM services.
