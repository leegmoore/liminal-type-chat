-- server/db/schema.sql

CREATE TABLE IF NOT EXISTS context_threads (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT, -- Nullable
    created_at INTEGER NOT NULL, -- Unix epoch milliseconds
    updated_at INTEGER NOT NULL, -- Unix epoch milliseconds
    metadata TEXT, -- JSON object stored as text, Nullable
    messages TEXT NOT NULL DEFAULT '[]' -- JSON array of Message objects stored as text
);

-- Optional: Consider adding an index for potential future lookups if needed,
-- though likely not necessary for MVP with few threads.
-- CREATE INDEX IF NOT EXISTS idx_context_threads_updated_at ON context_threads(updated_at);
