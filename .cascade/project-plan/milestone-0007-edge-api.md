# Milestone 0007: Edge Tier API for ContextThreads


## Scope

- Define and implement Edge API endpoints (`/api/v1/conversations`) for CRUD operations on conversations (backed by `ContextThread` entities) and adding messages.
- Define and implement UI-specific data structures (schemas) for all API request and response bodies, ensuring the API contract is optimized for the primary consumer: **the frontend UI**.
- Integrate Swagger UI for interactive documentation.
- Implement route handlers in the Edge layer that consume request structures, interact with the Domain Client Adapter (using domain entities), and map results back to response structures.
- Implement Edge API Integration Tests for the Edge API endpoints.
- Define a standard error response structure for the Edge API.

## Plan

*(Based on High-Level Tasks from overview)*

1.  **Setup Validation Dependency**: Install `ajv` (`npm install ajv` in the `server` workspace).
2.  **Define Edge Schemas**: Define JSON schemas for all required Edge request/response structures (e.g., `CreateConversationRequest`, `ConversationResponse`, `MessageResponse`, `ErrorResponse`, etc.) potentially in `/server/src/schemas/edge/`.
3.  **Define initial OpenAPI specification structure**: Create `/server/openapi.yaml` (or `.json`). Include basic info, servers, paths section. Also, identify any existing relevant **external-facing HTTP endpoints** (e.g., health checks) that need to be included alongside the new Edge API. **Note**: This specification documents the HTTP interface, not the internal Domain service layer API.
4.  **Integrate Swagger UI middleware**: Add `swagger-ui-express` to the server, configure it to serve the OpenAPI spec.
5.  **Implement Edge Request Validation**: Configure middleware (possibly using `ajv` directly or a library like `express-openapi-validator`) to automatically validate incoming requests against Edge request schemas defined in OpenAPI. Ensure validator is configured to report **all** errors (`ajv` option `allErrors: true`).
6.  **Implement Domain Parameter Validation**: Within the Domain service methods (e.g., `ContextThreadService.createThread`), add explicit validation logic using `ajv` to check input parameters against the canonical Domain JSON schemas. Configure `ajv` with `allErrors: true` here as well. Propagate validation errors appropriately.
7.  **Implement API route handlers for Conversation CRUD**: Develop routes in `/server/src/routes/edge/conversation.ts` (or similar). Handlers will perform:
    *   *(Request validation handled by middleware - Step 5)*.
    *   Calling the Domain Client Adapter (which now includes domain validation - Step 6).
    *   Mapping domain service results (e.g., `ContextThread`) to response structures (e.g., `ConversationResponse`).
    *   Standardized error handling, mapping domain errors (including validation errors) to Edge error structures.
8.  **Implement API route handlers for Message operations**: Develop nested routes (e.g., `/conversations/:conversationId/messages`) following the same pattern as step 7 (using `AddMessageRequest`, `MessageResponse`, etc.).
9.  **Refine OpenAPI specification**: Fully detail all paths, parameters, request bodies (referencing request schemas), and responses (referencing response schemas and error schemas) for ALL relevant **external-facing HTTP endpoints** (newly implemented Edge endpoints and existing ones like health checks).
10. **Refine Error Handling**: Solidify the error handling strategy and middleware to catch errors (including validation errors from both Edge and Domain layers) and map them to the standard `ErrorResponse` format, ensuring detailed validation issues are included when relevant.
11. **Write Edge API Integration Tests**: Develop tests for all new endpoints using Supertest, covering success and error paths, **specifically testing validation logic and error responses for invalid inputs**. Validate request handling and response structure. Target >90% coverage for the edge routes.

## Design

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

*   **Scope**: The specification defined in `/server/openapi.yaml` will document **all external-facing HTTP endpoints** served by the application. This includes the new Edge API endpoints for conversations/messages and any pre-existing HTTP endpoints (e.g., health checks). It explicitly **does not** document the internal programmatic API of the Domain service layer.
*   **Standard**: It will follow OpenAPI 3.x standards.
*   **Schema Referencing**: Edge request/response schemas (e.g., `CreateConversationRequest`, `ConversationResponse`) defined in separate JSON schema files (e.g., `/server/src/schemas/edge/CreateConversationRequest.json`) will be referenced using `$ref` syntax (e.g., `$ref: './src/schemas/edge/CreateConversationRequest.json'`).
*   **Error Schema**: The `ErrorResponse` schema will also be defined and referenced for all relevant error responses (4xx, 5xx).
*   **Completeness**: Ensure all relevant existing endpoints are documented alongside the new conversation endpoints.

### Data Transformation

*   Route handlers are responsible for mapping:
    *   Incoming Request structures (`CreateConversationRequest`, `AddMessageRequest`) to Domain Service parameters (`CreateThreadParams`, `AddMessageParams`).
    *   Domain Service results (`ContextThread`, `Message`) to Response structures (`ConversationResponse`, `MessageResponse`).
*   This ensures the Edge API contract (schemas) is decoupled from the Domain model.
*   Sensitive or internal domain data not relevant to the UI will be excluded during mapping.

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

## Success Criteria

*   RESTful API endpoints for conversations and messages are implemented and functional according to the defined specifications.
*   OpenAPI specification (`openapi.yaml`) is valid and accurately describes the API using defined schemas.
*   Swagger UI is accessible via a dedicated route (e.g., `/api-docs`) and allows interaction with all defined endpoints using the specified structures.
*   API endpoints perform correct CRUD operations on conversations and messages via the domain layer, handling success and error cases appropriately, **returning data structured according to the defined response schemas.**
*   >90% Edge API Integration Test coverage for Edge API routes (`/server/src/routes/edge/`), **verifying response structures.**
*   All Edge API Integration Tests passing in the CI pipeline.