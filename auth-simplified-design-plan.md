# Auth Simplification Design Plan
## From Complex OAuth to Simple Local Auth

### Executive Summary

This plan outlines a two-phase approach to simplify authentication in Liminal Type Chat:
1. **Phase 1**: Complete removal of existing auth system (app works without auth)
2. **Phase 2**: Implement simple email/password auth with local session management

**Rationale**: After extensive analysis, WorkOS AuthKit presents unacceptable vendor lock-in risks and contradicts the local-first philosophy. The current OAuth implementation is over-engineered for a "bring your own API key" application.

### Current State Analysis

The existing auth system includes:
- 29 files in `/providers/auth/` to be removed
- 20 auth test files
- Complex OAuth flow with PKCE
- JWT management with key rotation
- AuthBridge service for tier transitions
- 365+ lines of code just in AuthBridgeService

This complexity is unjustified for an app where users simply need to securely store their API keys.

---

## Phase 1: Complete Auth Removal

### Goal
Remove all authentication code while maintaining a functional application. All tests must pass, lint must pass.

### Step 1: Remove Auth Middleware from Routes

**Files to modify:**
1. `server/src/app.ts`
   - Remove auth route imports (line ~35)
   - Remove `/api/v1/auth` route mounting
   - Keep security headers middleware

2. `server/src/routes/edge/conversation.ts`
   - Remove `requireEdgeAuth` from all routes
   - Replace `getUserFromAuthToken(authToken)` with mock user:
   ```typescript
   const mockUser = { id: 'local-user', email: 'user@local', tier: 'free' };
   ```

3. `server/src/routes/edge/chat.ts`
   - Remove `requireEdgeAuth` from routes
   - Use same mock user approach

4. `server/src/routes/edge/api-keys.ts`
   - Remove `requireEdgeAuth`
   - Use mock userId for API key association

5. `server/src/routes/domain/context-thread.ts`
   - Remove `requireDomainAuth` from routes
   - Update to use mock auth context

### Step 2: Delete Auth-Related Files

**Directories to remove entirely:**
```bash
rm -rf server/src/providers/auth/
rm -rf server/src/middleware/__tests__/*auth*.test.ts
rm -f server/src/middleware/auth-middleware.ts
rm -f server/src/middleware/auth-utils.ts
rm -f server/src/middleware/domain-auth-middleware.ts
rm -f server/src/middleware/domain-auth-utils.ts
rm -f server/src/routes/__tests__/auth*.test.ts
rm -f server/src/routes/edge/auth.ts
```

**Frontend files to remove:**
```bash
rm -f client/src/components/AuthTester.tsx
rm -f client/src/services/authService.ts
```

### Step 3: Update Remaining Files

**server/src/middleware/index.ts**
- Remove auth middleware exports

**client/src/App.tsx**
- Remove AuthTester route import and usage

**client/src/pages/ChatPage.tsx**
- Remove guest login initialization (lines 111-140)
- Simplify to direct API usage

### Step 4: Environment Variable Cleanup

Remove from `.env` files:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `AUTH_REQUIRED`
- `SECURE_COOKIES`

### Step 5: Database Schema Updates

Drop auth-related tables:
```sql
DROP TABLE IF EXISTS pkce_challenges;
-- Keep users table for now, will repurpose in Phase 2
```

### Step 6: Update Tests

Remove all auth-related test files (20 files identified).

Update integration tests to work without auth:
- Remove auth headers from test requests
- Update expectations to not require auth

### Step 7: Verification

Run full test suite:
```bash
cd server && npm test
cd client && npm test
```

Run lint:
```bash
cd server && npm run lint
cd client && npm run lint
```

Start application and verify:
- Health endpoints work
- Can create/retrieve conversations
- Can send chat messages
- No auth errors in console

---

## Phase 2: Simple Auth Implementation

### Goal
Implement minimal email/password authentication that aligns with local-first principles.

### Design Principles
- No external dependencies (no OAuth providers)
- Simple session management (no JWT complexity)
- User data stays local
- API keys encrypted with user's password
- Minimal code to maintain

### Step 1: Database Schema

```sql
-- Repurpose existing users table
ALTER TABLE users 
  ADD COLUMN password_hash TEXT,
  ADD COLUMN salt TEXT,
  DROP COLUMN github_id,
  DROP COLUMN github_username;

-- Simple sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for session cleanup
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### Step 2: Auth Service Implementation

**server/src/services/core/SimpleAuthService.ts**
```typescript
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export class SimpleAuthService {
  async register(email: string, password: string): Promise<User> {
    // Check if user exists
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new ConflictError('Email already registered');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create user
    const user = {
      id: crypto.randomUUID(),
      email,
      passwordHash,
      salt,
      createdAt: Date.now()
    };
    
    await this.userRepo.create(user);
    return user;
  }
  
  async login(email: string, password: string): Promise<Session> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid credentials');
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');
    
    // Create session
    const session = {
      id: crypto.randomUUID(),
      userId: user.id,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: Date.now()
    };
    
    await this.sessionRepo.create(session);
    return session;
  }
  
  async validateSession(sessionId: string): Promise<User | null> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session || session.expiresAt < Date.now()) return null;
    
    return await this.userRepo.findById(session.userId);
  }
}
```

### Step 3: Simple Auth Middleware

**server/src/middleware/simple-auth.ts**
```typescript
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const user = await authService.validateSession(sessionId);
  if (!user) {
    res.clearCookie('sessionId');
    return res.status(401).json({ error: 'Session expired' });
  }
  
  req.user = user;
  next();
}
```

### Step 4: Auth Routes

**server/src/routes/edge/simple-auth.ts**
```typescript
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await authService.register(email, password);
    const session = await authService.login(email, password);
    
    res.cookie('sessionId', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const session = await authService.login(email, password);
    const user = await userRepo.findByEmail(email);
    
    res.cookie('sessionId', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

router.post('/logout', (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    sessionRepo.delete(sessionId);
  }
  
  res.clearCookie('sessionId');
  res.json({ success: true });
});

router.get('/session', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email } });
});
```

### Step 5: API Key Encryption

Encrypt API keys using the user's password-derived key:

```typescript
export class ApiKeyService {
  async encryptApiKey(userId: string, provider: string, apiKey: string, password: string): Promise<void> {
    // Derive encryption key from password
    const salt = crypto.randomBytes(32);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    
    // Encrypt API key
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    // Store encrypted key
    await this.apiKeyRepo.save({
      userId,
      provider,
      encryptedKey: encrypted,
      authTag: authTag.toString('hex'),
      iv: iv.toString('hex'),
      salt: salt.toString('hex')
    });
  }
  
  async decryptApiKey(userId: string, provider: string, password: string): Promise<string> {
    const stored = await this.apiKeyRepo.findByUserAndProvider(userId, provider);
    if (!stored) throw new NotFoundError('API key not found');
    
    // Derive key from password
    const key = crypto.pbkdf2Sync(
      password, 
      Buffer.from(stored.salt, 'hex'), 
      100000, 
      32, 
      'sha256'
    );
    
    // Decrypt
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(stored.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(stored.authTag, 'hex'));
    
    let decrypted = decipher.update(stored.encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### Step 6: Frontend Updates

**Simple auth service:**
```typescript
// client/src/services/simpleAuth.ts
export const authService = {
  async register(email: string, password: string) {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },
  
  async login(email: string, password: string) {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },
  
  async logout() {
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  },
  
  async getSession() {
    const res = await fetch('/api/v1/auth/session', {
      credentials: 'include'
    });
    
    if (!res.ok) return null;
    return res.json();
  }
};
```

**Simple login component:**
```tsx
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await authService.login(email, password);
      window.location.href = '/chat';
    } catch (error) {
      alert('Login failed');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Step 7: Testing

Create minimal tests for:
- Registration flow
- Login/logout
- Session validation
- API key encryption/decryption

### Step 8: Migration for Existing Users

1. Export existing user emails
2. Send password reset emails
3. Users set password on first login
4. Migrate their API keys using new password

---

## Timeline Estimate

### Phase 1: Auth Removal (2-3 days)
- Day 1: Remove middleware, update routes
- Day 2: Delete files, update tests
- Day 3: Verify everything works, fix issues

### Phase 2: Simple Auth (3-4 days)
- Day 1: Database schema, auth service
- Day 2: Auth routes, middleware
- Day 3: Frontend components
- Day 4: Testing and migration plan

**Total: 5-7 days** to completely replace auth with a simple, maintainable solution.

---

## Benefits of This Approach

1. **Aligned with Philosophy**: Local-first, no external dependencies
2. **Maintainable**: ~200 lines of code vs 2000+
3. **Secure**: Standard bcrypt + AES encryption
4. **User Control**: Their password encrypts their API keys
5. **No Vendor Lock-in**: Everything runs locally
6. **Fast**: No network calls for auth

## Risks and Mitigations

1. **Password Reset**: Implement email-based reset flow
2. **Session Security**: Use secure cookies, HTTPS in production
3. **Brute Force**: Add rate limiting to login endpoint
4. **Key Recovery**: If user forgets password, API keys are lost (document this clearly)

## Conclusion

This plan removes unnecessary complexity and implements auth that matches the application's local-first philosophy. Users maintain control of their data, there's no vendor lock-in, and the maintenance burden is minimal. The sophisticated OAuth system can be preserved as a learning resource or template without impacting the production application.