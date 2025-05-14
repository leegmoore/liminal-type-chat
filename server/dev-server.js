/**
 * Development server that uses mock LLM implementations
 * for testing when actual dependencies aren't available
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Create Express app
const app = express();
const PORT = 8765;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Store conversations and messages in memory for testing
const conversations = [];
const apiKeys = {};

// Health check endpoint
app.get('/api/v1/edge/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'development',
    services: {
      api: 'ok',
      database: 'ok',
      authentication: 'mock'
    }
  });
});

// API key endpoints
app.get('/api/v1/api-keys/:provider', (req, res) => {
  const { provider } = req.params;
  const hasKey = apiKeys[provider] !== undefined;
  
  res.json({
    provider,
    hasKey,
    label: hasKey ? apiKeys[provider].label : null,
    createdAt: hasKey ? apiKeys[provider].createdAt : null
  });
});

app.post('/api/v1/api-keys/:provider', (req, res) => {
  const { provider } = req.params;
  const { apiKey, label } = req.body;
  
  apiKeys[provider] = {
    key: apiKey,
    label: label || `${provider} API Key`,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    provider,
    label: apiKeys[provider].label,
    createdAt: apiKeys[provider].createdAt
  });
});

// Conversation endpoints
app.get('/api/v1/conversations', (req, res) => {
  res.json({
    conversations: conversations.map(convo => ({
      id: convo.id,
      title: convo.title,
      createdAt: convo.createdAt,
      updatedAt: convo.updatedAt,
      messages: convo.messages
    }))
  });
});

app.post('/api/v1/conversations', (req, res) => {
  const newConvo = {
    id: uuidv4(),
    title: req.body.title || 'New Conversation',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: []
  };
  
  conversations.push(newConvo);
  
  res.status(201).json(newConvo);
});

app.get('/api/v1/conversations/:id', (req, res) => {
  const convo = conversations.find(c => c.id === req.params.id);
  
  if (!convo) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  res.json(convo);
});

// Models endpoints
app.get('/api/v1/chat/models/:provider', (req, res) => {
  const { provider } = req.params;
  
  if (provider === 'anthropic') {
    res.json({
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
        },
        {
          id: 'claude-3-sonnet-20240229',
          name: 'Claude 3 Sonnet',
          provider: 'anthropic',
          maxTokens: 4096,
          contextWindow: 200000,
          supportsStreaming: true
        },
        {
          id: 'claude-3-haiku-20240307',
          name: 'Claude 3 Haiku',
          provider: 'anthropic',
          maxTokens: 4096,
          contextWindow: 200000,
          supportsStreaming: true
        }
      ]
    });
  } else if (provider === 'openai') {
    res.json({
      models: [
        {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'openai',
          maxTokens: 8192,
          contextWindow: 8192,
          supportsStreaming: true
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          provider: 'openai',
          maxTokens: 4096,
          contextWindow: 16385,
          supportsStreaming: true
        }
      ]
    });
  } else {
    res.status(400).json({
      error: 'Unsupported provider',
      message: `Provider ${provider} is not supported`
    });
  }
});

// Chat completion endpoints
app.post('/api/v1/chat/completions', (req, res) => {
  const { prompt, provider, modelId, threadId } = req.body;
  
  // Find the conversation
  const conversation = conversations.find(c => c.id === threadId);
  if (!conversation) {
    return res.status(404).json({ error: 'Thread not found' });
  }
  
  // Add user message
  const userMessage = {
    id: uuidv4(),
    role: 'user',
    content: prompt,
    timestamp: Date.now()
  };
  
  conversation.messages.push(userMessage);
  
  // Generate mock response based on provider
  let responseContent = '';
  if (provider === 'anthropic') {
    responseContent = `This is a mock response from Claude${modelId.includes('claude-3-7') ? ' 3.7 Sonnet' : ''}.\n\nYou asked: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n\nI'm responding with a simulated answer since this is a development server using mock implementations.`;
  } else {
    responseContent = `This is a mock response from ${modelId || 'a language model'}.\n\nYou asked: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n\nThis is a simulated response for testing purposes.`;
  }
  
  // Add assistant message
  const assistantMessage = {
    id: uuidv4(),
    role: 'assistant',
    content: responseContent,
    timestamp: Date.now(),
    metadata: {
      modelId: modelId || (provider === 'anthropic' ? 'claude-3-7-sonnet-20250218' : 'gpt-3.5-turbo'),
      provider,
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(responseContent.length / 4),
        totalTokens: Math.ceil(prompt.length / 4) + Math.ceil(responseContent.length / 4)
      },
      finishReason: 'stop'
    }
  };
  
  conversation.messages.push(assistantMessage);
  conversation.updatedAt = Date.now();
  
  // Return completion response
  res.json({
    threadId,
    messageId: assistantMessage.id,
    content: responseContent,
    model: assistantMessage.metadata.modelId,
    provider,
    finishReason: 'stop',
    usage: assistantMessage.metadata.usage
  });
});

// Streaming chat completion endpoint
app.post('/api/v1/chat/completions/stream', (req, res) => {
  const { prompt, provider, modelId, threadId } = req.body;
  
  // Find the conversation
  const conversation = conversations.find(c => c.id === threadId);
  if (!conversation) {
    return res.status(404).json({ error: 'Thread not found' });
  }
  
  // Add user message
  const userMessage = {
    id: uuidv4(),
    role: 'user',
    content: prompt,
    timestamp: Date.now()
  };
  
  conversation.messages.push(userMessage);
  
  // Generate mock response based on provider
  let responseContent = '';
  if (provider === 'anthropic') {
    responseContent = `This is a mock streaming response from Claude${modelId.includes('claude-3-7') ? ' 3.7 Sonnet' : ''}.\n\nYou asked: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n\nI'm responding with a simulated streaming answer for testing purposes.`;
  } else {
    responseContent = `This is a mock streaming response from ${modelId || 'a language model'}.\n\nYou asked: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"\n\nThis is a simulated streaming response for testing.`;
  }
  
  // Add placeholder assistant message
  const assistantMessage = {
    id: uuidv4(),
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    metadata: {
      modelId: modelId || (provider === 'anthropic' ? 'claude-3-7-sonnet-20250218' : 'gpt-3.5-turbo'),
      provider
    }
  };
  
  conversation.messages.push(assistantMessage);
  
  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Break the response into chunks
  const chunks = [];
  const chunkLength = Math.ceil(responseContent.length / 10);
  for (let i = 0; i < responseContent.length; i += chunkLength) {
    chunks.push(responseContent.substring(i, Math.min(i + chunkLength, responseContent.length)));
  }
  
  // Send chunks with delays
  let totalSent = 0;
  const promptTokens = Math.ceil(prompt.length / 4);
  
  // Stream chunks with delays
  let chunkIndex = 0;
  const streamInterval = setInterval(() => {
    if (chunkIndex >= chunks.length) {
      // All chunks sent, finish streaming
      clearInterval(streamInterval);
      
      // Update the message with final content
      assistantMessage.content = responseContent;
      assistantMessage.metadata.usage = {
        promptTokens,
        completionTokens: Math.ceil(responseContent.length / 4),
        totalTokens: promptTokens + Math.ceil(responseContent.length / 4)
      };
      assistantMessage.metadata.finishReason = 'stop';
      
      // Send final event
      res.write(`data: ${JSON.stringify({
        threadId,
        messageId: assistantMessage.id,
        content: '',
        model: assistantMessage.metadata.modelId,
        provider,
        finishReason: 'stop',
        done: true,
        usage: assistantMessage.metadata.usage
      })}\n\n`);
      
      res.end();
      return;
    }
    
    const chunk = chunks[chunkIndex];
    totalSent += chunk.length;
    
    // Update message content
    assistantMessage.content += chunk;
    
    // Send chunk
    res.write(`data: ${JSON.stringify({
      threadId,
      messageId: assistantMessage.id,
      content: chunk,
      model: assistantMessage.metadata.modelId,
      provider,
      done: false
    })}\n\n`);
    
    chunkIndex++;
  }, 200);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(streamInterval);
  });
});

// Guest login endpoint
app.post('/api/v1/auth/guest-login', (req, res) => {
  res.json({
    token: 'mock.jwt.token.for.development',
    user: {
      id: 'guest-user',
      name: 'Guest User',
      email: 'guest@example.com'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
┌──────────────────────────────────────────────────┐
│                                                  │
│   Development Server with Mock LLM Started       │
│                                                  │
│   URL: http://localhost:${PORT}                    │
│                                                  │
│   API Endpoints:                                 │
│    - Health: /api/v1/edge/health                 │
│    - Models: /api/v1/chat/models/:provider       │
│    - API Keys: /api/v1/api-keys/:provider        │
│    - Chat Completions: /api/v1/chat/completions  │
│                                                  │
│   This server uses mock implementations and      │
│   doesn't require actual LLM API dependencies.   │
│                                                  │
└──────────────────────────────────────────────────┘
`);
});