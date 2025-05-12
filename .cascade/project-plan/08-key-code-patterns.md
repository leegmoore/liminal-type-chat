# Key Code Patterns and Conventions

Several key patterns are employed to maintain consistency and quality:

- **Tiered Architecture:** As described in the Architecture section.
- **Dependency Injection:** Used primarily in the Domain tier to inject dependencies like database providers, facilitating testing and decoupling.
- **Repository/Provider Pattern:** Abstracting data access logic (e.g., `SqliteDbProvider`).
- **Configuration Management:** Centralized configuration handling.
- **Domain Client Adapter Factory:** (Used for Edge-to-Domain communication) This pattern provides architectural flexibility, enabling the application to run with the Edge and Domain tiers in a single process (using direct function calls) or as separate processes (using HTTP communication), controlled by configuration. A factory (`health-service-client-factory.ts`) creates the appropriate client instance (`health-service-client.ts` for direct calls, `health-service-http-client.ts` for HTTP calls). This ensures the Edge tier interacts with the Domain tier transparently and consistently, regardless of the deployment mode, and serves as the standard mechanism for all Edge-to-Domain service communication (not just health checks).
- **Standardized API Responses:** Consistent JSON structures for success and error responses.
- **Development Standards:** Detailed coding conventions, naming standards, and best practices are documented in `docs/DEVELOPMENT_STANDARDS.md` (and summarized in `14-development-standards.md`).
