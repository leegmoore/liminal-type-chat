# AI Assistant Regression Testing Strategy

## Problem Statement
AI assistants making changes across multiple files need a way to verify:
1. Individual changes didn't break anything
2. Integration between components still works
3. User-facing functionality remains intact
4. API contracts are maintained

## Proposed Testing Layers

```
┌─────────────────────────────────────────┐
│         E2E Tests (Playwright)          │
│   - User workflows                      │
│   - Critical paths                      │
│   - Visual regression                  │
├─────────────────────────────────────────┤
│       API Integration Tests             │
│   - HTTP endpoint testing               │
│   - Request/response validation         │
│   - Streaming verification              │
├─────────────────────────────────────────┤
│         Unit Tests (Jest)               │
│   - Service logic                       │
│   - Component behavior                  │
│   - Edge cases                          │
└─────────────────────────────────────────┘
```

## Implementation Plan

### 1. API Integration Tests

```typescript
// server/test/integration/api/conversations.test.ts
describe('Conversations API', () => {
  it('should create, list, and update conversations', async () => {
    // Create conversation
    const createRes = await api.post('/api/v1/conversations')
      .send({ title: 'Test Chat' })
      .expect(201);
    
    // List conversations
    const listRes = await api.get('/api/v1/conversations')
      .expect(200);
    expect(listRes.body.conversations).toHaveLength(1);
    
    // Add message
    const msgRes = await api.post(`/api/v1/conversations/${createRes.body.id}/messages`)
      .send({ content: 'Hello AI' })
      .expect(201);
  });
  
  it('should handle streaming responses', (done) => {
    const source = new EventSource('/api/v1/chat/completions/stream?prompt=Hello');
    source.onmessage = (event) => {
      expect(event.data).toBeDefined();
    };
    source.onerror = () => done();
  });
});
```

### 2. Playwright E2E Tests

```typescript
// e2e/tests/chat-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Workflow', () => {
  test('should complete a full conversation', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173');
    
    // Create new conversation
    await page.click('button:has-text("New Chat")');
    
    // Send message
    await page.fill('textarea[placeholder="Type your message..."]', 'Hello AI');
    await page.press('textarea', 'Enter');
    
    // Wait for AI response
    await expect(page.locator('.message.ai')).toBeVisible();
    await expect(page.locator('.message.ai')).toContainText(/.+/);
    
    // Verify conversation saved
    await page.reload();
    await expect(page.locator('.conversation-list')).toContainText('Hello AI');
  });
  
  test('should handle streaming responses', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Send message
    await page.fill('textarea', 'Tell me a story');
    await page.press('textarea', 'Enter');
    
    // Verify streaming (text appears progressively)
    const aiMessage = page.locator('.message.ai').last();
    const initialText = await aiMessage.textContent();
    await page.waitForTimeout(500);
    const laterText = await aiMessage.textContent();
    expect(laterText!.length).toBeGreaterThan(initialText!.length);
  });
});
```

### 3. Quick Smoke Tests

```bash
#!/bin/bash
# server/scripts/smoke-test.sh

echo "🧪 Running smoke tests..."

# Check server health
curl -f http://localhost:8765/health || exit 1

# Test basic API flow
CONVERSATION_ID=$(curl -s -X POST http://localhost:8765/api/v1/conversations \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke Test"}' | jq -r '.id')

if [ -z "$CONVERSATION_ID" ]; then
  echo "❌ Failed to create conversation"
  exit 1
fi

# Test message creation
curl -f -X POST "http://localhost:8765/api/v1/conversations/$CONVERSATION_ID/messages" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test message"}' || exit 1

echo "✅ Smoke tests passed!"
```

### 4. AI Assistant Commands

```typescript
// Add to CLAUDE.md
- **!test:api** → Run API integration tests
- **!test:e2e** → Run Playwright E2E tests
- **!test:smoke** → Quick smoke test (< 30s)
- **!test:all** → Run all test suites
- **!check** → Enhanced to include smoke tests

// Implementation
const runRegressionTests = async () => {
  // 1. Unit tests (existing)
  await exec('npm run test:coverage');
  
  // 2. API tests
  await exec('npm run test:api');
  
  // 3. Quick smoke test
  await exec('./scripts/smoke-test.sh');
  
  // 4. E2E tests (if not in CI)
  if (!process.env.CI) {
    await exec('npm run test:e2e');
  }
};
```

### 5. Test Data Management

```typescript
// test/fixtures/test-data.ts
export const testData = {
  users: [
    { id: 'test-user-1', email: 'test@example.com' }
  ],
  conversations: [
    { 
      id: 'test-conv-1',
      title: 'Test Conversation',
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ]
    }
  ]
};

// Reset function for tests
export async function resetTestData() {
  await db.exec('DELETE FROM context_threads WHERE id LIKE "test-%"');
  await db.exec('DELETE FROM messages WHERE thread_id LIKE "test-%"');
}
```

## Benefits for AI Assistants

1. **Confidence in Changes**: Run `!test:smoke` after each change
2. **Catch Integration Issues**: API tests verify component interactions
3. **User Experience Validation**: E2E tests ensure UI still works
4. **Quick Feedback**: Smoke tests run in seconds
5. **Regression Prevention**: Full suite catches subtle breaks

## Implementation Priority

1. **Phase 1**: API integration tests (1-2 days)
   - Cover all major endpoints
   - Test streaming endpoints
   - Validate error handling

2. **Phase 2**: Playwright setup (1 day)
   - Basic workflow tests
   - Critical path coverage
   - CI integration

3. **Phase 3**: Smoke tests (few hours)
   - Health checks
   - Basic CRUD operations
   - Quick validation script

4. **Phase 4**: AI command integration
   - Update CLAUDE.md
   - Enhance !check command
   - Add test result parsing

## Example Workflow for AI

```bash
# AI makes changes to conversation handling
ai: "I've updated the conversation routes and service..."

# AI runs regression tests
!test:smoke  # Quick validation (30s)
✅ All smoke tests passed

!test:api    # Deeper validation (2-3 min)
✅ 47 API tests passed

# If critical changes
!test:e2e    # Full validation (5-10 min)
✅ All E2E scenarios passed

# AI confident in changes
ai: "All regression tests pass. The changes are working correctly."
```