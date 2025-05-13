-- Schema for users table and related tables
-- To be added to the main schema.sql file

-- Users table storing core user information and JSON data for flexible storage
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL, -- UUID v4
    email TEXT NOT NULL UNIQUE,   -- Primary email (unique)
    display_name TEXT NOT NULL,   -- User's display name
    created_at INTEGER NOT NULL,  -- Unix epoch milliseconds
    updated_at INTEGER NOT NULL,  -- Unix epoch milliseconds
    
    -- JSON object for OAuth providers - allows for flexible provider relationships
    -- Format: { "google": { "providerId": "...", "identity": "...", "refreshToken": "...", "updatedAt": 123 }, ... }
    auth_providers TEXT NOT NULL DEFAULT '{}',
    
    -- JSON object for API keys - allows for flexible provider support
    -- Format: { "openai": { "key": "encrypted-key", "label": "...", "createdAt": 123, "lastUsed": 456 }, ... }
    api_keys TEXT NOT NULL DEFAULT '{}',
    
    -- JSON object for user preferences
    -- Format: { "theme": "dark", "defaultModel": "gpt-4", ... }
    preferences TEXT DEFAULT '{}'
);

-- Create indexes for common lookup patterns
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at);

-- Create indexes for JSON search (SQLite supports JSON path functions)
-- These allow efficient lookups within the JSON data without extracting it all
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users((json_extract(auth_providers, '$.google.providerId')));
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users((json_extract(auth_providers, '$.github.providerId')));