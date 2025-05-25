# Detailed Architecture

## Conceptual Application Tiers

The application is conceptually divided into the following tiers, allowing for clear separation of concerns and flexibility in how these tiers are mapped to processes in different deployment environments:

1.  **UI Tier (Presentation Tier):**
    -   Responsibilities: User interaction, data presentation, capturing user input.
    -   Characteristics: The most user-proximate layer. Examples include web interfaces (React, Svelte, Vue, HTML/JS), command-line interfaces (CLI), desktop applications, or mobile applications.
    -   Interacts with: Edge/XPI/Router Tier.

2.  **Edge/XPI/Router Tier (Experience/Adaptation Tier):**
    -   Responsibilities: Routing client requests, proxying to the Domain API Tier, transforming data structures between UI-friendly formats and canonical domain formats, and potentially aggregating calls to the Domain API Tier.
    -   Characteristics: Acts as a Backend-for-Frontend (BFF) or an API gateway. Can handle UI-specific concerns like session management or specialized caching.
    -   Interacts with: UI Tier and Domain API Tier.

3.  **Domain API Tier (Core Services/Business Logic Tier):**
    -   Responsibilities: Defines and operates on the application's **canonical data formats** and **canonical core operations (use cases)**. Contains the primary business logic and domain models. Orchestrates interactions with various datasources and external services, translating their specific formats to/from the canonical model. Enforces business rules and data integrity around these canonical representations.
    -   Characteristics: UI-agnostic. Exposes its functionality through well-defined service interfaces or APIs that strictly adhere to these canonical data formats and operations. This tier is where provider/adapter patterns for integrations (like different database backends or LLM providers) are implemented to ensure consistency with the canonical model.
    -   Interacts with: Edge/XPI/Router Tier and Datasources & External Services Tier.

4.  **Datasources & External Services Tier (Integration Tier):**
    -   Responsibilities: Provides access to persistent storage (databases like SQLite, PostgreSQL), messaging systems, external APIs (like LLMs), and other third-party services.
    -   Characteristics: Represents the actual external dependencies the application relies on.
    -   Interacts with: Domain API Tier.

## Process Layers and Boundaries

A key architectural principle is to maintain a degree of decoupling between the conceptual Application Tiers and the physical process boundaries. This allows for flexibility in deployment across different environments (local, development, staging, production) and scales. While the Application Tiers define logical separation of concerns, the process model defines how these tiers are hosted and communicate.

**Recommended Local Setup Process Model (MVP):**

For the initial local-first development and execution, a simple and pragmatic process model is recommended:

1.  **Main Application Process (Node.js Server):**
    -   Hosts the **Edge/XPI/Router Tier** logic (e.g., as Express.js routes or similar HTTP request handlers).
    -   Hosts the **Domain API Tier** logic (e.g., service classes/modules called by the route handlers).
    -   This single Node.js process, therefore, encapsulates the responsibilities of Application Tiers 2 and 3.
    -   It directly interacts with the **Datasources & External Services Tier** (e.g., local SQLite database file, external LLM APIs via HTTP).

2.  **UI Client Process:**
    -   The **UI Tier** will run in its own process, separate from the main application process.
    -   If a web-based UI (even a simple HTML/JS test page), the browser itself constitutes this process. The Node.js server might serve the static UI files, but the UI code executes in the browser.
    -   If a Command Line Interface (CLI) is used, each invocation of the CLI tool is a separate process.
    -   If API testing tools (like Postman/Insomnia) are used, they run as their own distinct processes.

This local setup prioritizes ease of development and a minimal number of moving parts, while still respecting the conceptual separation of the Application Tiers within the codebase of the Node.js server.

## Schema Transformation and Versioning Strategy

A key architectural pattern in the system is the use of transformer functions to manage the interface between the Edge API tier and Domain API tier, providing several important benefits:

### Transformer Functions

Transformer functions act as an adapter layer between Edge API schemas and Domain models:

```typescript
// Domain-to-Edge transformation
export function domainThreadToConversationResponse(thread: ContextThread): ConversationResponse {
  return {
    conversationId: thread.id,
    title: thread.title,
    createdAt: new Date(thread.createdAt).toISOString(),
    updatedAt: new Date(thread.updatedAt).toISOString(),
    messages: thread.messages.map(domainMessageToMessageResponse),
  };
}

// Edge-to-Domain transformation
export function conversationRequestToThreadParams(req: CreateConversationRequest): CreateThreadParams {
  return {
    title: req.title,
    initialMessage: req.initialMessage 
      ? messageRequestToDomainMessage(req.initialMessage, '') 
      : undefined,
  };
}
```

### Benefits of the Transformer Pattern

1. **Schema Evolution Independence**: 
   - Domain models can evolve independently of Edge API contracts
   - When Domain models change, only transformers need to be updated
   - Edge API can maintain backward compatibility for clients

2. **Multi-Client Support**:
   - Different client types (Web, iOS, CLI) can have specialized Edge APIs
   - Each client Edge API can optimize its contract for client-specific needs
   - All clients share the same Domain models and business logic

3. **Versioning Strategy**:
   - URL path versioning provides clear API version boundaries (`/api/v1/...`)
   - Transformer functions insulate API contracts from internal changes
   - Multiple API versions can be supported simultaneously during transition periods

4. **Data Security and Privacy**:
   - Transformers can filter sensitive data not intended for clients
   - Domain models can contain internal fields never exposed to clients

### Implementation Approaches

- **Centralized Transformers**: Dedicated transformer utility files in `/server/src/routes/edge/transformers/`
- **Schema Version Metadata**: JSON schemas include version property for reference
- **Graduated Versioning**: Minor changes handled in transformers, major changes via new API versions
