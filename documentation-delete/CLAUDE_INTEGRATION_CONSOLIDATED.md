# Claude 3.7 Integration Documentation

This document consolidates the key information about the Claude 3.7 Sonnet integration with Liminal Type Chat.

## Model Specifications

- **Model ID**: `claude-3-7-sonnet-20250219`
- **Context Window**: 200,000 tokens
- **Max Response Tokens**: 4,096
- **Pricing**:
  - Input: $3.00 per million tokens
  - Output: $15.00 per million output tokens
- **Recommended Settings**:
  - Temperature: 0.7
  - Top-p: 0.9

## Implementation Status

The Claude 3.7 Sonnet integration is fully functional with the following features:

- Streaming responses properly implemented and rendered
- Thread-based message filtering prevents context bleeding
- Message content properly formatted when sent to the Anthropic API
- Special UI styling for Claude responses (purple theme, model badges)
- Enhanced API key management with UI status indicators

## Core Components

1. **Server-side Integration**:
   - `AnthropicService.ts`: Core implementation with model configuration
   - `ChatService.ts`: Handles streaming and general chat functionality
   - `LlmApiKeyManager.ts`: Manages API key validation and secure storage

2. **Client-side Integration**:
   - `ChatPage.tsx`: Main chat interface with streaming support
   - Implements a consistent message identification system
   - Uses EventSource to handle streaming responses

## Authentication & Security Implementation

- **Authentication**: GitHub OAuth for user authentication
- **Session Management**: JWT tokens for maintaining authenticated sessions
- **API Key Security**: AES-256-GCM encryption for storing API keys
- **Environment Variables**: Sensitive information stored in `.env` file (not in git)
- **Development Bypass**: Authentication bypass middleware for development environment
  ```typescript
  // DEVELOPMENT ONLY - Allow unauthenticated requests for testing
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    // Add minimal user information for testing
    (req as AuthenticatedRequest).user = {
      userId: 'dev-user-123',
      // ...other user properties
    };
    return next();
  }
  ```

## JWT Type Fixes

The integration required fixing JWT expiration type mismatches:

```typescript
// Normalize expiresIn to ensure it's properly formatted for jwt.sign
// This handles both string (e.g., '30m') and number (e.g., 1800) formats
if (typeof expiresIn === 'number') {
  expiresIn = `${expiresIn}s`; // Convert to seconds string format
}
```

## Testing Options

Multiple testing options are available:

1. **Full Application Testing**:
   ```
   # Start the server
   cd server
   npm run dev
   
   # In a separate terminal, start the client
   cd client
   npm run dev
   ```

2. **Direct API Testing**:
   - The server exposes REST endpoints for testing at `/api/v1/conversations`
   - Example cURL command:
     ```
     curl -X POST http://localhost:3001/api/v1/conversations \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer <your-jwt-token>" \
       -d '{"messages":[{"role":"user","content":"Hello, Claude!"}],"provider":"anthropic","modelId":"claude-3-7-sonnet-20250219"}'
     ```

3. **Environment Setup**:
   - Create a development `.env.local` file with:
     ```
     NODE_ENV=development
     BYPASS_AUTH=true
     JWT_SECRET=dev-jwt-secret-for-testing
     ENCRYPTION_KEY=dev-encryption-key-32-chars-long12
     DB_PATH=./db/liminal.db
     PORT=3001
     ```

## Client-Side Authentication Enhancements

The client implementation includes automatic guest authentication:

- Modified `authService.ts` to handle development mode with mock tokens
- Enhanced guest login implementation that falls back to registration if needed
- Updated ChatPage component to check authentication on load and auto-login as guest

## Troubleshooting Guide

### API Key Issues

- Ensure API key is correctly set in .env file or provided via UI
- Check for API key validation errors in server logs
- Verify encryption/decryption process for stored API keys

### Streaming Response Issues

- Check if EventSource is properly initialized and managed
- Verify message identification system is working correctly
- Check browser console for connection errors

### Authentication Problems

- Ensure GitHub OAuth credentials are correctly configured
- Check JWT token validation and expiration
- Verify correct headers are being sent with API requests

### Rate Limiting

- Claude API has rate limits - check for 429 status codes
- Implement exponential backoff for retries
- Consider implementing request throttling for high-traffic scenarios

### Network & SSL Issues

If you encounter network-related issues:
- Check system SSL certificates
- Verify proxy settings
- Try using a VPN or different network connection
- For package installation problems, try using alternative npm registries

## Future Improvements

1. **Code Quality**:
   - Replace remaining `any` types with proper TypeScript types
   - Implement structured logging with log levels
   - Standardize method names and parameter structures

2. **UI Enhancements**:
   - Replace timestamp-based forced re-rendering with proper React state management
   - Fix EventSource management with proper React lifecycle hooks
   - Improve error message display for better user experience

3. **Backend Improvements**:
   - Implement proper API key validation for all providers in LlmServiceFactory
   - Fix the provider selection override in LlmServiceFactory.createService
   - Remove HTTP cache-busting in favor of proper HTTP headers

## Reference

### Key Implementation Files

- `server/src/providers/llm/anthropic/AnthropicService.ts`
- `server/src/providers/llm/LlmServiceFactory.ts`
- `server/src/services/core/ChatService.ts`
- `client/src/pages/ChatPage.tsx`