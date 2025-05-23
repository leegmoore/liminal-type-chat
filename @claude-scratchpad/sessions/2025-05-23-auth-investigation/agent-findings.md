# Agent Investigation Findings

## Agent 1: Test Investigation
- Edge routes should have auth middleware, but `/api/v1/edge/conversations` is missing it
- Domain routes rely on edge authentication through auth bridge pattern
- BYPASS_AUTH should allow edge routes without tokens
- System has proper auth middleware and AuthBridgeService implementations
- Expected API responses are JSON with specific error/success formats

## Agent 2: Route/Middleware Analysis  
- **CRITICAL**: Catch-all route `app.get('*', ...)` on line 636 catches API requests
- Static files served from public directory with React build
- When API routes don't match exactly, catch-all serves HTML
- Route mounting order allows catch-all to intercept failed API matches

## Agent 3: Git History Analysis
- Failed to execute properly due to path issues

## Agent 4: Configuration Analysis
- DEV_REQUIRE_AUTH is commented out in .env.local, causing auth bypass
- CORS using wildcard (*) instead of configured CORS_ORIGIN
- Conflicting .env files (port 3000 vs 8765)  
- Security headers middleware exists but not applied

## Key Insights
1. The HTML response issue is likely due to catch-all route intercepting API calls
2. Auth system is properly implemented but configuration is bypassing it
3. Multiple configuration issues but they're not causing the HTML response problem