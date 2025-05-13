# Milestone 0008: LLM Integration, Authentication & Basic Chat

## Objective

Implement secure authentication, LLM service integration with API key management, and basic chat functionality including streaming responses. This milestone bridges the foundational architectural work done in previous milestones with the user-facing chat experience.

## Scope

1. **Authentication & Authorization Framework**
   - Implement OAuth 2.0 integration with standard providers (Google, GitHub)
   - Create JWT-based authentication middleware
   - Implement secure API key storage and management
   - Design multi-tier security context model (Edge and Domain)
   - Add security headers and protection middleware

2. **LLM Service Integration**
   - Design and implement `LlmService` interface and provider pattern
   - Create OpenAI integration with streaming support
   - Implement API key management for LLM providers
   - Add token counting and usage tracking utilities
   - Implement context management helpers

3. **Chat API Endpoints**
   - Create chat-specific endpoints in both Domain and Edge tiers
   - Implement streaming response handling
   - Add request validation with prompt safeguards
   - Create appropriate error handling for LLM-specific issues

4. **Testing & Documentation**
   - Implement comprehensive test suites for all new components
   - Create end-to-end tests for authentication flow
   - Document security architecture and authentication flow
   - Update API documentation with new endpoints

## Plan

*(Following Test-Driven Development with Regular Linting)*

### 1. Authentication & Authorization Framework

1.1. **User Entity and Repository**
   - 1.1.1. **Write Tests**: Create tests for User entity and repository
   - 1.1.2. **Implement**: Design User schema and implement UserRepository
   - 1.1.3. **Test & Fix**: Run tests and address any issues
   - 1.1.4. **Lint**: Run linter and fix any issues

1.2. **OAuth Provider Integration**
   - 1.2.1. **Write Tests**: Create tests for OAuth provider integrations
   - 1.2.2. **Implement**: Create OAuth middleware for Google and GitHub
   - 1.2.3. **Test & Fix**: Run tests and address any issues
   - 1.2.4. **Lint**: Run linter and fix any issues

1.3. **JWT Authentication Framework**
   - 1.3.1. **Write Tests**: Create tests for JWT generation, validation, and middleware
   - 1.3.2. **Implement**: Create JWT service, middleware, and refresh token mechanisms
   - 1.3.3. **Test & Fix**: Run tests and address any issues
   - 1.3.4. **Lint**: Run linter and fix any issues

1.4. **Auth Service Layer**
   - 1.4.1. **Write Tests**: Create tests for AuthService
   - 1.4.2. **Implement**: Create AuthService with login, refresh, and validation
   - 1.4.3. **Test & Fix**: Run tests and address any issues
   - 1.4.4. **Lint**: Run linter and fix any issues

1.5. **Auth API Routes**
   - 1.5.1. **Write Tests**: Create integration tests for authentication endpoints
   - 1.5.2. **Implement**: Create login, callback, refresh, and logout routes
   - 1.5.3. **Test & Fix**: Run tests and address any issues
   - 1.5.4. **Lint**: Run linter and fix any issues

1.6. **Security Middleware**
   - 1.6.1. **Write Tests**: Create tests for security middleware
   - 1.6.2. **Implement**: Add helmet, rate limiting, and CORS configuration
   - 1.6.3. **Test & Fix**: Run tests and address any issues
   - 1.6.4. **Lint**: Run linter and fix any issues

### 2. LLM Service Integration

2.1. **API Key Management**
   - 2.1.1. **Write Tests**: Create tests for API key storage and encryption
   - 2.1.2. **Implement**: Create API key repository with encryption
   - 2.1.3. **Test & Fix**: Run tests and address any issues
   - 2.1.4. **Lint**: Run linter and fix any issues

2.2. **LLM Service Interface**
   - 2.2.1. **Write Tests**: Create tests for LLM service interfaces
   - 2.2.2. **Implement**: Design interface, abstract base class, and factory
   - 2.2.3. **Test & Fix**: Run tests and address any issues
   - 2.2.4. **Lint**: Run linter and fix any issues

2.3. **OpenAI Provider Implementation**
   - 2.3.1. **Write Tests**: Create tests for OpenAI provider
   - 2.3.2. **Implement**: Create OpenAI implementation with streaming
   - 2.3.3. **Test & Fix**: Run tests and address any issues
   - 2.3.4. **Lint**: Run linter and fix any issues

2.4. **Token Counting and Usage Tracking**
   - 2.4.1. **Write Tests**: Create tests for token counting utilities
   - 2.4.2. **Implement**: Add token counting and usage tracking
   - 2.4.3. **Test & Fix**: Run tests and address any issues
   - 2.4.4. **Lint**: Run linter and fix any issues

2.5. **Context Management Utilities**
   - 2.5.1. **Write Tests**: Create tests for context management
   - 2.5.2. **Implement**: Add utilities for context window management
   - 2.5.3. **Test & Fix**: Run tests and address any issues
   - 2.5.4. **Lint**: Run linter and fix any issues

### 3. Chat API Endpoints

3.1. **Chat Message Model Extensions**
   - 3.1.1. **Write Tests**: Create tests for extended message model
   - 3.1.2. **Implement**: Extend Message model for LLM specifics
   - 3.1.3. **Test & Fix**: Run tests and address any issues
   - 3.1.4. **Lint**: Run linter and fix any issues

3.2. **Domain Chat Service**
   - 3.2.1. **Write Tests**: Create tests for ChatService
   - 3.2.2. **Implement**: Create ChatService with prompt processing
   - 3.2.3. **Test & Fix**: Run tests and address any issues
   - 3.2.4. **Lint**: Run linter and fix any issues

3.3. **Domain Chat API Routes**
   - 3.3.1. **Write Tests**: Create tests for domain chat endpoints
   - 3.3.2. **Implement**: Create domain routes for chat operations
   - 3.3.3. **Test & Fix**: Run tests and address any issues
   - 3.3.4. **Lint**: Run linter and fix any issues

3.4. **Edge Chat API Routes**
   - 3.4.1. **Write Tests**: Create tests for edge chat endpoints
   - 3.4.2. **Implement**: Create edge routes for chat operations
   - 3.4.3. **Test & Fix**: Run tests and address any issues
   - 3.4.4. **Lint**: Run linter and fix any issues

3.5. **Streaming Response Handling**
   - 3.5.1. **Write Tests**: Create tests for streaming response
   - 3.5.2. **Implement**: Add streaming support in API routes
   - 3.5.3. **Test & Fix**: Run tests and address any issues
   - 3.5.4. **Lint**: Run linter and fix any issues

### 4. Testing & Documentation

4.1. **End-to-End Testing**
   - 4.1.1. **Write Tests**: Create E2E tests for authentication and chat
   - 4.1.2. **Implement**: Configure E2E testing environment
   - 4.1.3. **Test & Fix**: Run tests and address any issues
   - 4.1.4. **Lint**: Run linter and fix any issues

4.2. **Security Documentation**
   - 4.2.1. **Implement**: Create security architecture documentation
   - 4.2.2. **Review**: Peer review security documentation
   - 4.2.3. **Fix**: Address feedback from review

4.3. **API Documentation**
   - 4.3.1. **Implement**: Update OpenAPI specifications
   - 4.3.2. **Test & Fix**: Validate OpenAPI specs and fix issues
   - 4.3.3. **Implement**: Add examples to Swagger UI

4.4. **Final Verification**
   - 4.4.1. **Complete Test Suite**: Add any missing test cases
   - 4.4.2. **Final Lint**: Run linter across all new and modified files
   - 4.4.3. **Documentation**: Update documentation and examples

## Design

### Authentication & Authorization Architecture

#### OAuth 2.0 Flow

1. **Authentication Flow**
   - User initiates login via UI, selecting a provider (Google, GitHub)
   - Edge tier redirects to provider authorization URL
   - After successful authentication, provider redirects back with auth code
   - Server exchanges code for tokens, creates/updates user record
   - Server generates JWT and refresh token, returns to client
   - Client stores JWT and uses it for all subsequent API calls

2. **Token Management**
   - **Access Token**: Short-lived JWT (15-30 minutes) with user identity and permissions
   - **Refresh Token**: Longer-lived token (7 days) for obtaining new access tokens
   - **Token Rotation**: Each refresh generates new refresh token, invalidating old one
   - **Revocation**: Admin-triggered or security-event based token revocation

#### JWT Structure and Validation

```typescript
// JWT Payload Structure
interface JwtPayload {
  sub: string;         // User ID
  email: string;       // User email
  name: string;        // User display name
  scopes: string[];    // Permission scopes
  tier: 'edge' | 'domain'; // Access tier - for distinguishing context
  iat: number;         // Issued at timestamp
  exp: number;         // Expiration timestamp
  jti: string;         // JWT ID for revocation tracking
}

// JWT Middleware
export function authMiddleware(requiredScopes: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extract JWT from Authorization header
    const token = extractTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ 
        error: { 
          code: AUTH_ERROR_CODES.MISSING_TOKEN,
          message: 'Authentication required' 
        } 
      });
    }

    try {
      // Verify JWT signature and expiration
      const payload = verifyJwt(token);
      
      // Check for required scopes
      if (requiredScopes.length > 0 && 
          !requiredScopes.every(scope => payload.scopes.includes(scope))) {
        return res.status(403).json({ 
          error: { 
            code: AUTH_ERROR_CODES.INSUFFICIENT_SCOPES,
            message: 'Insufficient permissions' 
          } 
        });
      }
      
      // Attach user info to request
      req.user = mapJwtToUser(payload);
      next();
    } catch (error) {
      // Handle different JWT errors
      const errorResponse = mapJwtErrorToResponse(error);
      return res.status(errorResponse.status).json({ error: errorResponse.body });
    }
  };
}
```

#### Multi-Tier Security Context

The application will support different security contexts for the Edge and Domain tiers:

1. **Edge Tier Security Context**
   - End-user focused authentication
   - OAuth provider integration
   - UI-optimized permissions model
   - Role-based access control for UI features

2. **Domain Tier Security Context**
   - Service-to-service authentication
   - API key or JWT based authentication
   - Fine-grained permission model
   - Resource-based access control 

3. **Context Passing Mechanism**
   ```typescript
   // When Edge tier needs to call Domain tier:
   function getDomainSecurityContext(edgeContext: SecurityContext): DomainSecurityContext {
     // If using direct client, pass through the security context
     if (config.domainClientMode === 'direct') {
       return mapEdgeToDomainContext(edgeContext);
     }
     
     // If using HTTP client, generate a short-lived service token
     return {
       token: generateServiceToken(edgeContext),
       userId: edgeContext.userId,
       scopes: mapEdgeScopes(edgeContext.scopes)
     };
   }
   ```

#### User Data Model

```typescript
interface User {
  id: string;                // UUID
  email: string;             // Primary email
  displayName: string;       // User's display name
  createdAt: number;         // Timestamp of account creation
  updatedAt: number;         // Timestamp of last update
  authProviders: {           // Linked OAuth providers
    google?: {
      providerId: string;    // Provider's user ID
      email: string;         // Email from provider
      refreshToken?: string; // Optional refresh token
    };
    github?: {
      providerId: string;    // Provider's user ID
      username: string;      // GitHub username
      refreshToken?: string; // Optional refresh token
    };
  };
  apiKeys: {                 // LLM API keys (encrypted)
    openai?: {
      key: string;           // Encrypted API key
      label?: string;        // User-provided label
      createdAt: number;     // When key was added
    };
    anthropic?: {
      key: string;           // Encrypted API key
      label?: string;        // User-provided label
      createdAt: number;     // When key was added
    };
  };
  preferences?: {            // User preferences
    defaultModel?: string;   // Default LLM model
    theme?: 'light' | 'dark' | 'system';
    // Other UI preferences
  };
}
```

### LLM Service Architecture

#### Provider Pattern for Multiple LLMs

```typescript
// Base LLM Service Interface
interface LlmService {
  // Core methods
  generateCompletion(params: CompletionParams): Promise<CompletionResponse>;
  generateCompletionStream(params: CompletionParams): AsyncIterable<CompletionChunk>;
  
  // Utility methods
  countTokens(text: string, model?: string): number;
  getModels(): Model[];
  validateApiKey(apiKey: string): Promise<boolean>;
}

// OpenAI Implementation
class OpenAiService implements LlmService {
  constructor(private apiKey: string, private options: OpenAiOptions = {}) {}
  
  async generateCompletion(params: CompletionParams): Promise<CompletionResponse> {
    // Implementation using OpenAI SDK
  }
  
  async *generateCompletionStream(params: CompletionParams): AsyncIterable<CompletionChunk> {
    // Implementation using OpenAI SDK's streaming capability
  }
  
  // Other methods
}

// Factory for creating provider instances
class LlmServiceFactory {
  static createService(provider: 'openai' | 'anthropic', apiKey: string, options?: any): LlmService {
    switch (provider) {
      case 'openai':
        return new OpenAiService(apiKey, options);
      case 'anthropic':
        return new AnthropicService(apiKey, options);
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
}
```

#### API Key Management with Encryption

```typescript
// API Key Management Service
class ApiKeyManager {
  constructor(private encryptionService: EncryptionService) {}
  
  // Store encrypted API key
  async storeApiKey(userId: string, provider: string, key: string): Promise<void> {
    const encryptedKey = await this.encryptionService.encrypt(key);
    await userRepository.storeApiKey(userId, provider, encryptedKey);
  }
  
  // Retrieve and decrypt API key
  async getApiKey(userId: string, provider: string): Promise<string> {
    const encryptedKey = await userRepository.getApiKey(userId, provider);
    if (!encryptedKey) {
      throw new Error(`No API key found for ${provider}`);
    }
    return this.encryptionService.decrypt(encryptedKey);
  }
}

// Encryption Service (using Node.js crypto)
class EncryptionService {
  constructor(private encryptionKey: Buffer) {}
  
  // Encrypt string data
  async encrypt(data: string): Promise<string> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }
  
  // Decrypt string data
  async decrypt(encryptedData: string): Promise<string> {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

#### Token Counting and Context Management

```typescript
// Token counting utility
function countTokens(text: string, model: string): number {
  // Implementation using appropriate tokenizer for the model
  // (e.g., GPT-4 uses cl100k_base tokenizer)
}

// Context window management
class ContextWindowManager {
  constructor(
    private maxTokens: number,
    private reservedTokens: number = 1000 // Reserve tokens for response
  ) {}
  
  // Fit messages into context window
  fitMessagesToContextWindow(messages: Message[], model: string): Message[] {
    let totalTokens = 0;
    const result: Message[] = [];
    
    // Always include system message if present
    const systemMessage = messages.find(m => m.role === 'system');
    if (systemMessage) {
      const systemTokens = countTokens(JSON.stringify(systemMessage), model);
      totalTokens += systemTokens;
      result.push(systemMessage);
    }
    
    // Add most recent messages first until we approach the limit
    const nonSystemMessages = messages
      .filter(m => m.role !== 'system')
      .sort((a, b) => b.createdAt - a.createdAt);
    
    for (const message of nonSystemMessages) {
      const messageTokens = countTokens(JSON.stringify(message), model);
      if (totalTokens + messageTokens + this.reservedTokens <= this.maxTokens) {
        totalTokens += messageTokens;
        result.push(message);
      } else {
        break;
      }
    }
    
    // Sort messages by timestamp before returning
    return result.sort((a, b) => a.createdAt - b.createdAt);
  }
}
```

### Chat API Design

#### Extended Message Model for LLM Features

```typescript
// Extending the Message interface
interface ExtendedMessage extends Message {
  // Standard fields from base Message interface
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  
  // LLM-specific extensions
  model?: string;           // LLM model used (if assistant message)
  provider?: string;        // LLM provider (if assistant message)
  tokenCount?: {            // Token usage tracking
    prompt?: number;        // Tokens in the prompt
    completion?: number;    // Tokens in the completion
    total?: number;         // Total tokens used
  };
  status: 'complete' | 'streaming' | 'error' | 'interrupted';
  metadata?: {
    // Additional LLM-specific metadata
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
    // Other model parameters
    error?: {               // If status is 'error'
      code: string;
      message: string;
      details?: any;
    };
  };
}
```

#### Chat Service

```typescript
// Domain Chat Service
class ChatService {
  constructor(
    private threadService: ContextThreadService,
    private llmServiceFactory: LlmServiceFactory,
    private apiKeyManager: ApiKeyManager,
    private contextWindowManager: ContextWindowManager
  ) {}
  
  // Generate a response to a user message
  async generateResponse(
    threadId: string,
    userMessage: Message,
    options: {
      provider: string;
      model: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<Message> {
    // 1. Get the thread
    const thread = await this.threadService.getContextThread(threadId);
    if (!thread) {
      throw new NotFoundException(`Thread ${threadId} not found`);
    }
    
    // 2. Add user message to thread
    await this.threadService.addMessageToContextThread(threadId, userMessage);
    
    // 3. Get user's API key for the specified provider
    const apiKey = await this.apiKeyManager.getApiKey(
      userMessage.userId,
      options.provider
    );
    
    // 4. Create LLM service instance
    const llmService = this.llmServiceFactory.createService(
      options.provider,
      apiKey,
      { model: options.model }
    );
    
    // 5. Prepare messages for context window
    const messagesForContext = this.contextWindowManager.fitMessagesToContextWindow(
      thread.messages,
      options.model
    );
    
    // 6. Create assistant message with 'streaming' status
    const assistantMessage: Message = {
      id: uuid(),
      threadId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      userId: userMessage.userId,
      model: options.model,
      provider: options.provider,
      status: 'streaming',
      metadata: {
        temperature: options.temperature,
        maxTokens: options.maxTokens
      }
    };
    
    // 7. Add initial assistant message to thread
    await this.threadService.addMessageToContextThread(threadId, assistantMessage);
    
    try {
      // 8. Generate completion
      const response = await llmService.generateCompletion({
        messages: messagesForContext,
        temperature: options.temperature,
        maxTokens: options.maxTokens
      });
      
      // 9. Update assistant message with response
      const updatedMessage: Message = {
        ...assistantMessage,
        content: response.content,
        status: 'complete',
        tokenCount: {
          prompt: response.usage.promptTokens,
          completion: response.usage.completionTokens,
          total: response.usage.totalTokens
        }
      };
      
      // 10. Update message in thread
      await this.threadService.updateMessageInContextThread(
        threadId,
        assistantMessage.id,
        updatedMessage
      );
      
      return updatedMessage;
    } catch (error) {
      // 11. Handle errors
      const errorMessage: Message = {
        ...assistantMessage,
        content: '',
        status: 'error',
        metadata: {
          ...assistantMessage.metadata,
          error: {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'Unknown error occurred',
            details: error.details
          }
        }
      };
      
      // 12. Update message with error
      await this.threadService.updateMessageInContextThread(
        threadId,
        assistantMessage.id,
        errorMessage
      );
      
      throw error;
    }
  }
  
  // Stream a response (similar flow but with streaming)
  async *generateResponseStream(
    threadId: string,
    userMessage: Message,
    options: {
      provider: string;
      model: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): AsyncIterable<MessageUpdate> {
    // Similar implementation to generateResponse but using streaming
    // and yielding updates as they arrive
  }
}
```

#### API Endpoints

**Domain Chat API**:
- `POST /domain/threads/:threadId/chat`: Start a chat completion (non-streaming)
- `POST /domain/threads/:threadId/chat/stream`: Start a streaming chat completion
- `GET /domain/models`: Get available LLM models and configurations
- `POST /domain/validate-api-key`: Validate user's API key for a provider

**Edge Chat API**:
- `POST /api/v1/conversations/:conversationId/completions`: Start a chat completion
- `POST /api/v1/conversations/:conversationId/completions/stream`: Start a streaming completion
- `GET /api/v1/models`: Get available LLM models and configurations
- `POST /api/v1/providers/:provider/validate-key`: Validate API key for a provider

#### Streaming Implementation

```typescript
// Server-side streaming with Express
router.post(
  '/conversations/:conversationId/completions/stream',
  authenticate,
  validateRequest(streamCompletionSchema),
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { message, options } = req.body;
      
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Get domain client and start stream
      const client = getContextThreadClient(req);
      const stream = client.generateChatCompletionStream(
        conversationId,
        transformMessageToDomain(message, req.user.id),
        transformOptionsToDomain(options)
      );
      
      // Send stream updates to client
      for await (const update of stream) {
        // Transform domain update to edge response format
        const edgeUpdate = transformUpdateToEdge(update);
        
        // Send as SSE
        res.write(`data: ${JSON.stringify(edgeUpdate)}\n\n`);
        
        // If client disconnects, stop the stream
        if (res.closed) break;
      }
      
      // End the response
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      // If headers haven't been sent yet, send error response
      if (!res.headersSent) {
        handleErrorResponse(error, req, res);
      } else {
        // Otherwise send error as SSE
        const errorUpdate = {
          type: 'error',
          error: {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'Unknown error'
          }
        };
        res.write(`data: ${JSON.stringify(errorUpdate)}\n\n`);
        res.end();
      }
    }
  }
);
```

### Security Considerations

1. **API Key Protection**
   - All LLM API keys stored using strong encryption (AES-256-GCM)
   - Encryption key stored in secure environment variable/secret
   - Keys never exposed in logs or error messages
   - Keys only decrypted when needed for API calls

2. **OAuth Security**
   - State parameter used to prevent CSRF attacks
   - PKCE (Proof Key for Code Exchange) for additional security
   - Redirect URIs strictly validated
   - Tokens stored securely and rotated regularly

3. **JWT Security**
   - Short expiration times (15-30 minutes) for access tokens
   - Strong signature algorithm (RS256 with 2048-bit key)
   - Critical claims validation (exp, iat, iss, aud)
   - Token revocation mechanism for security incidents

4. **HTTP Security Headers**
   - Content-Security-Policy to prevent XSS
   - Strict-Transport-Security to enforce HTTPS
   - X-Content-Type-Options to prevent MIME sniffing
   - X-Frame-Options to prevent clickjacking
   - Referrer-Policy to control referrer information

5. **Rate Limiting**
   - Tiered rate limits based on endpoint sensitivity
   - Higher limits for authenticated users
   - IP-based rate limiting for public endpoints
   - Graduated response (warning headers before blocking)

6. **Input Validation**
   - All API inputs validated against schemas
   - Content scanning for prompt injection attacks
   - Maximum size limits for all inputs
   - Type checking and sanitization

## Test Cases

### Authentication Tests

1. **OAuth Flow Tests**
   - Test successful authentication via each provider
   - Test login with new and existing users
   - Test handling of canceled authentication
   - Test state parameter validation
   - Test redirect URI validation

2. **JWT Tests**
   - Test JWT generation and validation
   - Test token expiration handling
   - Test refresh token flow
   - Test revocation mechanism
   - Test required scope validation

3. **Security Middleware Tests**
   - Test authentication middleware with valid/invalid tokens
   - Test handling of various JWT errors
   - Test protection of secured routes
   - Test rate limiting functionality
   - Test security headers

### LLM Service Tests

1. **API Key Management Tests**
   - Test API key encryption and decryption
   - Test secure storage and retrieval
   - Test validation of API keys
   - Test handling of invalid/expired keys

2. **Provider Integration Tests**
   - Test completion generation with each provider
   - Test streaming with each provider
   - Test error handling for various API errors
   - Test token counting accuracy
   - Test model parameter validation

3. **Context Management Tests**
   - Test message fitting within context window
   - Test prioritization of system and recent messages
   - Test handling of large message histories
   - Test token counting integration

### Chat API Tests

1. **Domain Chat API Tests**
   - Test non-streaming completion generation
   - Test streaming completion generation
   - Test error handling and propagation
   - Test message persistence after completion

2. **Edge Chat API Tests**
   - Test transformation between Edge and Domain formats
   - Test authorization and permission checking
   - Test error mapping from Domain to Edge format
   - Test streaming protocol compliance

## Key Design Decisions

1. **OAuth Provider Selection**: Start with Google and GitHub as the most widely used and developer-friendly OAuth providers. Both offer robust security and are commonly found in developer tools.

2. **Multi-tier Security**: Design security to support both single-process and distributed deployments with appropriate context passing.

3. **API Key Encryption**: Implement strong encryption for API keys to protect sensitive user credentials from unauthorized access.

4. **Provider-Agnostic LLM Interface**: Create a clean provider interface that abstracts away the differences between OpenAI, Anthropic, and other LLM services.

5. **Streaming First**: Design the chat API with streaming as a first-class feature, not an afterthought, to support modern chat UI expectations.

6. **Comprehensive Error Handling**: Implement detailed error management for LLM interactions, which can be complex and have many failure modes.

7. **Context Window Management**: Build utilities to intelligently manage message history within LLM context windows, prioritizing system and recent messages.

## Dependencies

This milestone will introduce several new dependencies:

- **Authentication & Security**
  - `passport`: Authentication middleware for Node.js
  - `passport-google-oauth20`: Google OAuth 2.0 strategy
  - `passport-github2`: GitHub OAuth 2.0 strategy
  - `jsonwebtoken`: JWT implementation
  - `helmet`: Security headers middleware
  - `express-rate-limit`: Rate limiting middleware
  - `cors`: CORS middleware

- **LLM Integration**
  - `openai`: Official OpenAI SDK
  - `@anthropic-ai/sdk`: Official Anthropic SDK
  - `tiktoken`: OpenAI tokenizer for token counting
  - `eventsource-parser`: For parsing streaming events

- **Encryption**
  - Core Node.js `crypto` module will be used for encryption

- **Testing**
  - `nock`: HTTP request mocking
  - `supertest`: HTTP testing utility
  - `jest`: Test runner and assertion library

## Success Criteria

1. **Authentication**
   - Users can successfully authenticate via OAuth providers
   - JWTs are properly issued, validated, and refreshed
   - Protected routes are accessible only to authenticated users
   - Security headers and protections are properly implemented

2. **LLM Integration**
   - Users can securely store and manage API keys
   - Chat completions work correctly with OpenAI
   - Streaming responses work end-to-end
   - Token counting and context management function as expected

3. **API Usability**
   - All new endpoints are documented in OpenAPI specs
   - Error handling provides useful feedback
   - Response formats are consistent and well-structured

4. **Test Coverage**
   - >90% code coverage for all new components
   - All key flows have integration tests
   - Security features have dedicated tests

5. **Documentation**
   - Authentication flow is well-documented
   - Security architecture is documented
   - API documentation is updated
   - Code includes proper JSDoc comments