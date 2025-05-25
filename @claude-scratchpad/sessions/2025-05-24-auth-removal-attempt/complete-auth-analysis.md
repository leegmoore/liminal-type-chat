# Complete Authentication Analysis

## Date: 2025-05-24
## Objective: Complete analysis of authentication implementation for removal

## 1. Auth Routes (/server/src/routes/edge/auth.ts)

**File Location**: `/server/src/routes/edge/auth.ts`
**Mount Point**: `/api/v1/auth` (line 131 in app.ts)

### Endpoints:

1. **POST /api/v1/auth/oauth/:provider/authorize** (lines 34-112)
   - Generates OAuth authorization URL
   - Supports PKCE flow (Proof Key for Code Exchange)
   - Validates redirect URI
   - Stores PKCE data for later verification
   - Returns authorization URL, state, and PKCE status

2. **POST /api/v1/auth/oauth/:provider/token** (lines 118-219)
   - Exchanges OAuth authorization code for JWT token
   - Validates state parameter
   - Verifies redirect URI matches
   - Creates/finds user in database
   - Generates JWT token with scopes
   - Sets HttpOnly cookie `authToken`
   - Returns user info and token

3. **POST /api/v1/auth/token/refresh** (lines 225-277)
   - Refreshes expired JWT tokens
   - Decodes old token to get user ID
   - Generates new token with same scopes
   - Updates HttpOnly cookie
   - Returns new token

4. **POST /api/v1/auth/logout** (lines 283-291)
   - Clears authToken cookie
   - Returns success message

5. **POST /api/v1/auth/maintenance/cleanup-sessions** (lines 297-305)
   - Maintenance endpoint to clean expired PKCE sessions
   - No authentication required

### Dependencies:
- JwtService for token generation/validation
- OAuthProvider (currently only GitHub)
- UserRepository for user management
- PkceStorage for PKCE session management

## 2. Auth Middleware Files

### a) auth-middleware.ts
**Purpose**: Edge tier authentication middleware

**Key Functions**:
- `createAuthMiddleware()` (lines 47-183)
  - Checks Authorization header (Bearer token) or authToken cookie
  - Supports local dev bypass when AUTH_REQUIRED=false
  - Verifies JWT token
  - Validates required scopes and tier
  - Attaches user info to request
  - Supports extended token lifetime in dev

**AuthenticatedRequest Interface** (lines 17-26):
```typescript
user?: {
  userId: string;
  email: string;
  name: string;
  scopes: string[];
  tier: 'edge' | 'domain';
  tokenId: string;
}
```

### b) auth-utils.ts
**Purpose**: Helper functions for auth in route handlers

**Key Functions**:
- `requireUserId()` - Extracts user ID from authenticated request
- `hasScope()` - Checks if user has specific scope
- `isTier()` - Validates user tier (edge/domain)
- `withAuthenticatedUser()` - HOF for authenticated route handlers

### c) domain-auth-middleware.ts
**Purpose**: Domain tier authentication (for internal services)

**Key Functions**:
- `createDomainAuthMiddleware()` (lines 51-190)
  - Requires Authorization header (no cookie support)
  - Uses AuthBridgeService for token validation
  - Supports domain-specific scopes
  - Resource ownership validation
  - Admin scope bypass

**DomainAuthenticatedRequest Interface** (lines 18-29):
```typescript
user?: {
  userId: string;
  email: string;
  name: string;
  scopes: string[];
  tier: string;
  tokenId?: string;
  domainScopes?: string[];
  sourceTokenId?: string;
}
```

## 3. Auth Integration in Other Routes

### a) Conversation Routes (conversation.ts)
- **Auth Applied**: Line 98-102
- Uses `createAuthMiddleware()` with:
  - `required: true`
  - `requiredScopes: []` (no specific scopes)
  - `requiredTier: 'edge'`
- Applied to ALL conversation endpoints

### b) Chat Routes (chat.ts & chat-routes.ts)
- **Auth Applied**: Lines 43-47 in chat.ts
- Same configuration as conversation routes
- Applied to:
  - GET /api/v1/chat/models/:provider
  - POST /api/v1/chat/completions
  - GET /api/v1/chat/completions/stream
- Uses `req.user.userId` to identify user for API keys

### c) API Keys Routes (api-keys.ts)
- **Auth Applied**: Line 30
- Basic auth middleware (no specific options)
- Applied to:
  - POST /api/v1/api-keys/:provider
  - GET /api/v1/api-keys/:provider
  - DELETE /api/v1/api-keys/:provider
- All handlers check `req.user.userId`

### d) Domain Routes (domain/index.ts)
- **Auth Applied**: Lines 32-34
- Uses `createDomainAuthMiddleware()` for domain tier
- Applied to `/api/v1/domain/threads/*` endpoints
- Health endpoints have NO auth (line 42)

## 4. Session Management & Cookies

### Cookie Settings:
- **Name**: `authToken`
- **Properties** (lines 197-202 in auth.ts):
  - `httpOnly: true` (not accessible via JS)
  - `secure: true` in production (HTTPS only)
  - `sameSite: 'lax'` (CSRF protection)
  - `maxAge: 7 * 24 * 60 * 60 * 1000` (7 days)

### Session Storage:
- PKCE sessions stored via PkceStorage
- Default 10-minute expiration for PKCE
- JWT tokens contain session info (userId, scopes, tier)
- No server-side session storage for JWT

## 5. Complete Auth Flow

### Login Flow:
1. Client calls POST /api/v1/auth/oauth/github/authorize
2. Server generates PKCE challenge, stores it
3. Returns GitHub authorization URL
4. User authorizes on GitHub
5. GitHub redirects back with code
6. Client calls POST /api/v1/auth/oauth/github/token
7. Server validates PKCE, exchanges code for token
8. Creates/updates user in database
9. Generates JWT, sets cookie
10. Returns user info

### Request Authentication:
1. Middleware checks Authorization header or cookie
2. Verifies JWT signature and expiration
3. Validates scopes and tier if required
4. Attaches user info to request
5. Route handler accesses via req.user

### Token Refresh:
1. Client detects expired token
2. Calls POST /api/v1/auth/token/refresh
3. Server generates new token
4. Updates cookie

### Logout:
1. Client calls POST /api/v1/auth/logout
2. Server clears authToken cookie

## 6. Removal/Modification Guide

### Files to Remove Completely:

#### Auth Route Files:
- `/server/src/routes/edge/auth.ts`
- `/server/src/routes/__tests__/auth.test.ts`
- `/server/src/routes/__tests__/auth-pkce.test.ts`

#### Middleware Files:
- `/server/src/middleware/auth-middleware.ts`
- `/server/src/middleware/auth-utils.ts`
- `/server/src/middleware/domain-auth-middleware.ts`
- `/server/src/middleware/domain-auth-utils.ts`
- All files in `/server/src/middleware/__tests__/`

#### Auth Provider Files:
- Entire directory: `/server/src/providers/auth/`
- This includes OAuth, JWT, PKCE, and AuthBridge subdirectories

### Files to Modify:

#### app.ts (Major changes):
- **Remove imports** (lines 12, 21-28):
  - createAuthRoutes
  - UserRepository
  - EncryptionService
  - SecureStorage
  - JwtServiceFactory, IJwtService, JwtService
  - GitHubOAuthProvider
  - AuthBridgeServiceFactory
- **Remove initialization** (lines 68-86):
  - encryptionService, secureStorage, userRepository
  - jwtService initialization
- **Remove OAuth setup** (lines 92-98)
- **Remove auth route mounting** (line 131)
- **Remove AuthBridge setup** (lines 113-126)
- **Remove userRepository from route creation** (lines 130-133)

#### conversation.ts:
- **Remove imports** (lines 16-18):
  - IJwtService, IUserRepository
  - createAuthMiddleware
- **Remove parameters** from createConversationRoutes (lines 82-83)
- **Remove auth middleware** (lines 98-102)

#### chat.ts & chat-routes.ts:
- **Remove imports**:
  - createAuthMiddleware, IJwtService, IUserRepository
  - AuthenticatedRequest interface
- **Remove parameters** from functions
- **Remove auth middleware** (lines 43-47)
- **Remove user checks** in route handlers
- **Modify handlers** to not use req.user.userId

#### api-keys.ts:
- This entire file can likely be removed as it's auth-dependent
- If keeping, need major refactoring to remove user association

#### domain/index.ts:
- **Remove imports** (lines 13-14):
  - createDomainAuthMiddleware
  - IAuthBridgeService
- **Remove parameter** authBridgeService
- **Remove auth middleware** (lines 32-34, 38)

#### types/express.d.ts:
- **Remove** the entire user property from Request interface

### Database Changes:
- Remove users table
- Remove pkce_challenges table (if exists)
- Remove any auth-related columns from other tables

### Configuration Changes:
- Remove environment variables:
  - GITHUB_CLIENT_ID
  - GITHUB_CLIENT_SECRET
  - JWT_SECRET
  - JWT_PUBLIC_KEY
  - JWT_PRIVATE_KEY
  - AUTH_REQUIRED
  - TOKEN_EXTENDED_LIFETIME

### Test File Removal:
Remove all auth-related test files:
- All files in `/server/src/middleware/__tests__/`
- All files in `/server/src/providers/auth/__tests__/`
- `/server/src/routes/__tests__/auth*.test.ts`

### Frontend Changes:
- Remove `/client/src/components/AuthTester.tsx`
- Remove `/client/src/services/authService.ts`
- Modify ChatPage.tsx to remove auth initialization
- Modify App.tsx to remove AuthTester route

## Summary

The authentication system is deeply integrated but well-isolated. The removal process involves:
1. Deleting entire auth-specific directories
2. Removing auth middleware from all routes
3. Simplifying route handler signatures
4. Removing user-specific logic from services
5. Cleaning up database schema
6. Removing frontend auth components

Key areas requiring careful attention:
- Route parameter changes (removing jwtService, userRepository)
- Request handler modifications (removing req.user checks)
- Service dependencies (LlmApiKeyManager depends on users)
- Database foreign keys referencing users table