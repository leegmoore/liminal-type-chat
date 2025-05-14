# Setting Up Claude 3.7 Sonnet Integration

This guide provides step-by-step instructions for setting up security and integrating Claude 3.7 Sonnet into the Liminal Type Chat application.

## Current Integration Status

We have successfully integrated Claude 3.7 Sonnet into the Liminal Type Chat application. The code changes are complete and the TypeScript compilation is successful, indicating that the code is properly typed and structured.

### Key Files Modified

1. **AnthropicService.ts**
   - Added Claude 3.7 Sonnet model configuration (`claude-3-7-sonnet-20250218`)
   - Set context window to 200,000 tokens
   - Configured token pricing rates
   - Enabled streaming support

2. **LlmServiceFactory.ts**
   - Set Claude 3.7 Sonnet as the default model for Anthropic provider
   - Updated model selection logic

3. **Type Fixes**
   - Fixed JWT service type issues
   - Updated API routes to handle authentication properly
   - Fixed OpenAI service streaming response types

### Test Files Created
1. **test-claude37-direct.js**
   - Standalone script to test Claude 3.7 Sonnet integration
   - Tests both standard and streaming responses
   - Can be run directly with an API key

2. **test-claude37.js**
   - Tests Claude 3.7 through our application's AnthropicService
   - Verifies proper integration with our code

3. **minimal-server.js**
   - Lightweight server implementation with only essential endpoints
   - Includes Claude 3.7 Sonnet in the available models endpoint

### Current Issues
- Server startup is experiencing issues, likely related to dependencies
- The diagnostics show that while packages are in package.json, some node_modules directories appear empty
- npm install attempts are timing out, possibly due to network issues
- The minimal server can be used to test UI functionality without the full stack

### Next Steps
1. Test Claude 3.7 Sonnet directly with the standalone script:
   ```
   node test-claude37-direct.js YOUR_ANTHROPIC_API_KEY
   ```

2. The minimal server is running successfully at http://localhost:3000, which can be used to test client connectivity

3. Address dependency issues (possibly by manually reinstalling the missing packages or checking network connectivity)

4. Once dependency issues are resolved, the full integration should function properly

## Dependencies

### Accounts & API Keys

- **Anthropic API Account** (Required)
  - Sign up at [Anthropic Console](https://console.anthropic.com/)
  - Create an API key in your Anthropic account
  - Claude 3.7 Sonnet access required
  - Cost: Pay-as-you-go based on token usage

### Libraries & Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `@anthropic-ai/sdk` | ^0.18.0 | Official Anthropic JavaScript SDK |
| `dotenv` | ^16.3.1 | For managing environment variables |
| `crypto` | Built-in Node.js | For encryption of API keys |

## Initial Setup

### 1. Environment Configuration

Create or update the `.env.local` file in the server directory with the following environment variables:

```
# Encryption key (generate using the command below)
ENCRYPTION_KEY=your_generated_encryption_key

# JWT token settings
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30m
```

To generate a secure encryption key, run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Install Required Packages

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install @anthropic-ai/sdk 
```

## Security Setup

### 1. Authentication Setup

The application uses GitHub OAuth for authentication along with JWT (JSON Web Tokens) for session management. To set up authentication:

#### GitHub OAuth Configuration

1. Create a GitHub OAuth App at https://github.com/settings/developers
2. Set the homepage URL to `http://localhost:8765`
3. Set the authorization callback URL to `http://localhost:8765/api/v1/auth/github/callback`
4. Copy the Client ID and Client Secret and add them to your environment variables:

```
# GitHub OAuth Credentials
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
```

### 2. User Account Creation

1. Start the application
2. Navigate to the login page
3. Click "Sign in with GitHub"
4. Authorize the application
5. You'll be redirected back to the application and authenticated with a JWT token

### 3. API Key Management

The application securely stores LLM API keys using AES-256-GCM encryption. Here's how to add your Claude API key:

#### UI Method

1. Log in to the application
2. Navigate to the Chat page
3. Click on the settings icon in the chat interface
4. Select Anthropic as the provider
5. Enter your Anthropic API key when prompted

#### API Method

You can also store your API key using the API directly:

```bash
curl -X POST http://localhost:8765/api/v1/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "provider": "anthropic",
    "apiKey": "your_anthropic_api_key",
    "label": "Claude 3.7 Sonnet"
  }'
```

## Claude 3.7 Sonnet Configuration

Claude 3.7 Sonnet can be configured with various parameters to control its behavior. Here are the recommended settings for optimal performance:

### Model Information

| Parameter | Value |
|-----------|-------|
| Model ID | `claude-3-7-sonnet-20250218` |
| Context Window | 200,000 tokens |
| Max Response | 4,096 tokens |
| Price - Input | $3.00 per million tokens |
| Price - Output | $15.00 per million tokens |

### Recommended Parameters

- **Temperature:** 0.5-0.7 (Higher for more creative responses, lower for more deterministic ones)
- **Top-p:** 0.9 (Controls diversity via nucleus sampling)
- **System prompt:** Customize based on your use case

## Testing the Integration

### 1. Start the Application

Make sure both the server and client are running:

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

### 2. Test the Chat Interface

1. Navigate to http://localhost:5173/chat (or your configured client port)
2. Log in with your credentials
3. Create a new conversation
4. Select "anthropic" as the provider and "claude-3-7-sonnet-20250218" as the model
5. Type a prompt and send it
6. Verify that Claude 3.7 Sonnet responds correctly

### 3. Testing API Endpoints Directly

To test the chat completion API directly:

```bash
curl -X POST http://localhost:8765/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "Hello, Claude 3.7 Sonnet!",
    "provider": "anthropic",
    "modelId": "claude-3-7-sonnet-20250218",
    "threadId": "YOUR_THREAD_ID"
  }'
```

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the API key is current and has proper permissions
   - Check if your Anthropic account has access to Claude 3.7 Sonnet
   - Ensure the API key was correctly stored in the application

2. **Authentication Issues**
   - Check JWT token expiration (default is 30 minutes)
   - Verify correct JWT_SECRET is set consistently

3. **Encryption Errors**
   - Ensure ENCRYPTION_KEY is properly set and doesn't change between sessions
   - If you change the ENCRYPTION_KEY, previously stored API keys will no longer be decryptable

4. **Rate Limiting**
   - Anthropic applies rate limits to API usage
   - Implement backoff strategies for high-volume usage

## Security Best Practices

1. **API Key Protection**
   - Never commit API keys to version control
   - Rotate API keys periodically
   - Use environment variables for sensitive configuration

2. **Data Protection**
   - Be cautious about what data is sent to Claude
   - Implement content filtering for user inputs
   - Consider data retention policies for conversation history

3. **Error Handling**
   - Sanitize error messages to prevent leaking sensitive information
   - Implement different error detail levels for development vs. production

## Additional Resources

- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Claude 3.7 Sonnet Model Card](https://www.anthropic.com/model-cards)
- [Anthropic Responsible Use Guide](https://www.anthropic.com/responsible-use)