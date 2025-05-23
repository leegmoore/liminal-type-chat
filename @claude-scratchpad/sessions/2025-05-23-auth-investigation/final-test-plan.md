# Final Test Plan for Milestone 0009 Phase 3

## Status Summary
✅ **Server Issues Resolved**:
- Edge routes work correctly (e.g., `/api/v1/edge/health`)
- Domain routes work after fix (e.g., `/api/v1/domain/health`)
- API routes with parameters work (e.g., `/api/v1/api-keys/openai`)
- BYPASS_AUTH=true is functioning (X-Dev-Auth-Bypass header present)

✅ **Applications Running**:
- Server: http://localhost:8765
- Client: http://localhost:5173

## Auth Bridge Testing Procedures

### 1. Test with BYPASS_AUTH=true (Current State)
**Purpose**: Verify edge routes work without auth, understand baseline behavior

**Tests**:
- [x] Edge health endpoint - Works without auth
- [x] Conversations endpoint - Works without auth  
- [x] API keys endpoint - Works without auth (returns dev data)
- [ ] Chat endpoint - Need to test

**Expected**: All edge routes accessible, dev user automatically created

### 2. Test OAuth Flow
**Purpose**: Verify GitHub OAuth with PKCE works correctly

**Steps**:
1. Open http://localhost:5173 in browser
2. Navigate to AuthTester component
3. Click "Login with GitHub"
4. Complete OAuth flow
5. Verify token is received and stored
6. Test API access with real token

### 3. Test Auth Bridge Service
**Purpose**: Verify edge-to-domain token exchange

**Steps**:
1. With valid edge token, make request to conversation endpoint
2. Check logs/network to verify domain client uses domain token
3. Test that domain token has additional scopes
4. Verify token caching works

### 4. Test Security Boundaries
**Purpose**: Ensure security controls work properly

**Tests**:
1. Stop server, restart without BYPASS_AUTH
2. Verify edge routes now require authentication
3. Test with invalid/expired tokens
4. Verify proper error responses

## Manual Testing Guide
Follow procedures in `docs/AUTH_BRIDGE_TESTING.md`:
- Test 1: Edge Authentication Flow ✓
- Test 2: Edge to Domain Token Exchange  
- Test 3: Security Headers
- Test 4: Error Handling
- Test 5: Token Scopes
- Test 6: Environment-based Security

## Success Criteria
- [ ] OAuth login works with PKCE
- [ ] Edge endpoints require auth when BYPASS_AUTH is false
- [ ] Domain endpoints receive proper domain tokens
- [ ] Invalid tokens are rejected with proper errors
- [ ] Security headers are applied appropriately