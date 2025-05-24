# Authentication Provider Architecture Analysis

## Directory Structure

```
/server/src/providers/auth/
├── IOAuthProvider.ts                # OAuth provider interface
├── OAuthProviderFactory.ts          # Factory for OAuth providers
├── index.ts                         # Export aggregator
├── bridge/                          # AuthBridge service layer
│   ├── AuthBridgeService.ts
│   ├── AuthBridgeServiceFactory.ts
│   └── IAuthBridgeService.ts
├── github/                          # GitHub OAuth implementation
│   └── GitHubOAuthProvider.ts
├── jwt/                             # JWT token management
│   ├── IJwtService.ts
│   ├── JwtService.ts
│   ├── EnhancedJwtService.ts
│   ├── JwtServiceFactory.ts
│   └── JwtKeyManager.ts
└── pkce/                            # PKCE implementation
    ├── PkceUtils.ts
    ├── PkceStorage.ts
    ├── DatabasePkceStorage.ts
    └── PkceStorageFactory.ts
```

## Analysis Plan

1. OAuth Provider Interfaces and Implementations
2. JWT Service Architecture
3. PKCE Implementation Details
4. AuthBridge Service Complexity
5. Security/Encryption Integration
6. Database Dependencies
7. External NPM Packages

## 1. OAuth Provider Architecture

### Core Interfaces

**IOAuthProvider.ts**
- Defines the common interface for all OAuth providers
- Key interfaces:
  - `OAuthUserProfile`: User data returned after OAuth authentication
  - `PkceOptions`: PKCE parameters (code challenge, method)
  - `IOAuthProvider`: Main interface with methods:
    - `getAuthorizationUrl()`: Generate OAuth authorization URL
    - `exchangeCodeForToken()`: Exchange code for tokens and user profile
    - `refreshAccessToken()`: Refresh expired tokens
    - `validateAccessToken()`: Check token validity
    - `revokeToken()`: Revoke tokens

### GitHub OAuth Implementation

**GitHubOAuthProvider.ts**
- Implements `IOAuthProvider` for GitHub OAuth
- Features:
  - PKCE support (`supportsPkce: true`)
  - Default scopes: `['read:user', 'user:email']`
  - Handles GitHub's unique token behavior (no expiration by default)
  - Makes API calls to GitHub endpoints for:
    - Authorization: `https://github.com/login/oauth/authorize`
    - Token exchange: `https://github.com/login/oauth/access_token`
    - User profile: `https://api.github.com/user`
    - Email retrieval: `https://api.github.com/user/emails`

### Factory Pattern

**OAuthProviderFactory.ts**
- Creates OAuth provider instances based on provider type
- Currently supports GitHub, with placeholders for Google/Microsoft

## 2. JWT Service Architecture

### Core Components

**IJwtService.ts**
- Interface defining JWT operations
- Key types:
  - `TokenPayload`: User data to encode in JWT (userId, email, scopes, tier)
  - `VerifiedToken`: Decoded token with metadata
  - `TokenOptions`: Generation options (expiration, algorithm)

**JwtService.ts**
- Basic JWT implementation using `jsonwebtoken` library
- Uses HMAC with shared secret from `JWT_SECRET` env var
- Default expiration: 30 minutes
- Maps user data to JWT claims (sub, email, scopes, tier)

**EnhancedJwtService.ts**
- Advanced implementation with RSA key pairs
- Uses `JwtKeyManager` for key management
- Supports key rotation and environment-specific keys
- RS256 algorithm (asymmetric cryptography)

**JwtKeyManager.ts**
- Manages RSA key pairs for JWT signing/verification
- Features:
  - Environment-specific keys (dev/prod isolation)
  - Key rotation support (current/previous keys)
  - Secure storage using `SecureStorage`
  - 2048-bit RSA key generation
  - Key naming convention: `jwt_keys_{environment}_{suffix}`

## 3. PKCE Implementation

### Core Utilities

**PkceUtils.ts**
- RFC 7636 compliant PKCE implementation
- Functions:
  - `generateCodeVerifier()`: Create random 43-128 char verifier
  - `generateCodeChallenge()`: Create SHA256 hash of verifier
  - `verifyCodeChallenge()`: Validate challenge matches verifier
- Uses crypto module for secure randomness

### Storage Layer

**PkceStorage.ts**
- In-memory storage interface and implementation
- Stores PKCE session data with TTL (10 min default)
- Key data structure: `PkceAuthData`
  - state, codeVerifier, codeChallenge, redirectUri, createdAt

**DatabasePkceStorage.ts**
- Persistent SQLite-based storage
- Environment-specific tables: `pkce_sessions_{environment}`
- Schema:
  ```sql
  CREATE TABLE pkce_sessions_* (
    id TEXT PRIMARY KEY,           -- state parameter
    code_verifier TEXT NOT NULL,
    code_challenge TEXT NOT NULL,
    code_challenge_method TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )
  ```

## 4. AuthBridge Service

**Purpose**: Bridges authentication between Edge and Domain tiers

### Key Features

**AuthBridgeService.ts**
- Token validation and generation for tier transitions
- Token caching for performance (5 min TTL)
- Scope mapping: Edge scopes → Domain scopes
- Environment-aware token expiration:
  - Production: Edge 1hr, Domain 30min
  - Development: Edge 24hr, Domain 12hr
- Security checks:
  - Tier validation (edge vs domain)
  - User existence verification
  - Scope permission checking

### Interfaces

**IAuthBridgeService.ts**
- `EdgeAuthContext`: Edge tier auth data
- `DomainAuthContext`: Domain tier auth data (includes sourceTokenId)
- Methods:
  - `validateEdgeToken()`: Verify edge tokens
  - `generateDomainToken()`: Create domain tokens from edge context
  - `validateDomainToken()`: Verify domain tokens

## 5. Security/Encryption Services

### Encryption Service

**encryption-service.ts**
- AES-256-GCM authenticated encryption
- Key management:
  - Production: Base64-encoded 256-bit key from env
  - Development: Predictable key for testing
- Operations:
  - `encryptSensitiveData()`: Encrypt with IV + auth tag
  - `decryptSensitiveData()`: Decrypt and verify
  - `generateEncryptionKey()`: Utility for key generation

### Secure Storage

**secure-storage.ts**
- Wrapper around EncryptionService for key-value storage
- Features:
  - API key encryption/decryption
  - In-memory storage (Map)
  - Log sanitization (redacts sensitive patterns)
- Sensitive patterns detected:
  - API keys: `sk-*`, `key-*`, `api-key-*`
  - Tokens: `access-token-*`, `token-*`
  - Secrets: `secret-*`

## 6. Database Schema

### Users Table

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,           -- UUID v4
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    created_at INTEGER NOT NULL,   -- Unix epoch ms
    updated_at INTEGER NOT NULL,
    
    -- JSON columns for flexible storage
    auth_providers TEXT DEFAULT '{}',  -- OAuth provider data
    api_keys TEXT DEFAULT '{}',        -- Encrypted API keys
    preferences TEXT DEFAULT '{}'
);
```

### JSON Structure Examples

**auth_providers**:
```json
{
  "github": {
    "providerId": "123456",
    "identity": "username",
    "refreshToken": "encrypted-token",
    "updatedAt": 1234567890
  }
}
```

**api_keys**:
```json
{
  "openai": {
    "key": "encrypted-api-key",
    "label": "Personal Key",
    "createdAt": 1234567890,
    "lastUsed": 1234567890
  }
}
```

## 7. NPM Dependencies

### Core Auth Dependencies

- **jsonwebtoken** (^9.0.2): JWT token generation/verification
- **axios** (^1.9.0): HTTP client for OAuth API calls
- **uuid** (^11.1.0): UUID generation for tokens/sessions
- **cookie-parser** (^1.4.7): Parse cookies for auth tokens

### Security Dependencies

- **helmet** (^7.1.0): Security headers
- **cors** (^2.8.5): CORS configuration
- **express-rate-limit** (^7.1.1): Rate limiting
- **crypto** (built-in): Encryption, hashing, random generation

### Database

- **better-sqlite3** (^11.10.0): SQLite for PKCE storage

## Summary

The authentication system is highly complex with multiple layers:

1. **OAuth Layer**: Provider abstraction with GitHub implementation
2. **JWT Layer**: Two implementations (basic & enhanced with RSA)
3. **PKCE Layer**: Full RFC 7636 implementation with persistent storage
4. **AuthBridge Layer**: Tier transition and token management
5. **Security Layer**: AES-256-GCM encryption for sensitive data
6. **Database Layer**: Users table with JSON columns, PKCE sessions

This represents significant complexity that could be simplified by:
- Removing OAuth/PKCE entirely
- Using a simpler JWT implementation
- Eliminating the AuthBridge tier separation
- Removing encryption services if not storing sensitive data
