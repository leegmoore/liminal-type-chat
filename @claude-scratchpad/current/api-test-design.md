# Local API Test Script Design

## Interface Design

### Basic Usage
```bash
# GET request (default)
npm run api -- /api/v1/edge/health

# POST with data (auto-detects POST when data provided)
npm run api -- /api/v1/auth/token '{"code":"abc123"}'

# Explicit method
npm run api -- DELETE /api/v1/conversations/123

# With headers
npm run api -- /api/v1/protected -H "Authorization: Bearer token123"

# Multiple headers
npm run api -- /api/v1/test -H "Authorization: Bearer xyz" -H "X-Custom: value"

# Query parameters (just include in path)
npm run api -- /api/v1/search?q=test&limit=10
```

## Script Implementation

```javascript
#!/usr/bin/env node
/**
 * Local API testing utility
 * Hardcoded to localhost:8765 for security
 */

const BASE_URL = 'http://localhost:8765';

function parseArgs(args) {
  const result = {
    method: null,
    path: null,
    data: null,
    headers: {}
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    
    // Check for -H flag for headers
    if (arg === '-H' && i + 1 < args.length) {
      const header = args[i + 1];
      const [key, ...valueParts] = header.split(':');
      result.headers[key.trim()] = valueParts.join(':').trim();
      i += 2;
      continue;
    }
    
    // Check for HTTP method
    if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(arg.toUpperCase())) {
      result.method = arg.toUpperCase();
      i++;
      continue;
    }
    
    // First unrecognized arg is the path
    if (!result.path && arg.startsWith('/')) {
      result.path = arg;
      i++;
      continue;
    }
    
    // Any remaining arg that looks like JSON is data
    if (!result.data && (arg.startsWith('{') || arg.startsWith('['))) {
      result.data = arg;
      i++;
      continue;
    }
    
    i++;
  }

  // Auto-detect method based on data
  if (!result.method) {
    result.method = result.data ? 'POST' : 'GET';
  }

  return result;
}

async function makeRequest(config) {
  const { method, path, data, headers } = config;
  
  if (!path) {
    console.error('Error: No path provided');
    console.log('Usage: npm run api -- [METHOD] /path [data] [-H "Header: value"]');
    process.exit(1);
  }

  const url = BASE_URL + path;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      // Validate JSON
      JSON.parse(data);
      options.body = data;
    } catch (e) {
      console.error('Error: Invalid JSON data');
      process.exit(1);
    }
  }

  console.log(`${method} ${url}`);
  if (Object.keys(headers).length > 0) {
    console.log('Headers:', headers);
  }
  if (data) {
    console.log('Body:', JSON.parse(data));
  }
  console.log('---');

  try {
    const response = await fetch(url, options);
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const json = await response.json();
      console.log(JSON.stringify(json, null, 2));
    } else {
      const text = await response.text();
      console.log(text);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);
const config = parseArgs(args);
makeRequest(config);
```

## Package.json Addition

```json
{
  "scripts": {
    "api": "node scripts/test-api.js",
    "api:help": "echo 'Usage: npm run api -- [METHOD] /path [data] [-H \"Header: value\"]'"
  }
}
```

## Benefits

1. **Smart defaults**: GET for simple requests, POST when data provided
2. **Flexible**: Can override method, add headers, send any data
3. **Secure**: Hardcoded to localhost:8765
4. **Developer friendly**: Shows request details before response
5. **Handles errors gracefully**: Invalid JSON, connection errors, etc.

## Example Usage for Our Project

```bash
# Test health
npm run api -- /api/v1/edge/health

# Test auth with BYPASS_AUTH
npm run api -- /api/v1/conversations

# Test OAuth flow
npm run api -- POST /api/v1/auth/oauth/github/authorize '{"provider":"github","usePkce":true}'

# Test with auth header
npm run api -- /api/v1/api-keys/openai -H "Authorization: Bearer fake-token"
```