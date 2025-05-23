#!/usr/bin/env node
/**
 * Local API testing utility
 * Hardcoded to localhost:8765 for security
 * 
 * Usage:
 *   npm run api -- /endpoint                     # GET request
 *   npm run api -- /endpoint '{"json"}'         # POST with data
 *   npm run api -- /endpoint -H "Auth: X"        # With headers
 *   npm run api -- /endpoint?q=test&limit=10    # With query params
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

  console.log(`\n${method} ${url}`);
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
    
    // Show interesting response headers
    const devBypass = response.headers.get('x-dev-auth-bypass');
    if (devBypass) {
      console.log(`x-dev-auth-bypass: ${devBypass}`);
    }
    
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