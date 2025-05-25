# Technical Architecture Document
# Liminal Type Chat

**Version:** 1.1  
**Last Updated:** January 2025  
**Status:** In Development

## Overview

This document describes the technical architecture of Liminal Type Chat at a system level. It covers the tiered architecture, major components, communication patterns, and key architectural decisions that shape the application.

## Architecture Principles

### Core Principles

1. **Separation of Concerns**
   - Clear boundaries between tiers
   - Domain logic isolated from presentation
   - Pluggable provider architecture

2. **Security First**
   - End-to-end encryption for sensitive data
   - Principle of least privilege
   - Comprehensive audit trails

3. **Flexibility**
   - Local or cloud deployment
   - Multiple database options
   - Extensible plugin system

## System Architecture

### Four-Tier Architecture

The application follows a four-tier conceptual architecture that provides clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    UI Tier                              │
│              React + TypeScript                         │
│                 (/client)                               │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP
┌────────────────────▼────────────────────────────────────┐
│                 Edge/XPI Tier                           │
│            Experience & Adaptation                      │
│         (/server/src/routes/edge)                      │
│              /api/v1/* endpoints                        │
└────────────────────┬────────────────────────────────────┘
                     │ Direct or HTTP
┌────────────────────▼────────────────────────────────────┐
│               Domain API Tier                           │
│            Core Business Logic                          │
│        (/server/src/services/core)                     │
│            /domain/* endpoints                          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│        Datasources & External Services                  │
│              (/server/src/providers)                    │
│         Database | LLM APIs | Auth                      │
└─────────────────────────────────────────────────────────┘
```

#### 1. UI Tier (Presentation)
- **Location**: `/client`
- **Technology**: React 18 with TypeScript
- **Responsibilities**:
  - User interface components and pages
  - Client-side state management
  - API communication with Edge tier only
  - Responsive design and accessibility

#### 2. Edge/XPI Tier (Experience/Adaptation)
- **Location**: `/server/src/routes/edge`
- **Technology**: Express.js routes
- **Endpoints**: `/api/v1/*`
- **Responsibilities**:
  - Backend-for-Frontend (BFF) pattern
  - Request routing and validation
  - Schema transformation between UI and Domain models
  - Authentication token validation
  - Response formatting and error handling

#### 3. Domain API Tier (Core Business Logic)
- **Location**: `/server/src/services/core`
- **Technology**: TypeScript services
- **Endpoints**: `/domain/*` (when running distributed)
- **Responsibilities**:
  - Core business logic implementation
  - Domain model management
  - Business rule enforcement
  - UI-agnostic operations

#### 4. Datasources & External Services
- **Location**: `/server/src/providers`
- **Responsibilities**:
  - Database access (repositories)
  - External API integration (LLM providers)
  - Authentication providers (OAuth)
  - Encryption and security services

### Communication Patterns

#### Domain Client Adapter Pattern

This pattern enables flexible deployment options:

```typescript
// Factory pattern for creating domain clients
export function createHealthServiceClient(options?: {
  mode?: 'direct' | 'http';
  baseUrl?: string;
}): HealthServiceClient {
  const mode = options?.mode || process.env.DOMAIN_CLIENT_MODE || 'direct';
  
  if (mode === 'direct') {
    // In-process function calls for monolithic deployment
    return new DirectHealthServiceClient();
  } else {
    // HTTP calls for distributed deployment
    return new HttpHealthServiceClient({ baseUrl });
  }
}
```

**Key Benefits**:
- Deploy as monolith (direct) or microservices (HTTP)
- No code changes required for different deployment modes
- Testable with dependency injection
- Clear interface contracts

#### Schema Transformation Layer

The Edge tier transforms between external (UI-facing) and internal (Domain) schemas:

```typescript
// Domain model (internal)
interface ContextThread {
  id: string;
  title: string | null;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

// Edge model (external)
interface ConversationResponse {
  conversationId: string;
  title: string;
  createdAt: string;  // ISO format
  updatedAt: string;  // ISO format
  messages: MessageResponse[];
}

// Transformation function
function domainThreadToConversationResponse(
  thread: ContextThread
): ConversationResponse {
  return {
    conversationId: thread.id,
    title: thread.title || 'Untitled',
    createdAt: new Date(thread.createdAt).toISOString(),
    updatedAt: new Date(thread.updatedAt).toISOString(),
    messages: thread.messages.map(domainMessageToResponse),
  };
}
```

**Benefits**:
- API stability despite internal changes
- Security through field filtering
- Format optimization for clients
- Clear boundaries between tiers

## Component Architecture

### Repository Pattern

The Domain tier uses repositories for data access abstraction:

```typescript
export class ContextThreadRepository {
  constructor(private dbProvider: DatabaseProvider) {
    this.db = dbProvider.getDatabase();
  }

  async createContextThread(thread: ContextThread): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO context_threads (id, title, messages, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      thread.id,
      thread.title,
      JSON.stringify(thread.messages),
      thread.createdAt,
      thread.updatedAt
    );
  }
  
  async getContextThread(id: string): Promise<ContextThread | null> {
    // Implementation
  }
}
```

**Benefits**:
- Decouples business logic from data access
- Enables easy testing with mocks
- Supports future database migrations
- Clear separation of concerns

### Service Layer Pattern

Domain services contain business logic and orchestration:

```typescript
export class ContextThreadService {
  constructor(private repository: ContextThreadRepository) {}

  async createContextThread(params: CreateThreadParams): Promise<ContextThread> {
    // Business logic: ID generation, timestamps, validation
    const thread: ContextThread = {
      id: generateId(),
      title: params.title || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: params.initialMessage ? [params.initialMessage] : []
    };
    
    // Normalization and business rules
    normalizeThreadMessages(thread);
    
    // Persistence
    await this.repository.createContextThread(thread);
    return thread;
  }
}
```

### Provider Architecture

External services are wrapped in provider interfaces:

```typescript
// LLM Provider Interface
export interface ILlmService {
  generateResponse(prompt: string, options?: LlmOptions): Promise<string>;
  streamResponse(prompt: string, options?: LlmOptions): AsyncIterable<string>;
}

// Concrete Implementation
export class AnthropicService implements ILlmService {
  constructor(private apiKey: string) {}
  
  async generateResponse(prompt: string, options?: LlmOptions): Promise<string> {
    // Anthropic-specific implementation
  }
}

// Factory for provider creation
export class LlmServiceFactory {
  static create(provider: string, apiKey: string): ILlmService {
    switch (provider) {
      case 'anthropic':
        return new AnthropicService(apiKey);
      case 'openai':
        return new OpenAIService(apiKey);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}
```

## Security Architecture

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend                             │
│            HTTPS | CSP | Secure Storage                 │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Edge Tier                              │
│     JWT Validation | Rate Limiting | CORS               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                 Domain Tier                             │
│    Business Rules | Authorization | Audit Logging       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Data & External Services                   │
│    Encryption at Rest | API Key Protection | OAuth     │
└─────────────────────────────────────────────────────────┘
```

### Authentication & Authorization

**OAuth 2.0 Flow with PKCE**:
1. User initiates login with GitHub
2. Authorization code exchange with PKCE challenge
3. JWT token generation with user claims
4. Secure session establishment

**JWT Token Structure**:
```typescript
interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}
```

### API Key Management

**Encryption Architecture**:
```typescript
class EncryptionService {
  // AES-256-GCM encryption
  async encryptApiKey(plainKey: string): Promise<EncryptedData> {
    const salt = crypto.randomBytes(32);
    const key = await this.deriveKey(salt);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    // ... encryption logic
  }
}
```

**Key Lifecycle**:
1. User provides API key
2. Key validated with provider
3. Encrypted before storage
4. Decrypted only for API calls
5. Automatic rotation reminders

## Data Architecture

### Database Design

**Current Schema (SQLite)**:
```sql
-- Core conversation storage
CREATE TABLE context_threads (
  id TEXT PRIMARY KEY,
  title TEXT,
  messages TEXT,  -- JSON array
  created_at INTEGER,
  updated_at INTEGER
);

-- User management
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  github_id TEXT UNIQUE,
  created_at INTEGER
);

-- Encrypted API key storage
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  provider TEXT,
  encrypted_key TEXT,
  key_metadata TEXT,
  created_at INTEGER
);
```

### Data Flow Patterns

**Request Flow**:
```
UI → Edge API → Domain Service → Repository → Database
```

**Response Flow**:
```
Database → Repository → Domain Service → Transformer → Edge API → UI
```

**Example: Creating a Conversation**:
1. UI sends POST `/api/v1/conversations`
2. Edge tier validates request format
3. Edge transforms to domain model
4. Domain service applies business logic
5. Repository persists to database
6. Response transformed back to API format
7. Edge tier returns response to UI

## Deployment Models

### Monolithic Deployment (Default)

```
┌─────────────────────────────────────┐
│         Single Node.js Process      │
│  ┌─────────────────────────────┐   │
│  │         Express App         │   │
│  ├─────────────────────────────┤   │
│  │    Edge Routes (/api/v1)    │   │
│  ├─────────────────────────────┤   │
│  │    Domain Services          │   │
│  ├─────────────────────────────┤   │
│  │    SQLite Database          │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Characteristics**:
- Single process deployment
- Direct function calls between tiers
- SQLite for data storage
- Ideal for individual users

### Distributed Deployment (Scalable)

```
┌───────────────┐     ┌────────────────┐     ┌──────────────┐
│   UI Static   │────▶│   Edge Tier    │────▶│ Domain Tier  │
│   (CDN/S3)    │     │  (Container)   │     │ (Container)  │
└───────────────┘     └────────────────┘     └──────┬───────┘
                                                      │
                                              ┌───────▼───────┐
                                              │   PostgreSQL  │
                                              │   (Managed)   │
                                              └───────────────┘
```

**Characteristics**:
- Separate deployable units
- HTTP communication between tiers
- Managed database (PostgreSQL/MySQL)
- Horizontal scaling capability

## Error Handling Architecture

### Error Hierarchy

```typescript
LiminalError (Base)
├── ValidationError (4xx)
│   ├── InvalidInputError
│   └── MissingParameterError
├── AuthenticationError (401)
│   ├── InvalidTokenError
│   └── ExpiredTokenError
├── AuthorizationError (403)
├── NotFoundError (404)
├── ConflictError (409)
└── SystemError (5xx)
    ├── DatabaseError
    ├── ExternalServiceError
    └── ConfigurationError
```

### Error Flow

1. **Origin**: Error occurs in any tier
2. **Capture**: Try-catch blocks at service boundaries
3. **Transform**: Convert to appropriate HTTP status
4. **Log**: Structured logging with context
5. **Response**: Consistent error format to client

## Technology Stack Summary

### Core Technologies
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js
- **Language**: TypeScript 5+
- **Database**: SQLite (local), PostgreSQL (production)
- **Frontend**: React 18, Vite, Chakra UI

### Security Stack
- **Authentication**: OAuth 2.0 (GitHub), JWT
- **Encryption**: AES-256-GCM
- **Session**: Secure cookies, PKCE flow
- **Headers**: Helmet.js for security headers

### Development Tools
- **Testing**: Jest (backend), Vitest (frontend)
- **API Docs**: OpenAPI 3.0, Swagger UI
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier

## Streaming Architecture

### Design Principles

1. **Abstract Streams at Domain Level**: Domain tier provides provider-agnostic streams
2. **Orchestration at Edge Level**: Edge tier handles tool calling, multiplexing, and client optimization
3. **Standard Transport**: Server-Sent Events (SSE) for maximum compatibility

### Stream Flow Architecture

```
┌─────────────────┐
│   UI (React)    │
│  EventSource    │
└────────┬────────┘
         │ SSE
┌────────▼────────┐
│   Edge Tier     │ ← Orchestration Layer
│ • Multiplexing  │
│ • Tool Calls    │
│ • Error Recovery│
└────────┬────────┘
         │
┌────────▼────────┐
│  Domain Tier    │ ← Business Logic
│ • Pure Streams  │
│ • Provider Mgmt │
└────────┬────────┘
         │
┌────────▼────────┐
│  LLM Providers  │
│ • Anthropic     │
│ • OpenAI        │
└─────────────────┘
```

### Implementation Details

**Domain Tier Streaming**:
```typescript
interface DomainStreamChunk {
  type: 'text' | 'thinking' | 'tool_use' | 'error';
  content: string;
  metadata?: Record<string, any>;
}

// Provider-agnostic stream
async *streamCompletion(params: StreamParams): AsyncIterable<DomainStreamChunk> {
  const provider = this.getProvider(params.model);
  yield* provider.stream(params);
}
```

**Edge Tier Orchestration**:
```typescript
// Handles tool execution and stream transformation
async *streamChat(request: ChatRequest): AsyncIterable<SSEEvent> {
  const domainStream = this.domainClient.streamCompletion(request);
  
  for await (const chunk of domainStream) {
    if (chunk.type === 'tool_use') {
      // Execute tool via MCP
      const result = await this.mcpClient.execute(chunk);
      yield { event: 'tool_result', data: result };
    }
    
    yield { event: 'message', data: chunk };
  }
}
```

### Rationale for Design Decisions

1. **Why Domain Abstracts Provider Details**:
   - Keeps business logic independent of provider APIs
   - Enables easy provider switching/addition
   - Simplifies testing with mock providers

2. **Why Edge Handles Orchestration**:
   - Security boundary for tool execution
   - Client-specific optimizations possible
   - Natural place for authentication/rate limiting

3. **Why SSE Over WebSockets**:
   - Industry standard for LLM streaming (OpenAI, Anthropic)
   - Simpler implementation and debugging
   - Automatic reconnection support
   - Works through more proxies/firewalls

## MCP (Model Control Protocol) Integration

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Edge Tier                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ MCP Client  │  │ Tool Registry │  │ Auth Mgr  │ │
│  └──────┬──────┘  └──────────────┘  └───────────┘ │
└─────────┼───────────────────────────────────────────┘
          │ JSON-RPC
┌─────────▼───────────────────────────────────────────┐
│              MCP Servers (Isolated Processes)       │
├─────────────────┬─────────────────┬─────────────────┤
│  File System    │  Web Search     │  Custom Tools   │
│  MCP Server     │  MCP Server     │  MCP Server     │
└─────────────────┴─────────────────┴─────────────────┘
```

### Design Decisions

1. **MCP Client in Edge Tier**:
   - **Rationale**: Natural orchestration point between UI requests and tool execution
   - **Security**: Edge tier already handles auth/authorization
   - **Flexibility**: Can route to different MCP servers based on request

2. **Process Isolation for MCP Servers**:
   - **Rationale**: Security boundary prevents tool exploits from affecting main app
   - **Standards**: Follows MCP specification for process isolation
   - **Scalability**: Can distribute MCP servers across machines

3. **Tool Registry Pattern**:
   - **Rationale**: Dynamic tool discovery and registration
   - **Extensibility**: Easy to add new tools without code changes
   - **Security**: Centralized permission management

### Implementation Strategy

**Phase 1 - Basic MCP Support**:
```typescript
// Edge tier MCP client
class MCPClient {
  private servers: Map<string, MCPServerConnection>;
  
  async executeToolUse(tool: ToolUse): Promise<ToolResult> {
    const server = this.servers.get(tool.namespace);
    if (!server) throw new Error(`Unknown tool: ${tool.name}`);
    
    // Execute with timeout and error handling
    return await server.execute(tool.name, tool.args);
  }
}
```

**Phase 2 - Streaming Tool Results**:
```typescript
// Stream tool execution progress
async *executeStreamingTool(tool: ToolUse): AsyncIterable<ToolEvent> {
  yield { type: 'start', tool: tool.name };
  
  try {
    const result = await this.execute(tool);
    yield { type: 'result', data: result };
  } catch (error) {
    yield { type: 'error', error: error.message };
  }
  
  yield { type: 'complete' };
}
```

### Security Considerations

1. **Authentication**: Each MCP server has its own auth tokens
2. **Authorization**: Edge tier validates tool permissions per user
3. **Audit Logging**: All tool executions logged in Domain tier
4. **Resource Limits**: Timeouts and memory limits per tool execution

## AI Roundtable Architecture

### Stream Multiplexing Design

```typescript
interface RoundtableStream {
  panelistId: string;
  panelistName: string;
  model: string;
  stream: AsyncIterable<DomainStreamChunk>;
}

// Edge tier multiplexes multiple streams
async *streamRoundtable(
  panelists: Panelist[], 
  message: string
): AsyncIterable<RoundtableEvent> {
  // Create streams for all panelists
  const streams = await Promise.all(
    panelists.map(async p => ({
      panelistId: p.id,
      panelistName: p.name,
      model: p.model,
      stream: this.domainClient.streamWithContext({
        model: p.model,
        systemPrompt: p.prompt,
        message
      })
    }))
  );
  
  // Multiplex streams with fair scheduling
  yield* fairMergeAsyncIterables(streams);
}
```

### State Management

**Edge Tier Session State**:
- Active panelists and their configurations
- Message routing rules (@mentions)
- Tool execution context per panelist
- Conversation flow state

**Domain Tier Persistent State**:
- Conversation history with panelist attribution
- Panelist configurations and prompts
- Tool execution audit logs

### Rationale

1. **Why Multiplex at Edge**:
   - Natural orchestration point
   - Can implement different merging strategies
   - Client doesn't need to manage multiple connections

2. **Why Session State at Edge**:
   - Temporary routing rules don't need persistence
   - Fast access for real-time decisions
   - Can be reconstructed from Domain if needed

## Deployment Considerations

### Platform as a Service

Given Liminal Type Chat is becoming a platform (with Liminal-flow and other extensions), the architecture supports:

1. **Plugin Architecture**:
   - Edge tier can route to extension-specific endpoints
   - Domain services can be extended with new capabilities
   - MCP servers can be added for specialized tools

2. **Multi-Application Support**:
   ```
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ Chat UI  │ │ Flow UI  │ │Custom UI │
   └────┬─────┘ └────┬─────┘ └────┬─────┘
        │            │            │
   ┌────▼────────────▼────────────▼─────┐
   │        Shared Edge Tier            │
   │   /api/v1/chat  /api/v1/flow      │
   └──────────────┬───────────────────┘
                  │
   ┌──────────────▼───────────────────┐
   │      Shared Domain Services       │
   │  Users │ LLM │ Storage │ Tools   │
   └──────────────────────────────────┘
   ```

3. **Extension Points**:
   - Custom MCP servers for domain-specific tools
   - Domain service plugins for new capabilities
   - Edge tier routes for specialized APIs