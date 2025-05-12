# Milestone 0006 (was M5): Core ContextThread Domain Layer

- **Objective**: Implement the core domain logic for managing `ContextThread`s and `Message`s, including data models, persistence, domain services, domain API routes, and establish the database schema documentation process.

## Scope

1.  `ContextThread` and `Message` Domain Model Definitions (JSON Schema).
2.  Database Schema Definition for `context_threads` table (`schema.sql`).
3.  Database Schema Documentation (`docs/database-schema.md`).
4.  Data Access Layer (`ContextThreadRepository`) implementation.
5.  Domain Service Layer (`ContextThreadService`) implementation.
6.  Domain API Routes implementation (following the established architecture).
7.  Unit Tests for the Data Access, Domain Service, and Domain API layers.

## Plan

1.  **Define `Message` JSON Schema:** Create `/server/src/schemas/domain/Message.json` (including `id`, `threadId`, `role`, `content`, `createdAt`, `metadata?`, `status?`).
2.  **Define `ContextThread` JSON Schema:** Create `/server/src/schemas/domain/ContextThread.json` (including `id`, `title?`, `createdAt`, `updatedAt`, `metadata?`, `messages` array referencing `Message` schema).
3.  **Define Database Schema (`schema.sql`):** Finalize and create `/server/db/schema.sql` with `CREATE TABLE context_threads`. *(Status: Complete)*
4.  **Implement `ContextThreadRepository`:** Create in `/server/src/providers/db/`. Responsibilities: CRUD operations; parse `messages` JSON on read, stringify `messages` array on write. Include unit tests (mocking DB driver).
5.  **Implement `ContextThreadService`:** Create in `/server/src/services/core/`. Responsibilities: Business logic; generate UUIDs/timestamps; manage `Message` status; call `normalizeThreadMessages` before saving. Include unit tests (mocking Repository).
    *   Implement `normalizeThreadMessages` utility (initially sorts messages by `createdAt`).
6.  **(Optional Generation) Define TypeScript Types:** Define `ContextThread` and `Message` interfaces (e.g., in `/server/src/types/domain.ts`). *Optionally*, configure tooling (e.g., `json-schema-to-typescript`) to generate these from the JSON schemas; otherwise, create them manually.
7.  **Implement Domain API Routes:** Create in `/server/src/routes/domain/context-thread.ts`. Expose the `ContextThreadService` operations as API endpoints. This follows the established architectural pattern that supports both single-process and multi-process deployment models. Include unit tests (mocking Service layer).
8.  **Create/Update Database Documentation:** Ensure `docs/database-schema.md` reflects the `schema.sql` definition.

## Design

### Domain Model Definition (JSON Schema)

*(Path: `/server/src/schemas/domain/`)*

Define JSON schemas for the canonical domain entities. These represent the core business concepts independent of storage. See Memory[2fff6f28].

*   **`Message`**: Represents a single message within a `ContextThread`.
    *   `id`: string (UUID format) - Unique identifier.
    *   `threadId`: string (UUID format) - Identifier of the parent `ContextThread`.
    *   `role`: string (enum: 'user', 'assistant', 'system') - Originator of the message.
    *   `content`: string - The textual content of the message.
    *   `createdAt`: number - Timestamp (Unix epoch milliseconds) of creation.
    *   `metadata?`: object - Optional key-value pairs (e.g., LLM response details, token counts).
    *   `status?`: string (enum: 'complete', 'in_progress', 'error', 'interrupted', default: 'complete') - Optional field indicating the lifecycle status.
*   **`ContextThread` (Canonical)**: Represents a single conversation or context.
    *   `id`: string (UUID format) - Unique identifier.
    *   `title`: string | null - Optional user-defined title.
    *   `createdAt`: number - Timestamp (Unix epoch milliseconds) of creation.
    *   `updatedAt`: number - Timestamp (Unix epoch milliseconds) of last update.
    *   `metadata?`: object - Optional key-value pairs for arbitrary metadata.
    *   `messages`: array (of `Message` objects) - All messages belonging to this thread, typically ordered by `createdAt`.

*(Note: The `ContextThread` model defined here is the canonical representation exposed and operated on by the Domain Service layer.)*

### Database Schema Definition

*(Source of Truth: `/server/db/schema.sql`, Documentation: `docs/database-schema.md`)*

Using SQLite. Messages are denormalized and stored as a JSON array string directly within the `context_threads` table to simplify read operations for the MVP.

*   **`context_threads` table:**
    *   `id` TEXT PRIMARY KEY NOT NULL - Maps to `ContextThread.id`.
    *   `title` TEXT NULL - Maps to `ContextThread.title`.
    *   `created_at` INTEGER NOT NULL - Maps to `ContextThread.createdAt` (stored as Unix epoch ms).
    *   `updated_at` INTEGER NOT NULL - Maps to `ContextThread.updatedAt` (stored as Unix epoch ms).
    *   `metadata` TEXT NULL - Maps to `ContextThread.metadata` (stored as JSON text).
    *   `messages` TEXT NOT NULL DEFAULT '[]' - Maps to `ContextThread.messages` (stored as a JSON array of Message objects, stringified).

### Database to Domain Mapping

*(Responsibility primarily lies with the `ContextThreadRepository`, with the `ContextThreadService` orchestrating.)*

*   **Repository Role**: Interacts with `context_threads` table. Parses `messages` TEXT to JSON on read; stringifies `messages` array on write. Handles `snake_case` to `camelCase` mapping.
*   **Service Role**: Operates on domain objects. Calls repository. Generates IDs/timestamps. Ensures message order via `normalizeThreadMessages`. Handles business logic.
*   **Naming Convention**: DB: `snake_case`, Domain: `camelCase`. Handled in Repository/Service.
*   **Data Types**: Timestamps (DB: `INTEGER` epoch ms, Domain: `number`), JSON (DB: `TEXT`, Domain: `object`/`array`), UUIDs (DB: `TEXT`, Domain: `string`).

### Error Handling (JSON `messages` field)

*   **Repository Read**: If `JSON.parse(messages)` fails: Log error (with `thread_id`), throw custom `MessagesCorruptedError` (code `ERR_MSG_CORRUPT`).
*   **Service Layer Handling**: Catch `MessagesCorruptedError`. On read, return `null` and log. On write involving messages, propagate error.
*   **Edge/API Layer Handling**: Map `MessagesCorruptedError` (or `null` response) to appropriate HTTP response (e.g., `500`, code `ERR_MSG_CORRUPT`).

### ID and Timestamp Generation

*   **Responsibility**: `ContextThreadService` generates UUIDs (`uuid` library) and timestamps (`Date.now()`) before calling repository.

### Message Ordering

*   **Responsibility**: `ContextThreadService` calls `normalizeThreadMessages(thread)` before saving.
*   **Mechanism**: Utility modifies `thread.messages` array in place.
    *   **M0006 Scope**: Sorts by `createdAt`. See Memory[45dc7718].
    *   **Future Scope**: Enhance for status, race conditions.
*   **Repository**: Saves the pre-sorted array stringified.

## Tests

### Unit Test Conditions

*(Mock dependencies like the DB driver for Repository tests, and the Repository for Service tests)*

**ContextThreadRepository:**
*   **Create Thread**: Verify successful insertion of a new thread record with correct data mapping (camelCase -> snake_case, JSON stringify).
*   **Get Thread by ID (Exists)**: Verify retrieval of a thread, correct data mapping (snake_case -> camelCase), successful parsing of valid `messages` and `metadata` JSON.
*   **Get Thread by ID (Not Found)**: Verify returns `null` for a non-existent ID.
*   **Get Thread by ID (Corrupted Messages JSON)**: Verify `MessagesCorruptedError` is thrown when `messages` JSON is invalid.
*   **Get Thread by ID (Corrupted Metadata JSON)**: Verify error is logged, but method potentially returns thread with `metadata` as `undefined` or `null` (confirm desired behavior).
*   **Update Thread**: Verify successful update of fields (title, metadata, messages, updated_at), correct data mapping and stringification.
*   **Delete Thread**: Verify successful deletion of a thread record.
*   **List Threads (if implemented)**: Verify retrieval of a list of threads (consider pagination/ordering later).
*   **DB Error Handling**: Verify repository correctly handles/propagates errors from the mocked DB driver during operations (insert, select, update, delete, etc.).

**ContextThreadService:**
*   **Create Thread**: Verify service generates ID/timestamps, calls repository `create` with correctly mapped and stringified data.
*   **Get Thread (Success)**: Verify service calls repository `getById` and returns parsed thread domain object.
*   **Get Thread (Not Found)**: Verify service handles repository returning `null` (e.g., returns `null`).
*   **Get Thread (Corrupted Messages)**: Verify service catches `MessagesCorruptedError` from repository and handles it (e.g., returns `null`, logs error).
*   **Add Message (Success)**: Verify service fetches thread, generates message ID/timestamp, adds message to array, calls `normalizeThreadMessages`, calls repository `update` with correct data (new message, updated timestamp, sorted stringified array).
*   **Add Message (Thread Not Found)**: Verify service handles the error case appropriately (e.g., throws specific error like `ThreadNotFoundError` or returns `null`).
*   **normalizeThreadMessages**: Verify utility correctly sorts messages by `createdAt` (initial scope).

**General:**
*   Ensure appropriate logging is present in error paths (e.g., JSON parsing errors).

### Domain API Test Conditions

*   **Thread Endpoints (`/domain/threads`)**:
    * **POST**: Test successful creation, validation errors, and proper response status codes/bodies.
    * **GET /:id**: Test successful retrieval, not found errors, and handling corrupted data.
    * **PUT /:id**: Test successful updates, handling not found errors, and validation errors.
    * **DELETE /:id**: Test successful deletion and handling not found errors.
*   **Message Endpoints (`/domain/threads/:id/messages`)**:
    * **POST**: Test successful message addition, thread not found errors, and validation errors.
    * **GET**: Test successful message retrieval, handling empty arrays, and thread not found errors.
    * **PUT /:messageId**: Test successful message updates, not found errors (thread or message), and validation errors.

---
*Document Version: 2 (Created due to edit issues with original)*

### Key Design Decisions

*   **Denormalization:** Storing `messages` as a JSON array within the `context_threads` table simplifies retrieval for the common use case (loading a full thread) and avoids complex joins or multiple queries for the MVP.
*   **Error Handling (JSON):** The Repository layer is responsible for safely parsing the `messages` JSON. If parsing fails (corrupted data), it should throw a specific, catchable error (`MessagesCorruptedError`) rather than returning partial data. The Service layer will decide how to handle this (e.g., log, return an error state thread).
*   **Immutability:** Treat domain objects (like `ContextThread` and `Message`) as immutable where practical. Operations should return new instances rather than modifying existing ones.
*   **Timestamp Generation:** The Service layer is responsible for generating `createdAt` and `updatedAt` timestamps.
*   **ID Generation:** The Service layer is responsible for generating UUIDs for new threads and messages.
*   **`normalizeThreadMessages` Responsibility:** Initially, this utility only sorts messages. Future enhancements (e.g., handling status, merging partials) will be added in later milestones.
*   **TypeScript Interfaces:** Domain model interfaces (`ContextThread`, `Message`) *must* be created (in `/server/src/types/domain.ts`). *Optionally*, configure tooling (e.g., `json-schema-to-typescript`) to generate these from the JSON schemas; otherwise, create them manually.
*   **UUID Generation:** Use the standard `uuid` package (specifically `v4`) for generating IDs within the Service layer.
*   **Logging:** For initial implementation, use `console.error` for logging critical errors like JSON parsing failures in the Repository. Refactor to a dedicated logger utility if one is established later.
*   **Custom Errors:** Place custom error classes (e.g., `MessagesCorruptedError`) in a dedicated `errors.ts` file within the relevant module directory (e.g., `/server/src/providers/db/errors.ts`).
*   **Test Database:** Unit tests for the repository layer should utilize an in-memory SQLite database (`':memory:'`) provided by `better-sqlite3`.
*   **Denormalization Rationale:** Denormalization simplifies the MVP by reducing the need for complex queries and joins, but may require additional maintenance for data consistency in the future.
*   **Error Propagation:** Errors from the Repository layer should be propagated to the Service layer, which decides how to handle them (e.g., logging, returning error states).
*   **Domain Model Evolution:** The domain model (JSON schemas and TypeScript interfaces) should evolve as the application's requirements change, ensuring that the domain logic remains consistent and accurate.
*   **Repository and Service Layer Responsibilities:** Clearly define the responsibilities of each layer to avoid confusion and ensure maintainability.
*   **Testing Strategy:** Unit tests should cover critical paths and error scenarios for both the Repository and Service layers, ensuring that the domain logic is correct and robust.
