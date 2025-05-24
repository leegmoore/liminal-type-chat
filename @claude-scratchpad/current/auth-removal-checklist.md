# Auth Removal Checklist
Date: 2025-05-24

## Files to Delete (31 total)

### Auth Provider Directory (entire directory)
```bash
rm -rf server/src/providers/auth/
```
This removes:
- IOAuthProvider.ts
- OAuthProviderFactory.ts
- index.ts
- github/GitHubOAuthProvider.ts
- jwt/* (all JWT services)
- pkce/* (all PKCE storage)
- bridge/* (AuthBridge services)
- All associated test files

### Middleware Files (6 files)
```bash
rm -f server/src/middleware/auth-middleware.ts
rm -f server/src/middleware/auth-utils.ts
rm -f server/src/middleware/domain-auth-middleware.ts
rm -f server/src/middleware/domain-auth-utils.ts
rm -f server/src/middleware/__tests__/auth-middleware.test.ts
rm -f server/src/middleware/__tests__/auth-utils.test.ts
rm -f server/src/middleware/__tests__/domain-auth-middleware.test.ts
rm -f server/src/middleware/__tests__/domain-auth-utils.test.ts
```

### Route Files (3 files)
```bash
rm -f server/src/routes/edge/auth.ts
rm -f server/src/routes/__tests__/auth.test.ts
rm -f server/src/routes/__tests__/auth-pkce.test.ts
```

### Frontend Files (2 files)
```bash
rm -f client/src/components/AuthTester.tsx
rm -f client/src/services/authService.ts
```

## Files to Modify (9 files)

### Backend
1. **server/src/app.ts**
   - Remove auth route import
   - Remove auth route mounting

2. **server/src/middleware/index.ts**
   - Remove auth middleware exports

3. **server/src/routes/edge/conversation.ts**
   - Remove requireEdgeAuth from all routes
   - Replace getUserFromAuthToken with mock user

4. **server/src/routes/edge/chat.ts**
   - Remove requireEdgeAuth
   - Use mock userId

5. **server/src/routes/edge/api-keys.ts**
   - Remove requireEdgeAuth
   - Use mock userId

6. **server/src/routes/domain/context-thread.ts**
   - Remove requireDomainAuth

### Frontend
7. **client/src/App.tsx**
   - Remove AuthTester import and route

8. **client/src/pages/ChatPage.tsx**
   - Remove guest login logic (lines 111-140)

9. **Various test files**
   - Update to work without auth headers

## Database Changes
```sql
DROP TABLE IF EXISTS pkce_challenges;
-- Keep users table for Phase 2
```

## Environment Variables to Remove
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET  
- JWT_SECRET
- ENCRYPTION_KEY
- AUTH_REQUIRED
- SECURE_COOKIES

## Verification Steps
1. Run all tests: `npm test`
2. Run lint: `npm run lint`
3. Start app and verify:
   - Health endpoints work
   - Can create conversations
   - Can send messages
   - No auth errors