# Automated Testing Strategy

## Overview

This document outlines our comprehensive testing strategy for the Liminal Type Chat platform. Our approach balances traditional testing pyramid principles with modern patterns that address the unique challenges of AI-assisted development and streaming architectures.

## Core Testing Philosophy

### 1. **Vertical Slices Over Horizontal Layers**
We prioritize testing complete features end-to-end rather than testing each architectural layer in isolation. This prevents "integration drift" where perfectly unit-tested components fail when connected.

### 2. **Purpose-Driven Test Suites**
Tests are organized by their purpose (smoke, regression, critical path) rather than just by their technical tier. This allows us to run the right tests at the right time.

### 3. **Tests as Specifications**
Tests serve as executable specifications, particularly important for AI-assisted development where tests become the primary communication protocol between human intent and AI implementation.

## Testing Tiers

### Unit Tests (60% of tests)
**Purpose**: Verify business logic and component behavior in isolation

**Scope**:
- Service methods and business rules
- Data transformations and validations
- Error handling and edge cases
- Utility functions

**Example**:
```typescript
describe('ContextThreadService', () => {
  it('should validate thread title length', () => {
    expect(() => service.createThread({ title: 'x'.repeat(256) }))
      .toThrow(ValidationError);
  });
});
```

**Coverage Requirements**:
- Domain services: 90% coverage
- Utilities: 85% coverage
- Error paths: 100% coverage

### Integration Tests (30% of tests)
**Purpose**: Verify component interactions and API contracts

**Scope**:
- API endpoint behavior
- Service-to-repository interactions
- External service integrations
- Database operations

**Example**:
```typescript
describe('Conversations API', () => {
  it('should create and retrieve conversation', async () => {
    const res = await request(app)
      .post('/api/v1/conversations')
      .send({ title: 'Test' })
      .expect(201);
    
    await request(app)
      .get(`/api/v1/conversations/${res.body.id}`)
      .expect(200);
  });
});
```

**Coverage Requirements**:
- All public API endpoints
- Critical integration points
- Error response formats

### E2E Tests (10% of tests)
**Purpose**: Verify critical user journeys work end-to-end

**Scope**:
- Core business workflows
- Critical user paths
- Cross-component features

**Example**:
```typescript
test('user can have AI conversation', async ({ page }) => {
  await page.goto('/');
  await page.click('text=New Chat');
  await page.fill('textarea', 'Hello AI');
  await page.press('textarea', 'Enter');
  await expect(page.locator('.ai-message')).toBeVisible();
});
```

**Coverage Requirements**:
- 2-3 critical user journeys
- Happy path for core features
- Basic error recovery

## Purpose-Driven Test Suites

### Smoke Tests (5 minutes runtime)
**Purpose**: Quick validation that system is basically functional

**Composition**:
- Server health check (unit)
- Database connectivity (integration)
- Create conversation (integration)
- Homepage loads (e2e)

**Usage**:
- Pre-deployment validation
- Environment gate checks
- Post-deployment verification

**Implementation**:
```bash
npm run test:smoke
# Runs tests tagged with @smoke across all tiers
```

### Regression Tests (Variable runtime)
**Purpose**: Ensure previously fixed bugs remain fixed

**Composition**:
- Tests added when bugs are fixed
- Tests from any tier that caught real issues
- Focused on historically problematic areas

**Example**:
```typescript
it('handles null messages without crashing @regression', () => {
  // This test added after bug #145
  const thread = { messages: null };
  expect(() => normalizeMessages(thread)).not.toThrow();
});
```

**Usage**:
- Run before releases
- Run after significant changes
- Part of CI/CD pipeline

### Critical Path Tests (10 minutes runtime)
**Purpose**: Verify core business value is preserved

**Composition**:
- User can chat with AI (e2e)
- Conversations persist (integration)
- Streaming works (integration)
- AI responses are coherent (unit)

**Usage**:
- Pre-release validation
- Major refactoring safety net
- Production monitoring

## Special Considerations

### Streaming and Real-Time Features

**Deterministic Testing**:
```typescript
class TestTimeProvider {
  advance(ms: number) { /* controlled time */ }
}

// Test timeouts deterministically
const stream = new StreamProcessor(testTimeProvider);
stream.setTimeout(5000);
testTimeProvider.advance(5001);
expect(stream.isTimedOut()).toBe(true);
```

**Progressive Response Validation**:
- Test partial responses are valid
- Verify streaming integrity
- Handle backpressure scenarios

### AI-Assisted Development Support

**Test Granularity**:
- Not too small (myopic view)
- Not too large (overwhelming)
- Focus on complete behavior units

**Progressive Complexity**:
1. Happy path first
2. Edge cases second
3. Error scenarios third
4. Complex interactions last

## Test Organization

```
tests/
├── unit/                 # Fast, isolated tests
│   ├── services/
│   ├── utils/
│   └── domain/
├── integration/          # Component interaction tests
│   ├── api/
│   ├── database/
│   └── streaming/
├── e2e/                  # User journey tests
│   ├── chat-workflow.spec.ts
│   └── streaming.spec.ts
└── fixtures/             # Shared test data
    ├── test-data.ts
    └── test-harness.ts
```

## Continuous Integration Strategy

### On Every Commit
1. Unit tests (all)
2. Smoke tests
3. Affected integration tests

### On Pull Request
1. All unit tests
2. All integration tests
3. Smoke tests
4. Critical path tests

### Pre-Release
1. Full test suite
2. E2E tests
3. Performance benchmarks
4. Manual exploratory testing

## Metrics and Goals

### Speed Targets
- Unit tests: < 30 seconds
- Integration tests: < 3 minutes
- E2E tests: < 5 minutes
- Smoke tests: < 1 minute

### Coverage Targets
- Overall: 80% line coverage
- Domain layer: 90% coverage
- Critical paths: 100% coverage
- New code: 85% coverage

### Reliability Targets
- Test flakiness: < 1%
- False positives: < 0.1%
- Test maintenance time: < 10% of dev time

## Anti-Patterns to Avoid

1. **Testing Implementation Details**: Test behavior, not internals
2. **Excessive Mocking**: Prefer real integrations where feasible
3. **Test Interdependence**: Each test should be independent
4. **Ignoring Test Maintenance**: Refactor tests with code
5. **Coverage Worship**: Quality over quantity

## Future Considerations

### AI Roundtable Testing
- Multi-agent conversation verification
- Turn-taking and fairness testing
- Context propagation validation

### Platform Expansion
- Cross-application test suites
- Shared component testing
- Performance regression detection

## Conclusion

This testing strategy provides a robust framework for maintaining quality while enabling rapid development. By combining traditional testing pyramid principles with modern patterns like vertical slicing and purpose-driven suites, we create a testing approach that supports both human developers and AI assistants in building reliable, maintainable software.