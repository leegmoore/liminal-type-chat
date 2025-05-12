# Development Journal - Milestone 0007: Edge API

**Date: May 12, 2025**

## Overview

This milestone focused on implementing the Edge API layer of the Liminal Type Chat application. The Edge API serves as the gateway between the frontend (UI) and the backend domain services, providing a clean interface for the UI while decoupling it from the domain model details.

## Key Design Decisions

### 1. Schema Transformation Pattern

**Decision:** Implemented dedicated transformer functions to convert between Domain models and Edge API schemas.

**Context:** We needed a way to translate between our domain models (which use timestamps as numbers, snake_case fields, etc.) and the Edge API's more frontend-friendly format (ISO timestamps, camelCase fields).

**Benefits:**
- Clear separation of concerns between Edge and Domain tiers
- Allows independent evolution of both APIs
- Makes versioning possible in the future
- Decouples the client contract from internal implementation

**Implementation Details:**
- Created transformer functions like `domainThreadToConversationResponse` and `messageRequestToDomainMessage`
- Each transformer handles the specific mappings needed for its data type
- Added unit tests with 100% coverage for these functions

### 2. Domain Client Adapter Pattern

**Decision:** Created both direct (in-process) and HTTP adapters for communicating with the Domain tier.

**Context:** We needed a way to allow the Edge API to communicate with the Domain tier either directly (for efficiency in single-process deployments) or via HTTP (for distributed deployments).

**Benefits:**
- Provides deployment flexibility without changing code
- Enables better testing strategies
- Supports future scaling to multiple processes

**Implementation Details:**
- Factory pattern for client creation based on configuration
- Support for per-request override via HTTP headers in non-production environments
- Environment variables control the default behavior

### 3. Request Validation with Ajv

**Decision:** Used JSON Schema for request/response validation with Ajv.

**Context:** While TypeScript provides compile-time type checking, we still need runtime validation for API requests.

**Benefits:**
- Ensures data integrity at runtime
- Self-documenting API through schemas
- Consistent validation errors
- Ties in with OpenAPI specifications

**Implementation Details:**
- Created JSON Schema files for all request/response types
- Used Ajv for validation with custom error formatting
- Integrated validation into request processing pipeline

### 4. Integration with OpenAPI

**Decision:** Defined comprehensive OpenAPI 3.0 specifications for both Edge and Domain APIs.

**Context:** We needed a way to document our APIs and ensure consistency between implementation and documentation.

**Benefits:**
- Self-documenting APIs
- Foundation for API tools like Swagger UI
- Contract-first design approach
- Helps identify inconsistencies early

**Implementation Details:**
- YAML format for readability
- Detailed schema definitions with examples
- Clear error response documentation
- Tests to validate specification correctness

## Challenges and Solutions

### 1. TypeScript Type Safety vs. Runtime Validation

**Challenge:** Express doesn't provide type information for request bodies by default, making TypeScript typechecking challenging.

**Solution:** Combined TypeScript interfaces with runtime validation:
- Defined interfaces for request/response types
- Added explicit validation before type assertion
- Created helper functions to safely transform validated data

### 2. Circular Dependencies

**Challenge:** Encountered circular dependency issues between Domain client adapters and services.

**Solution:**
- Used dynamic imports in strategic places
- Restructured imports to break dependency cycles
- Leveraged TypeScript module patterns for better isolation

### 3. Error Handling

**Challenge:** Needed to translate domain-specific errors to user-friendly Edge API errors.

**Solution:**
- Created a custom error mapper in the middleware
- Designed consistent error response format
- Added validation error details without exposing internal implementation

## Learnings and Observations

1. **Type Safety is Multi-Layered:** TypeScript provides compile-time safety, but runtime validation is still necessary for APIs. The combination of both provides comprehensive protection.

2. **Transformation Functions are Powerful:** The transformer pattern proved to be a clean and maintainable way to handle different representations of the same underlying data.

3. **Test-Driven Development Works:** Writing tests first helped clarify the desired behavior and catch issues early. The 100% test coverage for transformers gives confidence in their correctness.

4. **Client Adapter Pattern is Flexible:** The ability to switch between direct and HTTP communication provides deployment flexibility and better testing options.

5. **OpenAPI-First Design:** Starting with OpenAPI specifications before implementation helped guide the development and ensure consistency.

## Future Improvements

### 1. Streamline Error Mapping

**Current Challenge:** Mapping domain-specific errors to Edge API errors is currently done manually on a case-by-case basis. As the application grows, this approach will become increasingly tedious and potentially error-prone.

**Potential Solutions:**
- Create a centralized error mapping registry or dictionary
- Build an automatic error translation middleware
- Implement a class-based error hierarchy that handles translations
- Generate error mappings from OpenAPI specifications

Any of these approaches would reduce the manual effort required and ensure consistent error handling across the application.

## Naming Convention Standardization (Completed)

**Decision:** Standardized all API and service methods to consistently use "ContextThread" terminology instead of mixing "Thread" and "ContextThread".

**Context:** We had inconsistent naming in our codebase, where our domain model was named `ContextThread`, but many method names, parameters, and API paths used just "Thread". This created confusion and cognitive overhead for developers.

**Implementation Details:**
- Renamed method interfaces in domain types:
  - `ThreadParams` → `CreateContextThreadParams` and `UpdateContextThreadParams` (separated concerns)
- Updated method names in ContextThreadService:
  - `createThread` → `createContextThread`
  - `getThread` → `getContextThread`
  - `updateThread` → `updateContextThread`
  - `addMessage` → `addMessageToContextThread`
  - `deleteThread` → `deleteContextThread`
  - `updateMessage` → `updateMessageInContextThread`
- Created a standardized `ContextThreadClient` interface
- Updated client implementations to reflect the new naming conventions:
  - `DirectContextThreadClient`
  - `HttpContextThreadClient`
- Updated the client factory to return the new interface type
- Modified all domain API routes to use the standardized method names
- Updated unit tests to use the new method signatures

**Benefits:**
- Improved code readability and clarity
- Reduced cognitive overhead for developers
- Made documentation and error messages more consistent
- Simplified onboarding for new team members
- Better alignment between interface names, method names, and domain concepts

**Approach:**
- Used TDD methodology by first creating tests with the desired naming convention
- Implemented changes progressively to ensure quality
- Validated changes with comprehensive tests
- Created dedicated client interface to formalize the API contract

## Looking Forward

The Edge API implementation and naming standardization set the foundation for the next milestone, which will focus on adding authentication. The transformer pattern we established will make it easier to add user-specific information to API responses without changing the domain models.

The adapter pattern will allow us to experiment with different authentication strategies (token-based, OAuth, etc.) while keeping the domain services focused on core business logic.

## Technical Details

### New Dependencies Added
- `ajv` - JSON Schema validator
- `ajv-formats` - Format validators for Ajv
- `swagger-ui-express` - Swagger UI for API documentation
- `express-basic-auth` - Basic authentication for API docs
- `yaml` - YAML parsing for OpenAPI specs

### Key Files Created
- `src/routes/edge/conversation.ts` - Edge API routes for conversations
- `src/routes/edge/transformers/conversation-transformers.ts` - Transformer functions
- `src/clients/domain/context-thread-client-factory.ts` - Client adapter factory
- `src/clients/domain/direct-context-thread-client.ts` - Direct client adapter
- `src/clients/domain/http-context-thread-client.ts` - HTTP client adapter
- `openapi/edge-api.yaml` - Edge API OpenAPI specification
- `openapi/domain-api.yaml` - Domain API OpenAPI specification

### API Endpoints
The Edge API now exposes the following endpoints:
- `GET /api/v1/conversations` - List all conversations
- `POST /api/v1/conversations` - Create a new conversation
- `GET /api/v1/conversations/{conversationId}` - Get a specific conversation
- `PUT /api/v1/conversations/{conversationId}` - Update a conversation
- `DELETE /api/v1/conversations/{conversationId}` - Delete a conversation
- `POST /api/v1/conversations/{conversationId}/messages` - Add a message to a conversation
