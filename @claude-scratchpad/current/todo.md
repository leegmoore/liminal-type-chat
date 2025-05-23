# Current Todo - Auth Bridge Testing

## Milestone 0009 Phase 3: Edge-Domain Authentication Bridge

### Status
- ✓ Fixed routing issues (edge routes work, domain routes work)
- ✓ Server running with BYPASS_AUTH=true
- ✓ Client running on port 5173
- 🔄 Ready to begin manual testing

### Next Steps

1. [x] Test with BYPASS_AUTH=true
   - [x] Edge health endpoint works without auth
   - [x] Conversations endpoint works without auth
   - [x] API keys endpoint works without auth
   - [x] Test chat endpoint (returns 404 for invalid thread, not auth error)

2. [ ] Test OAuth Flow
   - [x] Navigate to http://localhost:5173
   - [x] Use AuthTester component (found in header link)
   - [x] Started GitHub OAuth flow (POST to /api/v1/auth/oauth/github/authorize successful)
   - [x] Found and fixed token exchange bug (missing await on generateToken)
   - [ ] Retest OAuth flow with fixed server
   - [ ] Verify token storage and display

3. [ ] Test Auth Bridge
   - [ ] Verify edge-to-domain token exchange
   - [ ] Check domain token has additional scopes
   - [ ] Verify token caching

4. [ ] Test Security Boundaries
   - [ ] Restart without BYPASS_AUTH
   - [ ] Verify auth is enforced
   - [ ] Test invalid tokens
   - [ ] Check error responses

### Notes
- AuthTester.tsx already has React rendering fix applied
- Follow procedures in docs/AUTH_BRIDGE_TESTING.md
- Token exchange succeeded but React rendering error occurred
- Need to test: `curl -X POST http://localhost:8765/api/v1/auth/oauth/github/token -H "Content-Type: application/json" -d '{"code":"test-code","state":"test-state","codeVerifier":"test-verifier"}' -s | jq`

### Current Issue
- React error when rendering auth results after token exchange
- Error: "Objects are not valid as a React child (found: object with keys {})"
- Previous fix for empty tokenInfo is in place but error still occurs