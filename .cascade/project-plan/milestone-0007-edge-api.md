# Milestone 0007: Edge Tier API for ContextThreads


## Scope

- Define and implement Edge API endpoints (`/api/v1/conversations`) for CRUD operations on conversations (backed by `ContextThread` entities) and adding messages.
- Define and implement UI-specific data structures (schemas) for all API request and response bodies, ensuring the API contract is optimized for the primary consumer: **the frontend UI**.
- Integrate Swagger UI for interactive documentation.
- Implement route handlers in the Edge layer that consume request structures, interact with the Domain Client Adapter (using domain entities), and map results back to response structures.
- Implement Edge API Integration Tests for the Edge API endpoints.
- Define a standard error response structure for the Edge API.

## Plan

*(Following Test-Driven Development with Regular Linting)*

1.  **Setup Dependencies**:
    - Install required packages: `ajv`, `swagger-ui-express`, `express-basic-auth`, `yaml`
    - Run linter to ensure clean starting point

2.  **Edge Schemas and Transformers**:
    - 2.1. **Write Tests**: Create tests for transformer functions (domain→edge and edge→domain transformations)
    - 2.2. **Implement**: Define JSON schemas in `/server/src/schemas/edge/` and transformer functions in `/server/src/routes/edge/transformers/`
    - 2.3. **Test & Fix**: Run tests and address any issues
    - 2.4. **Lint**: Run linter and fix any issues

3.  **OpenAPI Specifications**:
    - 3.1. **Write Tests**: Create validation tests for OpenAPI specifications
    - 3.2. **Implement**: Create `/server/openapi/edge-api.yaml` and `/server/openapi/domain-api.yaml`
    - 3.3. **Test & Fix**: Run validation tests and correct any specification issues
    - 3.4. **Lint**: Run linter and fix any issues

4.  **Swagger UI Integration**:
    - 4.1. **Write Tests**: Create tests for Swagger UI routes and authentication
    - 4.2. **Implement**: Configure `swagger-ui-express` middleware with route protection for Domain API docs
    - 4.3. **Test & Fix**: Verify Swagger UI is working correctly for both specifications
    - 4.4. **Lint**: Run linter and fix any issues

5.  **Request Validation**:
    - 5.1. **Write Tests**: Create tests for Edge request validation middleware
    - 5.2. **Implement**: Configure `ajv` for validation with detailed error reporting
    - 5.3. **Test & Fix**: Verify validation correctly identifies and reports errors
    - 5.4. **Lint**: Run linter and fix any issues

6.  **Domain Client Adapter**:
    - 6.1. **Write Tests**: Create tests for adapter toggle mechanism using both direct and HTTP modes
    - 6.2. **Implement**: Create middleware for toggle mechanism and update client factory
    - 6.3. **Test & Fix**: Verify correct behavior with different configuration options
    - 6.4. **Lint**: Run linter and fix any issues

7.  **Error Handling Middleware**:
    - 7.1. **Write Tests**: Create tests for error handling middleware covering different error types
    - 7.2. **Implement**: Create centralized error handling middleware for standardized responses
    - 7.3. **Test & Fix**: Verify errors are properly transformed to the expected format
    - 7.4. **Lint**: Run linter and fix any issues

8.  **Conversation API Routes**:
    - 8.1. **Write Tests**: Create integration tests for conversation CRUD endpoints
    - 8.2. **Implement**: Create route handlers in `/server/src/routes/edge/conversation.ts`
    - 8.3. **Test & Fix**: Verify endpoints behave as expected and fix any issues
    - 8.4. **Lint**: Run linter and fix any issues

9.  **Message API Routes**:
    - 9.1. **Write Tests**: Create integration tests for message endpoints
    - 9.2. **Implement**: Create nested route handlers for `/conversations/:conversationId/messages`
    - 9.3. **Test & Fix**: Verify endpoints behave as expected and fix any issues
    - 9.4. **Lint**: Run linter and fix any issues

10. **Final Verification**:
    - 10.1. **Complete Test Suite**: Add any missing test cases and ensure >90% coverage
    - 10.2. **Final Lint**: Run linter across all new and modified files
    - 10.3. **Documentation**: Update API documentation and examples as needed
    - 10.4. **Swagger Verification**: Manually verify Swagger UI accurately represents all endpoints

## Design

### OpenAPI Specifications

#### Separate Specifications for Edge and Domain APIs

Following the tiered architecture principles of the project, we will maintain two separate OpenAPI specifications:

1. **Edge API Specification (`/server/openapi/edge-api.yaml`)**
   - Documents the public HTTP interface intended for frontend consumption
   - Focuses on UI-optimized data structures (`/api/v1/conversations`)
   - Uses terminology and models aligned with UI concepts (e.g., "conversation" vs "contextThread")
   - Defines error structures and codes specific to external consumers
   - Will be exposed via Swagger UI at `/api-docs/edge`

2. **Domain API Specification (`/server/openapi/domain-api.yaml`)**
   - Documents the internal HTTP interface used when running in distributed mode
   - Based on canonical domain models (`/domain/threads`)
   - Uses domain-specific terminology and concepts
   - Defines error structures and codes specific to the domain layer
   - Will be exposed via Swagger UI at `/api-docs/domain` (protected in production)

#### Benefits of Dual Specifications

- **Architectural Clarity**: Maintains clean separation between tiers
- **Targeted Documentation**: Frontend developers only need to understand Edge API
- **Independent Evolution**: Each API can evolve based on different requirements
- **Testing Precision**: Facilitates targeted testing of each tier
- **Deployment Flexibility**: Supports both single-process and distributed deployment modes

### API Endpoint Design

-   **Base Path**: `/api/v1`
-   **Resource**: `conversations` (mapping to `ContextThread` domain entity)
-   **Technology**: Express.js Router
-   **Validation**: JSON Schema validation using `ajv` (configured with `allErrors: true`) will be applied at two levels:
    *   **Edge Layer**: Incoming requests validated against Edge request schemas (via middleware integrated with OpenAPI spec).
    *   **Domain Layer**: Parameters passed to Domain service methods validated against canonical Domain schemas (explicitly within service methods).

#### Endpoints:

*   `POST /conversations`
    *   **Description**: Create a new conversation.
    *   Request Body: `CreateConversationRequest`
        *   `title` (string, optional): The title of the conversation.
        *   `initialMessage` (object, optional): An initial message to start the conversation.
            *   `role` (string, required, enum: ['user', 'assistant', 'system']): The role of the message sender.
            *   `content` (string, required): The content of the message.
            *   `metadata` (object, optional): Any additional metadata for the message.
    *   Response (201): `ConversationResponse`
        *   `conversationId` (string, UUID): The unique identifier for the created conversation.
        *   `title` (string, nullable): The title of the conversation (could be null if not provided and not auto-generated).
        *   `createdAt` (string, ISO 8601 format): Timestamp of conversation creation.
        *   `updatedAt` (string, ISO 8601 format): Timestamp of the last update.
        *   `messages` (array): An array containing the messages in the conversation (likely just the initial message or empty upon creation).
            *   Items: `MessageResponse`
                *   `messageId` (string, UUID): Unique identifier for the message.
                *   `role` (string, enum: ['user', 'assistant', 'system']): The role of the message sender.
                *   `content` (string): The content of the message.
                *   `createdAt` (string, ISO 8601 format): Timestamp of message creation.
                *   `metadata` (object, optional): Any additional metadata associated with the message.
                *   `status` (string, optional, enum: ['completed', 'pending', 'error', etc.]): The status of the message (may be added later, good to consider).
    *   Response (400): `ErrorResponse` (Validation error)
    *   Response (500): `ErrorResponse` (Internal server error)

*   `GET /conversations`
    *   **Description**: Retrieve a list of conversation summaries.
    *   Request Query Params: (Optional pagination/filtering params can be added later, e.g., `limit`, `offset`, `sortBy`)
    *   Response (200): `ConversationListResponse` (An array of conversation summaries)
        *   Items: `ConversationSummary`
            *   `conversationId` (string, UUID): The unique identifier for the conversation.
            *   `title` (string, nullable): The title of the conversation.
            *   `createdAt` (string, ISO 8601 format): Timestamp of conversation creation.
            *   `updatedAt` (string, ISO 8601 format): Timestamp of the last update.
    *   Response (500): `ErrorResponse` (Internal server error)

*   `GET /conversations/:conversationId`
    *   **Description**: Retrieve a single conversation by ID.
    *   Request Params: `conversationId` (UUID)
    *   Response (200): `ConversationResponse`
    *   Response (404): `ErrorResponse` (Not found)

*   `PUT /conversations/:conversationId`
    *   **Description**: Update conversation properties (e.g., title).
    *   Request Params: `conversationId` (UUID)
    *   Request Body: `UpdateConversationRequest`
        *   `title` (string, nullable): The new title for the conversation. Sending `null` could potentially clear the title, sending an empty string `""` could set it to empty, or omitting the field leaves it unchanged. Specify desired behaviour.
        *   *(Future: Add other updatable fields like metadata?)*
    *   Response (200): `ConversationResponse` (Return the updated conversation)
    *   Response (404): `ErrorResponse` (Not found)
    *   Response (400): `ErrorResponse` (Validation error)

*   `DELETE /conversations/:conversationId`
    *   **Description**: Delete a conversation by ID.
    *   Request Params: `conversationId` (UUID)
    *   Response (204): No Content
    *   Response (404): `ErrorResponse` (Not found)

*   `POST /conversations/:conversationId/messages`
    *   **Description**: Add a new message to an existing conversation.
    *   Request Params: `conversationId` (UUID)
    *   Request Body: `AddMessageRequest`
        *   `role` (string, required, enum: ['user', 'assistant', 'system']): The role of the message sender.
        *   `content` (string, required): The content of the message.
        *   `metadata` (object, optional): Any additional metadata for the message.
        *   `status` (string, optional, enum: ['completed', 'pending', 'error', etc.]): Optional initial status (might default to 'pending' or 'completed').
    *   Response (201): `MessageResponse` (Returns the newly created message, schema defined under `ConversationResponse`)
    *   Response (404): `ErrorResponse` (Conversation not found)
    *   Response (400): `ErrorResponse` (Validation error)
    *   Response (500): `ErrorResponse` (Internal server error)

### OpenAPI Specification Details

*   **Scope**: 
    * The Edge API specification (`/server/openapi/edge-api.yaml`) will document **all external-facing HTTP endpoints** served by the application. This includes the new Edge API endpoints for conversations/messages and any pre-existing public HTTP endpoints (e.g., health checks).
    * The Domain API specification (`/server/openapi/domain-api.yaml`) will document the **internal Domain API endpoints** (`/domain/threads`) created in Milestone 0006.
*   **Standard**: Both specifications will follow OpenAPI 3.x standards.
*   **Schema Referencing**: 
    * Edge API: Edge request/response schemas (e.g., `CreateConversationRequest`, `ConversationResponse`) defined in separate JSON schema files (e.g., `/server/src/schemas/edge/CreateConversationRequest.json`) will be referenced using `$ref` syntax.
    * Domain API: Domain schemas (e.g., `ContextThread`, `Message`) defined in JSON schema files will be referenced similarly.
*   **Error Schema**: Each specification will define and reference appropriate error schemas for their respective error responses (4xx, 5xx).
*   **Completeness**: Ensure all endpoints (both Edge and Domain) are fully documented in their respective specification files.

### Domain Client Adapter Strategy

The Edge API needs to communicate with the Domain API, which can be done through either a direct in-process adapter or an HTTP adapter. This strategy provides flexibility for both single-process and distributed deployments.

#### Toggle Mechanism

- **Base Configuration**: Use environment variables to set the default adapter mode:
  ```
  DOMAIN_CLIENT_MODE=direct|http
  ```

- **Testing Override**: Support a special HTTP header for testing both modes without server restarts:
  ```
  X-Domain-Client-Mode: direct|http
  ```

- **Implementation**:
  ```typescript
  // In middleware
  app.use((req, res, next) => {
    // Only process this header in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      const headerMode = req.headers['x-domain-client-mode'] as string;
      if (headerMode && ['direct', 'http'].includes(headerMode)) {
        req.domainClientMode = headerMode as 'direct' | 'http';
      }
    }
    next();
  });

  // In route handlers or controllers
  function getDomainClient(req) {
    const mode = req.domainClientMode || process.env.DOMAIN_CLIENT_MODE || 'direct';
    return mode === 'direct' 
      ? new DirectDomainClient() 
      : new HttpDomainClient({ baseUrl: process.env.DOMAIN_API_URL });
  }
  ```

- **Testing Both Modes**:
  ```typescript
  // Test with direct mode
  it('should create conversation (direct mode)', async () => {
    const response = await request(app)
      .post('/api/v1/conversations')
      .set('x-domain-client-mode', 'direct')
      .send(payload);
    expect(response.status).toBe(201);
  });

  // Test with HTTP mode
  it('should create conversation (HTTP mode)', async () => {
    const response = await request(app)
      .post('/api/v1/conversations')
      .set('x-domain-client-mode', 'http')
      .send(payload);
    expect(response.status).toBe(201);
  });
  ```

- **Security Considerations**:
  - The header override is only processed in non-production environments
  - Header values are validated before use
  - The HTTP adapter requires proper configuration (URLs, credentials if needed)

This approach allows for seamless switching between adapter modes for both development and testing purposes while maintaining a clean architecture.

### Schema Transformation and Versioning Strategy

#### Transformer Functions

- **Purpose**: Transformer functions act as an adapter layer between Edge API schemas and Domain models
- **Implementation**: Create dedicated transformer utility files in `/server/src/routes/edge/transformers/`
- **Pattern**:

  ```typescript
  // Domain-to-Edge transformation
  export function domainThreadToConversationResponse(thread: ContextThread): ConversationResponse {
    return {
      conversationId: thread.id,
      title: thread.title,
      createdAt: new Date(thread.createdAt).toISOString(), // Note timestamp format transformation
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

#### Schema Versioning Approach

- **URL Path Versioning**: Initial implementation using `/api/v1/conversations` and `/domain/threads`
- **Schema Metadata**: Include version property in JSON schemas for future reference
  ```json
  {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "ConversationResponse",
    "version": "1.0",
    "type": "object",
    // ...
  }
  ```
- **Evolution Strategy**:
  - Transformer functions insulate Edge API contracts from Domain model changes
  - When Domain models evolve, update transformers to handle both old and new versions
  - For breaking API changes, introduce new API versions with dedicated transformers
  - This enables multiple client applications (Web, iOS, CLI) to have optimized interfaces

#### Multi-Client Support

- The transformer approach enables future client-specific Edge APIs (Web, iOS, CLI)
- Each client can have its own transformers optimized for its specific needs
- All clients share the same Domain models and business logic

### Data Transformation

*   Route handlers are responsible for mapping:
    *   Incoming Request structures (`CreateConversationRequest`, `AddMessageRequest`) to Domain Service parameters (`CreateThreadParams`, `AddMessageParams`).
    *   Domain Service results (`ContextThread`, `Message`) to Response structures (`ConversationResponse`, `MessageResponse`).
*   This ensures the Edge API contract (schemas) is decoupled from the Domain model.
*   Sensitive or internal domain data not relevant to the UI will be excluded during mapping.
*   **Implementation**: Use transformer functions from `/server/src/routes/edge/transformers/` to perform these mappings.

### Error Handling

*   A standardized `ErrorResponse` structure will be used for all API errors.
*   An Express error handling middleware will catch errors and format the response.
*   **Validation Errors**: (`HTTP 400 Bad Request`)
    *   Triggered by `ajv` validation failures at either the Edge or Domain layer.
    *   Error Code: `VALIDATION_ERROR`
    *   The `ErrorResponse` will include a `validationErrors` array detailing all schema violations.
*   **Not Found Errors**: (`HTTP 404 Not Found`)
    *   When accessing a resource (e.g., conversation) that doesn't exist.
    *   Error Code: `RESOURCE_NOT_FOUND`
*   **Domain Errors**: (e.g., `HTTP 409 Conflict`, `HTTP 500 Internal Server Error`)
    *   Errors originating from the domain layer (e.g., business rule violation, data corruption like `MessagesCorruptedError`).
    *   Mapped to appropriate HTTP statuses and specific error codes (e.g., `DOMAIN_RULE_VIOLATION`, `DATA_CORRUPTION`, `INTERNAL_SERVER_ERROR`).
*   **Standard `ErrorResponse` Structure**:
    ```json
    {
      "errorCode": "string", // e.g., "VALIDATION_ERROR", "RESOURCE_NOT_FOUND", "INTERNAL_SERVER_ERROR"
      "message": "string",   // User-friendly error message
      "details": "string | object | null", // Optional: More specific technical details or context
      "validationErrors": [
        // Optional: Only present for VALIDATION_ERROR
        {
          "field": "string", // JSON path to the invalid field (e.g., "body.initialMessage.role")
          "message": "string"  // Description of the validation failure (from ajv)
        }
      ]
    }
    ```

### Testing Strategy

*   **Unit Tests**: For complex mapping functions, validation logic helpers, or utility functions within the Edge layer (using Jest/Vitest).
*   **Edge API Integration Tests**: Use `Supertest` to make HTTP requests to the API endpoints, verifying the complete flow from request reception to response generation, including validation, mapping, service calls (potentially with mocked repository), and error handling. Test against the defined request/response schemas.

## Test Cases

### Edge API Integration Test Conditions

*(Specific scenarios using Supertest for each endpoint, validating request handling, response status codes, and the structure/content of response structures)*

*   **POST /conversations**: Success (201, validate `ConversationResponse`), validation failure (400, validate `ErrorResponse`), initial message handling.
*   **GET /conversations**: Success (200, validate `ConversationListResponse`), pagination params (limit/offset).
*   **GET /conversations/:conversationId**: Success (200, validate `ConversationResponse`), not found (404, validate `ErrorResponse`), invalid ID format (400, validate `ErrorResponse`).
*   **PUT /conversations/:conversationId**: Success (200, validate `ConversationResponse`), not found (404, validate `ErrorResponse`), validation failure (400, validate `ErrorResponse`).
*   **DELETE /conversations/:conversationId**: Success (204), not found (404, validate `ErrorResponse`).
*   **POST /conversations/:conversationId/messages**: Success (201, validate `MessageResponse`), conversation not found (404, validate `ErrorResponse`), message validation failure (400, validate `ErrorResponse`).

*(Note: These are Edge API Integration Tests. Unit tests should also be written for complex mapping functions or utility logic within the handlers if needed.)*

## Key Design Decisions

*   Use OpenAPI 3.x standard.
*   Serve OpenAPI spec via Swagger UI for interactive documentation.
*   Define distinct Edge API request/response schemas (JSON Schema) separate from Domain models to create a UI-oriented API contract (BFF pattern).
*   Implement runtime validation using `ajv` against these schemas at both the Edge entry point (request validation) and Domain service call boundary (parameter validation), configured to report all errors.
*   Implement centralized error handling middleware to map errors to a standard `ErrorResponse` structure.

### Authentication Preparation

*While full authentication implementation is planned for Milestone 0008 (GPT-4.1 Integration), this milestone will include preparation work:*

- **OpenAPI Documentation**: Include authentication placeholder sections in the Edge API specification
  ```yaml
  components:
    securitySchemes:
      BearerAuth:
        type: http
        scheme: bearer
        bearerFormat: JWT
        description: "Authentication will be implemented in Milestone 0008"
  ```

- **Swagger UI Protection**: Configure basic protection for the Domain API Swagger UI in non-development environments
  ```typescript
  // Basic protection middleware for Domain API docs in non-development environments
  if (process.env.NODE_ENV !== 'development') {
    app.use('/api-docs/domain', basicAuth({
      users: { 'admin': process.env.DOMAIN_DOCS_PASSWORD || 'liminal-dev' },
      challenge: true,
    }));
  }
  ```

- **Route Structure**: Design routes with authentication in mind (e.g., `/api/v1/users/:userId/conversations`)

- **TODO Comments**: Add explicit TODO comments in relevant code sections where authentication will be implemented in future milestones

*Full authentication implementation including user management, JWT tokens, and API key storage will be addressed in Milestone 0008.*

### Dependencies

This milestone will introduce several new dependencies:

- **`ajv`** (^8.12.0): JSON Schema validator for request/response validation
- **`swagger-ui-express`** (^5.0.0): Middleware to serve Swagger UI for API documentation
- **`express-basic-auth`** (^1.2.1): Basic authentication middleware for protecting Domain API docs
- **`yaml`** (^2.3.1): YAML parser/generator for OpenAPI specification files

These will be added to the server's `package.json` with specific version constraints to ensure consistency across development environments.

## Success Criteria

*   RESTful API endpoints for conversations and messages are implemented and functional according to the defined specifications.
*   OpenAPI specification (`openapi.yaml`) is valid and accurately describes the API using defined schemas.
*   Swagger UI is accessible via a dedicated route (e.g., `/api-docs`) and allows interaction with all defined endpoints using the specified structures.
*   API endpoints perform correct CRUD operations on conversations and messages via the domain layer, handling success and error cases appropriately, **returning data structured according to the defined response schemas.**
*   >90% Edge API Integration Test coverage for Edge API routes (`/server/src/routes/edge/`), **verifying response structures.**
*   All Edge API Integration Tests passing in the CI pipeline.