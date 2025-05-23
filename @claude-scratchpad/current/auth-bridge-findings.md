# Auth Bridge Testing Findings

## Current Status

### OAuth Flow ✅
- Fixed JWT generation bug (missing await)
- OAuth flow now returns proper JWT token with edge scopes
- Token contains: userId, email, name, scopes, tier="edge"

### BYPASS_AUTH Behavior
- When `BYPASS_AUTH=true`:
  - Edge middleware adds mock edge user (bypasses edge auth)
  - Domain middleware ALSO adds mock domain user (bypasses domain auth)
  - This means we can't test the auth bridge with BYPASS_AUTH enabled

### Auth Bridge Architecture
- `AuthBridgeService` exists with `generateDomainToken()` method
- Has scope mapping (edge scopes → domain scopes)
- Has token caching for performance
- BUT: HTTP domain clients don't use it yet

### Missing Pieces
1. No `/api/v1/auth/exchange-token` endpoint for explicit token exchange
2. HTTP domain clients don't automatically exchange tokens
3. Can't test auth bridge with BYPASS_AUTH=true (it bypasses everything)

## Next Steps

1. Disable BYPASS_AUTH to test real auth enforcement
2. Test if domain endpoints reject edge tokens
3. Check if there's an implicit token exchange mechanism
4. Document actual vs expected behavior

## Key Insight
The retrospective assumed BYPASS_AUTH only bypassed edge auth, but it actually bypasses both edge AND domain auth. This explains why we can't test the auth bridge boundary with it enabled.