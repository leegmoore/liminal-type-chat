# Security Implementation Testing Guide

This document provides instructions for testing the security implementations in Phase 3 of Milestone 0009. These implementations include tiered authentication between Edge and Domain layers, token validation and exchange, security headers, and resource-level authorization.

## Prerequisites

Before running the tests, make sure you have the following:

1. Node.js v16 or higher
2. All dependencies installed (`npm install` in both root and server directories)
3. Development environment setup (see README.md)

## Test Components

The security implementation involves the following components that need testing:

1. **AuthBridgeService** - Handles token exchange between Edge and Domain tiers
2. **Domain Authentication Middleware** - Secures Domain API routes
3. **Security Headers Middleware** - Protects against common web vulnerabilities
4. **Secure Storage** - Handles sensitive data like API keys

## Running Automated Tests

### Standard Test Suite

To run the full test suite which includes all security-related tests:

```bash
cd server
npm test
```

### Test Specific Components

To test specific security components:

```bash
cd server
# Test AuthBridgeService
npx jest src/providers/auth/bridge/__tests__/AuthBridgeService.test.ts

# Test Domain Authentication Middleware
npx jest src/middleware/__tests__/domain-auth-middleware.test.ts

# Test Security Headers
npx jest src/middleware/__tests__/security-headers.test.ts
```

## Manual Testing

### 1. Test Edge-to-Domain Token Bridging

```bash
# Start the server
cd server
npm run dev

# In a separate terminal, use the following API calls with cURL
# 1. Get an edge token (this would normally come from login)
curl -X POST http://localhost:3001/api/v1/edge/auth/demo-login -H "Content-Type: application/json" -d '{"username": "dev-user", "password": "dev-password"}'

# 2. Call a secured domain endpoint with Bearer token
curl -X GET http://localhost:3001/api/v1/domain/health -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. Test Security Headers

Use browser developer tools to verify security headers are being set correctly:

1. Open browser dev tools (F12)
2. Go to the Network tab
3. Load the application (http://localhost:3000)
4. Click on any network request to the server
5. Check the Response Headers section for the following headers:
   - X-Content-Type-Options
   - X-XSS-Protection
   - X-Frame-Options
   - Content-Security-Policy
   - Strict-Transport-Security (in production only)
   - Referrer-Policy
   - Permissions-Policy

### 3. Test Resource Ownership Authorization

```bash
# 1. Create a resource (conversation) as user A
curl -X POST http://localhost:3001/api/v1/edge/conversations -H "Authorization: Bearer USER_A_TOKEN" -H "Content-Type: application/json" -d '{"title": "Test Conversation"}'

# 2. Try to access the resource with user B's token (should be denied)
curl -X GET http://localhost:3001/api/v1/edge/conversations/CONVERSATION_ID -H "Authorization: Bearer USER_B_TOKEN"

# 3. Try to access the resource with user A's token (should be allowed)
curl -X GET http://localhost:3001/api/v1/edge/conversations/CONVERSATION_ID -H "Authorization: Bearer USER_A_TOKEN"
```

## Verification Checklist

- [ ] AuthBridgeService can validate Edge tokens
- [ ] AuthBridgeService can generate Domain tokens with appropriate scopes
- [ ] AuthBridgeService can validate Domain tokens
- [ ] Domain-specific middleware rejects unauthorized requests
- [ ] Domain-specific middleware enforces resource ownership
- [ ] Security headers are properly set
- [ ] Sensitive data is properly secured

## Troubleshooting

### Common Issues

1. **Token Validation Errors**
   - Check that your JWT keys are properly generated
   - Verify token expiration times
   - Make sure scopes are properly set

2. **Middleware Errors**
   - Check the authorization header format (should be `Bearer TOKEN`)
   - Verify that the user has the required scopes
   - Check resource ownership parameters

3. **Security Headers Issues**
   - In development mode, some headers may be relaxed
   - Content-Security-Policy may block some resources in strict mode

### Debugging

- Use the debug HTTP requests in the development environment
- Check server logs for detailed error messages
- Use JWT debugging tools to inspect tokens

## Next Steps

After successful testing, consider the following next steps:

1. Run security scanning tools against the application
2. Perform penetration testing
3. Review and update security documentation
4. Schedule regular security assessments