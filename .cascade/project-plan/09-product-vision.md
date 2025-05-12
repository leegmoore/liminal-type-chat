# Product Summary and Vision

The core idea is to develop "Liminal Type Chat" (working title), an open-source Generative AI chat application designed for the "Bring-Your-Own-Key" (BYOK) power user who wants maximum flexibility, extensibility, and control.

The primary distribution model is a downloadable application that users can run locally with minimal setup, intended to serve individuals, families, or small, trusted teams. This means users will typically run a local API service and a local web service (for the UI) on their own machines. The vision is not to create a large-scale, multi-tenant SaaS application, but rather a flexible, user-centric tool optimized for small-scale deployments.

**Key characteristics include:**

- **Comprehensive BYOK Support**: Users leverage their own API keys for any LLM provider (OpenAI, Anthropic, Google, etc.), giving them complete control over cost, model choice, and privacy. No user data or keys are stored outside the local environment unless explicitly configured.

- **Advanced LLM Orchestration**: Beyond simple chat, the application will support sophisticated LLM workflows including multi-LLM prompting (send one prompt to multiple models), LLM chaining (use one model's output as another's input), and support for Model Control Protocol (MCP) tooling.

- **Extensibility Framework**: Pre and post-processing hooks for LLM interactions, a plugin architecture for adding new capabilities, and support for custom tools and function calling.

- **Open Source & Local First**: Easily downloadable and runnable locally, promoting transparency and community contribution. SQLite provides robust local storage that's fast and reliable for typical usage patterns.

- **Architectural Flexibility**: While optimized for local execution, the system maintains architectural points of indirection that allow for potential future adaptation to larger deployments or alternative databases. The local-run experience remains the priority.

- **Simple Setup, Efficient Execution**: Minimal configuration required to get started, with performance optimized for small-scale usage. The application aims to provide a responsive, well-performing experience through lean implementation.

- **Developer-Friendly**: Clean architecture, comprehensive documentation, and thorough testing make the codebase accessible for customization and extension.

The application is designed for technical users who are comfortable managing API keys and running local server components, prioritizing power and flexibility over simplified UX for non-technical users.
