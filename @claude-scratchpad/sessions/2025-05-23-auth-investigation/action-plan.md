# Action Plan for Milestone 0009 Phase 3 Testing

## Current Situation
1. **Fixed**: Edge routes now work correctly (after reverting my changes)
2. **Fixed**: Domain routes now work (after adding base path)
3. **Issue**: Some edge routes still return HTML (e.g., /api/v1/api-keys)
4. **Working**: BYPASS_AUTH=true allows edge routes without tokens
5. **Running**: Both server (8765) and client (5173) are operational

## Key Findings
1. The auth system is properly implemented
2. Route mounting patterns are inconsistent in the codebase
3. Auth bypass is working as expected (X-Dev-Auth-Bypass header present)
4. The previous Claude's auth testing got derailed by trying to fix unrelated issues

## Testing Plan for Auth Bridge

### Step 1: Fix Remaining Route Issues
The `/api/v1/api-keys` route returns HTML because edge routes follow the pattern of defining full paths. Need to ensure all routes are properly registered.

### Step 2: Test Auth Bridge Components
1. **Edge Auth Bypass** (BYPASS_AUTH=true)
   - ✓ Health endpoints work without auth
   - ✓ Conversation endpoints work without auth
   - Need to verify api-keys and chat endpoints

2. **Domain Auth Requirements**
   - Domain routes don't have auth middleware (by design)
   - They rely on edge tier to validate and pass domain tokens

3. **Auth Bridge Service**
   - Test token exchange from edge to domain
   - Verify domain client includes proper auth headers

### Step 3: Manual Testing with AuthTester Component
1. Open http://localhost:5173
2. Use the AuthTester component (already has React fix applied)
3. Test OAuth flow with GitHub
4. Verify token exchange and API access

### Step 4: Validate Security Boundaries
1. Disable BYPASS_AUTH and verify auth is required
2. Test invalid tokens are rejected
3. Verify domain endpoints can't be accessed directly

## Next Immediate Actions
1. Check why api-keys route returns HTML
2. Start manual testing with the React AuthTester
3. Document test results per AUTH_BRIDGE_TESTING.md procedures