# Current Understanding

## What Was Wrong
1. **My changes broke edge routes**: I tried to "fix" something that wasn't broken by changing route paths
2. **Domain routes were already broken**: Domain health routes are mounted without base path

## Current Route Status
- **Edge Routes**: Working correctly after reverting my changes
  - `/api/v1/edge/health` ✓ Returns JSON
  - Edge routes define full paths and are mounted without base paths
  
- **Domain Routes**: Not working (original bug)
  - `/api/v1/domain/health` ✗ Returns HTML
  - Domain routes define relative paths but mounted without base path
  - Should be mounted at `/api/v1/domain/health`

## Route Patterns in Codebase
1. **Edge Pattern**: Routes define full paths, mounted without base path
2. **Domain Pattern**: Routes define relative paths, should be mounted with base path

## Next Steps for Testing Auth Bridge
Now that edge routes work, we can test the authentication bridge:
1. Test edge endpoints with BYPASS_AUTH=true
2. Test domain endpoints (after fixing mount path)
3. Test with actual OAuth flow