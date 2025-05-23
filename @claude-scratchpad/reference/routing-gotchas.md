# Routing Gotchas

## Express Route Mounting Patterns

### Edge Routes Pattern
- Routes define **full paths** in the route files
- Mounted **without** base path in app.ts
- Example:
  ```js
  // In edge/health.ts
  router.get('/api/v1/edge/health', handler)
  
  // In app.ts
  app.use(createEdgeHealthRoutes())
  ```

### Domain Routes Pattern  
- Routes define **relative paths** in the route files
- Mounted **with** base path in app.ts
- Example:
  ```js
  // In domain/health.ts
  router.get('/', handler)
  
  // In app.ts
  app.use('/api/v1/domain/health', createHealthRoutes())
  ```

### Catch-All Route
- The `app.get('*', ...)` catch-all for React must be **last**
- It will intercept any unmatched routes and serve HTML
- This is why incorrect API routes return HTML instead of 404 JSON

## Key Learning
Don't assume route mounting patterns are consistent across the codebase. Always check how existing routes are structured before making changes.