# Development Standards: Database Structure

- Tables should have singular names for entity tables (e.g., `user`) and plural names for junction tables (e.g., `context_threads`)
- Each table should have a primary key, typically `id` as UUID
- Use `created_at` and `updated_at` timestamps for auditing
- Foreign keys should follow the pattern `<table_name>_id`
