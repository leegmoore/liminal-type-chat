# Milestones & Roadmap Overview

The project follows a phased development approach.
- **MVP 1 (Complete):** Focused on establishing the core architecture, backend setup, frontend serving, database connectivity, edge-domain communication, CI pipeline, and foundational health checks.
- **MVP 2 (In Progress):** Focuses on implementing core chat functionality, user authentication, conversation management, and initial LLM integration.
- **Future:** Includes advanced features like multi-model support, orchestration, RAG, and plugin architecture.

Refer to `docs/ROADMAP.md` for detailed planning.

# Minimum Viable Product (MVP) Scope (Initial Definition)

The MVP will focus on delivering a functional backend service and a very basic way to interact with it, proving the core BYOK chat loop.

**Primary Goal:** A user can have a persistent conversation with an LLM using their own API key.

**Core Features:**

1.  **Context Thread Management (API-driven):**
    - Create new context threads.
    - Retrieve a specific context thread, including all its messages.
    - List available context threads (metadata only).
    - (Optional for MVP, but desirable) Update thread metadata (e.g., title).
    - (Optional for MVP, but desirable) Delete a context thread.
2.  **Message Persistence (SQLite):**
    - All user and assistant messages within a context thread are stored in a local SQLite database.
    - The `context_threads` table will include a JSON field for the `messages` array. (*Note: This was the initial idea, later revised based on Supabase structure - see Memory*) 
3.  **LLM Interaction (Single Model per Turn via API):**
    - An API endpoint to send a user's message (as part of a context thread) to a user-specified LLM.
    - The application proxies the request (using the user's key, provided via server-side config initially) and stores the LLM's response.
    - Track the `last_model` used and the model per assistant message.
4.  **Basic User Association:**
    - A simple `users` table in SQLite.
    - Context threads are associated with a `user_id`. For MVP, this might be a single, implicit default user.
5.  **Service API (RESTful):**
    - HTTP endpoints for all CRUD operations on context threads and for triggering LLM generation.

**Out of Scope for MVP:**

-   Sophisticated User Interface (UI will be minimal, possibly a CLI or simple test client).
-   Advanced multi-model features (e.g., simultaneous prompting, complex chains).
-   Real-time features beyond basic request-response (streaming from LLM is desirable but secondary to persistence).
-   Complex authentication/authorization (focus on local use).
-   User management beyond the basic `users` table.
-   Public hosting or multi-tenancy.
-   In-app management of LLM API keys (keys configured server-side).
