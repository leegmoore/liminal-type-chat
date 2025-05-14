/**
 * Minimal Express server that just implements basic health endpoints
 * This helps diagnose server startup issues without the complexity of the full app
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

// Create minimal Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoints
app.get('/api/v1/edge/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      api: 'ok'
    }
  });
});

// API key status mock endpoint
app.get('/api/v1/edge/api-keys/:provider', (req, res) => {
  const { provider } = req.params;
  res.json({
    provider,
    hasKey: true,
    label: 'Test API Key',
    createdAt: new Date().toISOString()
  });
});

// Simple chat models endpoint
app.get('/api/v1/edge/chat/models/:provider', (req, res) => {
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

// Start server
app.listen(PORT, () => {
  console.log(`Minimal test server running at http://localhost:${PORT}`);
  console.log(`Health check URL: http://localhost:${PORT}/api/v1/edge/health`);
  console.log(`API keys URL: http://localhost:${PORT}/api/v1/edge/api-keys/anthropic`);
  console.log(`Models URL: http://localhost:${PORT}/api/v1/edge/chat/models/anthropic`);
});