# Understanding Providers as Secondary Adapters

## The Hexagonal Architecture Model

```
     User
       │
       ▼
┌─────────────┐
│   Primary   │ ← Driving Side (Edge Tier)
│   Adapter   │   "I drive the application"
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Application │
│    Core     │ ← Domain Tier
│  (Hexagon)  │   "I contain business logic"
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Secondary  │ ← Driven Side (Providers)
│   Adapter   │   "I am driven by the application"
└──────┬──────┘
       │
       ▼
   Database/API
```

## Primary vs Secondary Adapters

### Primary Adapters (Driving)
- **Drive** the application (user initiates action)
- Examples: REST controllers, CLI, GUI, MCP server
- They **call into** the domain

### Secondary Adapters (Driven)  
- Are **driven by** the application
- Examples: Database repos, external APIs, file systems
- The domain **calls them**

## Why "Providers"?

The term "provider" makes sense because these adapters **provide services** to the domain:

```typescript
// Domain defines what it NEEDS (port)
interface IUserRepository {
  findById(id: string): Promise<User>
  save(user: User): Promise<void>
}

// Provider PROVIDES the implementation
class PostgresUserRepository implements IUserRepository {
  async findById(id: string): Promise<User> {
    // SQL queries, connection handling, etc.
  }
}
```

## Real Example from Your Codebase

```typescript
// DOMAIN TIER - Defines the port (what it needs)
// server/src/providers/llm/ILlmService.ts
interface ILlmService {
  streamPrompt(prompt: string, options: LlmOptions): AsyncIterable<string>
}

// DOMAIN TIER - Uses the port
// server/src/services/core/ChatService.ts
class ChatService {
  constructor(private llmService: ILlmService) {} // Depends on abstraction
  
  async chat(prompt: string) {
    // Business logic here
    const stream = this.llmService.streamPrompt(prompt, {...})
    // More business logic
  }
}

// PROVIDER - Provides the implementation
// server/src/providers/llm/anthropic/AnthropicService.ts
class AnthropicService implements ILlmService {
  async *streamPrompt(prompt: string, options: LlmOptions) {
    // All the Anthropic SDK details
    // API keys, HTTP calls, error handling
    // The messy integration stuff
  }
}
```

## The Flow

```
1. User makes request → Edge Tier (Primary Adapter)
                           │
                           ▼
2. Edge calls → Domain Service (ChatService)
                    │
                    ▼
3. Domain needs LLM → Calls ILlmService port
                           │
                           ▼
4. Provider supplies → AnthropicService implementation
```

## Why This Architecture?

### 1. **Dependency Inversion**
- Domain depends on abstractions (ILlmService)
- Not on concrete implementations (AnthropicService)
- Can swap providers without changing domain

### 2. **Testing**
```typescript
// Easy to test domain with mock provider
const mockLlmService: ILlmService = {
  async *streamPrompt() {
    yield "test response"
  }
}
const chatService = new ChatService(mockLlmService)
```

### 3. **Flexibility**
```typescript
// Can easily switch providers
const llmService = process.env.LLM_PROVIDER === 'openai' 
  ? new OpenAIService()
  : new AnthropicService()
```

## Your Provider Structure

```
providers/
  ├── auth/          → Provides authentication
  ├── db/            → Provides data persistence  
  ├── llm/           → Provides LLM capabilities
  └── storage/       → Provides file storage

Each "provides" a capability the domain needs
```

## Common Confusion

**Q: Why aren't providers in the edge tier if they're "external"?**

A: Because of the direction of dependency:
- Edge tier **drives** the application (user → app)
- Providers are **driven by** the application (app → external service)

**Q: What about providers that call external APIs?**

A: They're still secondary adapters because:
- The domain initiates the call
- The provider is implementing a domain-defined interface
- The external API is a detail hidden behind the abstraction

## Summary

- **Providers = Secondary Adapters**
- They **provide** services the domain needs
- Domain defines interfaces (ports)
- Providers implement those interfaces
- This creates clean, testable, flexible architecture