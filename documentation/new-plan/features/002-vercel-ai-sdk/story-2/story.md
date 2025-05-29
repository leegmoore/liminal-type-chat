# Story 2: Edge API Messages Support

## Objective
Extend the Edge API to support the new messages format while maintaining backward compatibility with prompt-only requests.

## Success Criteria
- [ ] Edge API accepts both prompt and messages formats
- [ ] Request validation enforces oneOf constraint
- [ ] Transforms Edge format to Domain format correctly
- [ ] Error responses follow Edge API conventions
- [ ] OpenAPI spec updated and validated

## E2E Test Scenario
```typescript
// Test: External client sends messages array through Edge to Domain
// Client → Edge → Domain → Edge → Client

describe('E2E: Edge API Messages Support', () => {
  it('should handle conversation with system prompt', async () => {
    // Given: A conversation with system prompt and user message
    // When: POST /api/v1/llm/prompt with messages array
    // Then: Response reflects system prompt influence
    // And: Token usage includes all messages
  });
});
```

## TDD Unit Test Conditions

### Edge Route Tests
1. **Request Validation**
   - WHEN request has prompt only THEN passes validation
   - WHEN request has messages only THEN passes validation
   - WHEN request has both prompt and messages THEN returns 400 error
   - WHEN request has neither THEN returns 400 error
   - WHEN messages array is empty THEN returns 400 error

2. **Message Validation**
   - WHEN message missing role THEN returns 400 error
   - WHEN message missing content THEN returns 400 error
   - WHEN role not in ["system", "user", "assistant"] THEN returns 400 error
   - WHEN content is empty string THEN returns 400 error

3. **Provider Handling**
   - WHEN provider not specified THEN uses default from config
   - WHEN provider specified THEN passes to Domain
   - WHEN provider invalid THEN returns 400 error

### Transform Tests
1. **Request Transform (Edge → Domain)**
   - WHEN Edge has prompt THEN Domain gets prompt
   - WHEN Edge has messages THEN Domain gets messages
   - WHEN Edge has provider THEN Domain gets provider

2. **Response Transform (Domain → Edge)**
   - No changes needed - response format stays the same

## TDD Integration Test Conditions

### Edge API Tests
1. **Simple Prompt Mode**
   - WHEN POST /api/v1/llm/prompt with prompt THEN works as before
   - WHEN prompt exceeds maxLength THEN returns 400

2. **Messages Mode**
   - WHEN POST with valid messages THEN processes successfully
   - WHEN messages contain conversation history THEN maintains context
   - WHEN system prompt provided THEN influences response style

3. **Error Scenarios**
   - WHEN Domain returns ProviderNotConfiguredError THEN Edge returns 400
   - WHEN Domain returns ProviderApiError THEN Edge returns 502
   - WHEN Domain times out THEN Edge returns 504

## Implementation Guide

### Phase 1: Setup (Red)
1. Write failing tests for all validation conditions
2. Write integration tests expecting messages support
3. Tests fail with "not implemented" or validation errors

### Phase 2: Implementation (Green)
1. Update request validation middleware
2. Extend route handler to support messages
3. Update OpenAPI spec and regenerate types
4. Implement error mapping for new error codes

### Phase 3: Refactor
1. Extract validation logic to separate functions
2. Improve error messages for better DX
3. Add request/response logging

## File Structure
```
server/src/
├── routes/
│   └── edge/
│       ├── chat-routes.ts           # Update validation & handler
│       └── transformers/
│           └── llm-transformers.ts  # Update if needed
├── schemas/
│   └── edge/
│       └── ChatCompletionRequest.json  # Already updated
└── middleware/
    └── validation.ts                # Update for oneOf
```

## OpenAPI Updates
```yaml
# edge-api.yaml
/api/v1/llm/prompt:
  post:
    requestBody:
      content:
        application/json:
          schema:
            oneOf:
              - required: [prompt]
                properties:
                  prompt:
                    type: string
              - required: [messages]
                properties:
                  messages:
                    type: array
```

## Notes
- Validation errors must be descriptive for good DX
- Keep prompt mode as primary for backward compatibility
- Log warnings when both prompt and messages provided
- Consider adding examples to OpenAPI spec