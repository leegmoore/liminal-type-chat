# NPM Commands Quick Reference

## 🚨 ALWAYS USE THESE COMMANDS - NO EXCEPTIONS

### Testing Commands
```bash
# Run all tests
cd server && npm test
cd client && npm test

# Check coverage (with thresholds)
cd server && npm run test:coverage
cd client && npm run test:coverage

# Run specific test file
cd server && npm test -- conversation.test.ts
cd server && npm test -- --testPathPattern=conversation

# Run tests in watch mode
cd server && npm test -- --watch
```

### Development Commands
```bash
# Start development servers
npm run dev                    # Both client and server
cd server && npm run dev       # Server only (port 8765)
cd client && npm start         # Client only (port 5173)

# Linting
cd server && npm run lint
cd client && npm run lint

# Server management
cd server && npm run stop      # Stop server
cd server && npm run restart   # Restart server
cd server && npm run dev:log   # Start with logging
cd server && npm run log       # View logs
```

### API Testing
```bash
# Use the built-in API test script
npm run api -- /endpoint
npm run api -- /endpoint '{"data": "value"}'
npm run api -- /endpoint -H "Authorization: Bearer token"
```

## ❌ NEVER DO THIS
```bash
# DON'T create custom commands like:
jest --coverage --coverageDirectory=./coverage
npx jest --detectOpenHandles
find . -name "*.test.ts" | xargs jest
curl -X POST http://localhost:8765/api/v1/endpoint

# DO use npm scripts instead:
npm run test:coverage
npm test
npm test -- *.test.ts
npm run api -- /api/v1/endpoint '{"data": "value"}'
```

## Coverage Thresholds
- **Domain Services**: 90% required
- **Edge Routes**: 75% required
- Always check with: `npm run test:coverage`