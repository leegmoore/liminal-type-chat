# Session State - Auth Bridge Testing

## What We Were Doing
Testing Milestone 0009 Phase 3: Edge-Domain Authentication Bridge

## Completed
1. ✅ Fixed JWT generation bug (missing await in auth.ts line 188)
2. ✅ OAuth flow now returns proper JWT tokens
3. ✅ Fixed conversation routes - added auth middleware (was completely unprotected!)
4. ✅ Added npm scripts for server management (dev:log, log, log:clear)
5. ✅ Updated CLAUDE.md with new server commands

## Current Problem
Domain routes are returning HTML (React app) instead of JSON:
- `/api/v1/domain/health` returns 678 bytes of HTML (should return JSON)
- `/api/v1/domain/threads` returns 678 bytes of HTML (should return JSON)
- Edge routes work fine: `/api/v1/edge/health` returns proper JSON

## Key Discovery
Server log shows domain routes ARE being hit (200 status), so they're mounted correctly.
The issue is they're returning HTML content instead of expected JSON.

## Configuration
- `DEV_REQUIRE_AUTH=true` in .env.local
- `BYPASS_AUTH=false` in .env.local
- Server running on port 8765

## What Changed in This Session

### 1. conversation.ts
- Added IJwtService and IUserRepository parameters
- Added auth middleware to all routes
- Changed all route handlers from Request to AuthenticatedRequest

### 2. app.ts
- Imported createDomainApiRoutes and AuthBridgeServiceFactory
- Created auth bridge service asynchronously
- Attempted to mount domain routes with auth (async)
- **ISSUE**: Domain routes mounted async after other routes

### 3. package.json
- Added server management scripts: dev:log, log, log:clear

## Hypothesis to Test Next
1. Domain routes ARE accessible (200 status in logs)
2. But returning HTML instead of JSON
3. Could be:
   - Static file middleware interfering
   - Error in route handler causing fallthrough
   - Domain auth middleware redirecting/serving HTML
   - Route path mismatch causing catch-all to handle

## Next Steps
1. Check if domain auth middleware is redirecting to HTML
2. Add debug logging to domain route handlers
3. Test domain routes with valid domain token (not edge token)
4. Check if there's middleware serving static files on domain routes

## Important Files
- `/server/src/routes/domain/index.ts` - Domain route setup with auth
- `/server/src/middleware/domain-auth-middleware.ts` - Domain auth logic
- `/server/src/routes/domain/health.ts` - Should return JSON
- `/server/src/app.ts` - Route mounting (line ~109-121 async domain setup)

## Commands to Test
```bash
cd server && npm run api -- /api/v1/domain/health  # Returns HTML (wrong)
cd server && npm run api -- /api/v1/edge/health    # Returns JSON (correct)
```