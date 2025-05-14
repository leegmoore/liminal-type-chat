/**
 * Super minimal HTTP server that doesn't require any external dependencies
 * For testing when Express and other dependencies are not available
 */

const http = require('http');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Set CORS headers to allow requests from the client
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Basic routing
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  // Parse request body (for POST requests)
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    let responseData = {};
    
    // Simple API routes
    if (path === '/api/v1/edge/health') {
      // Health check endpoint
      responseData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: 'development',
        services: {
          api: 'ok'
        }
      };
    } else if (path.startsWith('/api/v1/api-keys/')) {
      // API key status
      const provider = path.split('/').pop();
      responseData = {
        provider,
        hasKey: true,
        label: 'Mock API Key',
        createdAt: new Date().toISOString()
      };
    } else if (path.startsWith('/api/v1/chat/models/')) {
      // Models endpoint
      const provider = path.split('/').pop();
      
      if (provider === 'anthropic') {
        responseData = {
          models: [
            {
              id: 'claude-3-7-sonnet-20250218',
              name: 'Claude 3.7 Sonnet',
              provider: 'anthropic',
              maxTokens: 4096,
              contextWindow: 200000,
              supportsStreaming: true
            },
            {
              id: 'claude-3-opus-20240229',
              name: 'Claude 3 Opus',
              provider: 'anthropic',
              maxTokens: 4096,
              contextWindow: 200000,
              supportsStreaming: true
            }
          ]
        };
      } else {
        responseData = {
          models: [
            {
              id: 'gpt-4',
              name: 'GPT-4',
              provider: 'openai',
              maxTokens: 4096,
              contextWindow: 8192,
              supportsStreaming: true
            }
          ]
        };
      }
    } else if (path === '/api/v1/conversations') {
      // Conversations endpoint
      if (req.method === 'GET') {
        responseData = {
          conversations: [
            {
              id: 'mock-convo-1',
              title: 'Mock Conversation 1',
              createdAt: Date.now() - 3600000,
              updatedAt: Date.now() - 1800000,
              messages: []
            }
          ]
        };
      } else if (req.method === 'POST') {
        // Create new conversation
        try {
          const data = JSON.parse(body);
          responseData = {
            id: 'mock-convo-' + Date.now(),
            title: data.title || 'New Conversation',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: []
          };
        } catch (error) {
          responseData = { error: 'Invalid JSON' };
          res.statusCode = 400;
        }
      }
    } else if (path === '/api/v1/auth/guest-login') {
      // Guest login endpoint
      responseData = {
        token: 'mock.jwt.token.for.development',
        user: {
          id: 'guest-user',
          name: 'Guest User',
          email: 'guest@example.com'
        }
      };
    } else {
      // Default 404 response
      responseData = { error: 'Not found' };
      res.statusCode = 404;
    }
    
    // Send response
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(res.statusCode || 200);
    res.end(JSON.stringify(responseData, null, 2));
  });
});

// Start server
const PORT = 8765;
server.listen(PORT, () => {
  console.log(`
┌──────────────────────────────────────────────────┐
│                                                  │
│   Super Minimal Server Started                   │
│                                                  │
│   URL: http://localhost:${PORT}                    │
│                                                  │
│   API Endpoints:                                 │
│    - Health: /api/v1/edge/health                 │
│    - Models: /api/v1/chat/models/:provider       │
│    - API Keys: /api/v1/api-keys/:provider        │
│                                                  │
│   This server uses NO external dependencies      │
│   and provides basic mock responses for testing. │
│                                                  │
└──────────────────────────────────────────────────┘
`);
});