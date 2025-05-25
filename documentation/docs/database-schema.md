# Database Schema Documentation

This document details the database schema for Liminal Type Chat, providing information about tables, fields, and their relationships.

## Overview

Liminal Type Chat uses SQLite as its database engine for the MVP. The database stores conversation threads, messages, and application health information.

## Tables

### 1. health_checks

This table stores health check statuses for system monitoring.

| Column       | Type    | Description                               | Constraints        |
|--------------|---------|-------------------------------------------|-------------------|
| id           | TEXT    | Unique identifier                         | PRIMARY KEY        |
| name         | TEXT    | Name of the health check                  | NOT NULL          |
| status       | TEXT    | Status (pass, warn, fail)                 | NOT NULL          |
| description  | TEXT    | Description of the health check           | NOT NULL          |
| last_checked | INTEGER | Timestamp of last check (epoch ms)        | NOT NULL          |

### 2. context_threads

This table stores conversation threads and their associated messages.

| Column     | Type    | Description                               | Constraints        |
|------------|---------|-------------------------------------------|-------------------|
| id         | TEXT    | Unique identifier (UUID)                  | PRIMARY KEY        |
| title      | TEXT    | Optional thread title                     | NULL              |
| created_at | INTEGER | Creation timestamp (epoch ms)             | NOT NULL          |
| updated_at | INTEGER | Last update timestamp (epoch ms)          | NOT NULL          |
| messages   | TEXT    | JSON string array of Message objects      | NOT NULL          |
| metadata   | TEXT    | Optional JSON string of key-value metadata| NULL              |

#### Message Object Schema (stored as JSON in `messages` column)

The `messages` column stores an array of Message objects serialized as a JSON string. Each Message object has the following structure:

```json
{
  "id": "string",          // UUID
  "threadId": "string",    // UUID matching parent context_thread.id
  "role": "string",        // One of: "user", "assistant", "system", "tool"
  "content": "string",     // Message text content
  "createdAt": number,     // Timestamp (epoch ms)
  "metadata": object,      // Optional key-value pairs (optional)
  "status": "string"       // One of: "pending", "streaming", "complete", "error", "interrupted" (optional)
}
```

## Design Decisions

### Denormalization of Messages

For the MVP, messages are stored directly within the `context_threads` table as a JSON array string. This denormalized approach offers several benefits:

1. **Simplified Retrieval**: Common operations (loading a full thread with all messages) require only a single query
2. **Reduced Complexity**: No need for joins or multiple queries in the MVP phase
3. **Flexibility**: Message schema can evolve without database migrations

This approach trades some data integrity guarantees for implementation simplicity. In future iterations, if needed, messages could be moved to a separate table with appropriate foreign key relationships.

### JSON for Metadata

Both the `context_threads.metadata` and the metadata within message objects use JSON for flexible storage of arbitrary key-value pairs. This allows for:

1. **Schema Evolution**: New metadata fields can be added without schema changes
2. **Application-Specific Data**: Different types of threads or messages can store relevant metadata
3. **Future Extensibility**: Additional properties can be stored without database modifications

### Timestamp Format

All timestamps are stored as integer values representing milliseconds since the Unix epoch (January 1, 1970). This format:

1. **Simplifies Sorting**: Integer-based timestamps are easily comparable and sortable
2. **Maintains Precision**: Millisecond precision is preserved
3. **Avoids Timezone Issues**: Epoch timestamps are timezone-agnostic

## Error Handling

The application implements specific error handling for JSON parsing:

- If `JSON.parse(messages)` fails during thread retrieval, a custom `MessagesCorruptedError` with code `ERR_MSG_CORRUPT` is thrown
- If `JSON.parse(metadata)` fails, the error is logged but the thread is returned with `metadata` set to `undefined`

## Migrations

The database schema is initialized during application startup by applying SQL scripts from the `/server/db/schema.sql` file. Future schema changes will be managed through versioned migration scripts.
