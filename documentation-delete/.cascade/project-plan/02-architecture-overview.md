# System Architecture Overview

The application follows a four-tier conceptual architecture implemented within a monorepo structure:

1.  **UI Tier (Presentation):** Handles user interaction. Implemented using React and TypeScript in the `/client` directory.
2.  **Edge/XPI Tier (Experience/Adaptation):** Routes HTTP requests, transforms data between UI and Domain formats, acts as a Backend-for-Frontend (BFF). Resides within the Node.js/Express server in the `/server` directory.
3.  **Domain API Tier (Core Services/Business Logic):** Contains core business logic, service operations, and canonical data models. UI-agnostic. Resides within the Node.js/Express server in the `/server` directory.
4.  **Datasources & External Services Tier (Integration):** Provides access to databases (SQLite initially, planned Supabase), LLM providers, etc. Integrated within the Domain tier.

Communication between the Edge and Domain tiers is handled by a Domain Client Adapter pattern (see Key Code Patterns). Data transformation between Edge API contracts and Domain models is managed through dedicated transformer functions, enabling schema evolution independence and multi-client support.
