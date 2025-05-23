# Files that need fixing

Files that call createConversationRoutes() without parameters:
1. src/routes/edge/__tests__/conversation.coverage.test.ts
2. src/routes/edge/__tests__/conversation.validation.test.ts  
3. test/unit/routes/edge/conversation-routes-edge-cases.test.ts
4. test/integration/routes/edge/conversation-validation-flow.test.ts

Each needs:
1. Import IJwtService and IUserRepository
2. Add auth middleware mock
3. Create mock services in beforeEach
4. Pass mocks to createConversationRoutes