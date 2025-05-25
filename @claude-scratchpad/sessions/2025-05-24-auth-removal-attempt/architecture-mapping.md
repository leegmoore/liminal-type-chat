# Architecture Component Mapping

## Current Question: Where Should Components Live?

### Component Placement Based on Hexagonal Architecture

```
┌─────────────────────────────────────────────────┐
│              EDGE TIER                          │
│        (Infrastructure Layer)                   │
│                                                 │
│  ✓ MCP Server                                  │
│  ✓ HTTP/SSE Endpoints                         │
│  ✓ External API Calls                         │
│  ✓ Command Line Utils                         │
│  ? LLM Provider Classes                        │
│                                                 │
├─────────────────────────────────────────────────┤
│             DOMAIN TIER                         │
│      (Domain + Application Layers)             │
│                                                 │
│  • Business Entities (ContextThread, Message)  │
│  • Business Rules                              │
│  • Use Cases (ChatService)                     │
│  • Port Interfaces (ILlmService)              │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Key Decision: LLM Provider Classes

### Current Structure
```
providers/
  llm/
    ILlmService.ts         (Interface - Port)
    LlmServiceFactory.ts   (Factory)
    anthropic/
      AnthropicService.ts  (Implementation - Adapter)
```

### Two Valid Approaches:

**Option 1: Keep LLM Providers in Current Location**
- Port (ILlmService) stays with domain
- Implementations are secondary adapters
- Domain depends on port, not implementation
- ✅ Follows dependency inversion

**Option 2: Move LLM Providers to Edge**
- All external integrations in edge tier
- Domain only knows about abstract streaming
- Edge handles all provider complexity
- ✅ Cleaner separation of concerns

## Recommendation

**Keep current structure** but clarify responsibilities:

1. **Domain Tier**:
   - ILlmService interface (port)
   - ChatService (orchestration)
   - Business logic only

2. **Providers** (Secondary Adapters):
   - AnthropicService implementation
   - API key management
   - Provider-specific details

3. **Edge Tier** (Primary Adapters):
   - MCP Server
   - HTTP endpoints
   - SSE streaming
   - External API calls
   - CLI tool execution
   - Request/response transformation

## Why This Split?

- **MCP on Edge**: It's user-facing integration
- **CLI Tools on Edge**: External system integration
- **LLM Providers as Secondary Adapters**: They implement domain ports
- **Domain stays pure**: Only business logic and abstractions