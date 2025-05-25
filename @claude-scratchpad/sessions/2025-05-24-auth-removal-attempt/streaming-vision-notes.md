# Streaming Vision Notes - Liminal Type Chat

## Key Findings from PRD and Technical Architecture

### Streaming in the Product Vision

1. **AI Roundtable as Core Feature** (PRD lines 142-161, 266-281)
   - Multiple AI perspectives collaborating in real dialogue
   - Use @mentions to orchestrate focused discussions
   - Example: `@Architect design system → @SecurityExpert review → @both discuss`
   - Key differentiator: "The only platform where multiple AI perspectives collaborate in real dialogue, not just sequential responses"

2. **Real-time Streaming Requirements** (PRD line 124)
   - "Real-time streaming responses" listed as MVP feature
   - Part of "Enhanced Chat Interface" in Phase 2

3. **Platform Architecture Vision** (PRD lines 315-323)
   - Liminal Type Chat is foundation for ecosystem:
     - Liminal-flow: AI-augmented music creation
     - Liminal-write: Multi-perspective writing
     - Liminal-think: Decision support
   - Extensible foundation for specialized workflows

### Streaming Architecture Design

1. **Three-Layer Streaming Architecture** (Tech Architecture lines 496-584)
   - **Domain Tier**: Provider-agnostic streams, pure business logic
   - **Edge Tier**: Orchestration, multiplexing, tool calls, error recovery
   - **Transport**: Server-Sent Events (SSE) for compatibility

2. **Stream Flow** (lines 504-530)
   ```
   UI (EventSource) → Edge (Orchestration) → Domain (Pure Streams) → LLM Providers
   ```

3. **Key Design Decisions**:
   - **Why SSE over WebSockets** (lines 578-584):
     - Industry standard for LLM streaming
     - Simpler implementation
     - Automatic reconnection
     - Better proxy/firewall compatibility
   
   - **Why Edge handles orchestration** (lines 573-577):
     - Security boundary for tool execution
     - Client-specific optimizations
     - Natural place for auth/rate limiting

4. **AI Roundtable Streaming** (lines 664-724)
   - Stream multiplexing at Edge tier
   - Fair scheduling between multiple panelists
   - Session state management for routing
   - Example implementation shows parallel stream creation

5. **MCP Integration** (lines 585-663)
   - Tool execution during streaming
   - Process isolation for security
   - Streaming tool results support planned

### Platform Considerations (lines 726-756)

1. **Multi-Application Support**:
   - Shared Edge tier for different UIs (Chat, Flow, Custom)
   - Common streaming infrastructure
   - Extension points for specialized APIs

2. **Plugin Architecture**:
   - Edge tier routes to extension-specific endpoints
   - Domain services extensible with new capabilities
   - MCP servers for specialized tools

### Key Quotes

- "Welcome to the Threshold" - Product tagline emphasizing transformation
- "The only platform where multiple AI perspectives collaborate in real dialogue"
- "Abstract Streams at Domain Level... Orchestration at Edge Level"
- "Industry standard for LLM streaming (OpenAI, Anthropic)"

### Architectural Principles for Streaming

1. **Separation of Concerns**: Domain handles pure streams, Edge handles orchestration
2. **Security First**: Tool execution at Edge boundary
3. **Flexibility**: Support for multiple providers and deployment models
4. **Platform Thinking**: Shared infrastructure for ecosystem of apps