# Investigation Hypotheses

## Ranked by Likelihood

### 1. Catch-all Route Intercepting API Calls (90% confidence)
**Evidence For:**
- Agent 2 found catch-all route `app.get('*', ...)` that serves React HTML
- This route would catch any request that doesn't match earlier routes
- API calls returning HTML fits this pattern perfectly

**Evidence Against:**
- None found

**Test Plan:**
- Check if exact API routes work vs slightly wrong ones
- Look at route registration order
- Test modifying catch-all to exclude /api paths

---

### 2. Route Path Duplication from My Changes (70% confidence)
**Evidence For:**
- I changed edge health routes from relative to absolute paths
- I changed app.ts to mount routes with base paths
- This could cause path duplication (e.g., /api/v1/edge/health/api/v1/edge/health)

**Evidence Against:**
- Simple routes like /api/v1/edge/health should still work

**Test Plan:**
- Check git diff to see exact changes
- Test reverting route changes
- Verify actual mounted paths

---

### 3. Static File Middleware Interference (30% confidence)
**Evidence For:**
- Static middleware serves from public directory
- Could interfere with API routes

**Evidence Against:**
- Static middleware usually doesn't catch API routes
- Would need misconfiguration

**Test Plan:**
- Check static middleware configuration
- Test disabling static serving temporarily

---

### 4. Auth Middleware Blocking (10% confidence)
**Evidence For:**
- Some routes have auth middleware

**Evidence Against:**
- BYPASS_AUTH=true should disable auth
- Health routes don't have auth middleware
- Would return 401/403 JSON, not HTML

**Test Plan:**
- Check if auth middleware is on health routes
- Test with explicit auth headers

---

### 5. Server Not Properly Started (5% confidence)
**Evidence For:**
- Could explain weird behavior

**Evidence Against:**
- Server logs show it started successfully
- Some response is coming back (HTML)

**Test Plan:**
- Restart server cleanly
- Check process and ports