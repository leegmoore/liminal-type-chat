# Auth Bridge Testing

## Edge Token (from OAuth login)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YTQ3OWRlNy0zNjYxLTQ5ZGMtOWQzMC1mZjhiYzdlNDNjMDMiLCJlbWFpbCI6ImxlZS5nLm1vb3JlQGdtYWlsLmNvbSIsIm5hbWUiOiJsZWVnbW9vcmUiLCJzY29wZXMiOlsicmVhZDpwcm9maWxlIiwicmVhZDpjb252ZXJzYXRpb25zIiwid3JpdGU6Y29udmVyc2F0aW9ucyJdLCJ0aWVyIjoiZWRnZSIsImp0aSI6ImM4ZThkOTJmLWJiYTQtNGEyOS1hZTM5LWIyYTMxZWJkZjY1OCIsImlhdCI6MTc0ODAzMzg1OSwiZXhwIjoxNzQ4MDM1NjU5fQ.tetPjQM8dFaztsKmrwRw5rZKYFuia8gJJKjTtyiC5MI
```

Edge token claims:
- tier: "edge"
- scopes: ["read:profile", "read:conversations", "write:conversations"]

## Issue Found

Domain routes are being caught by the catch-all route `app.get('*', ...)` because:
1. Domain routes are mounted asynchronously (after auth bridge is created)
2. The catch-all route is registered synchronously before domain routes
3. Express matches routes in order, so `*` catches `/api/v1/domain/*` requests

## Findings

1. **Domain Routes Issue**: Domain routes are inaccessible due to being mounted after the catch-all route
2. **Client Mode**: The system is using 'direct' mode (in-process) by default, not HTTP
3. **Auth Bridge Not Used**: In direct mode, edge services call domain services directly without going through the auth bridge

## What We've Verified

✅ **OAuth Flow**: Working correctly with edge tokens
✅ **Edge Authentication**: Edge routes properly validate JWT tokens
✅ **Token Generation**: JWT tokens are generated correctly with proper claims

## What We Cannot Test (Due to Architecture)

❌ **Edge-to-Domain Token Exchange**: Not happening in direct mode
❌ **Domain Token Scopes**: No domain tokens are generated in direct mode
❌ **Token Caching**: Auth bridge caching is not used in direct mode

## Conclusion

The auth bridge implementation exists but is not being exercised in the current configuration because:
1. Domain routes are not accessible via HTTP (routing issue)
2. Edge tier uses direct in-process calls to domain services (bypassing auth bridge)