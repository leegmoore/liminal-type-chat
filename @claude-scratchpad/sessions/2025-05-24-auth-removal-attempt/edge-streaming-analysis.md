# Edge Tier Streaming Analysis

## Current Architecture

### Edge Tier Responsibilities

1. **SSE Endpoint** (`/api/v1/chat/completions/stream`)
   - Receives streaming requests from clients
   - Sets up SSE headers for EventSource compatibility
   - Handles client disconnection

2. **Stream Transformation**
   - Receives LlmResponse chunks from domain ChatService via callback
   - Transforms to SSE format using `sendSseData()`
   - Manages connection lifecycle

3. **Error Handling**
   - Catches streaming errors and sends via SSE
   - Handles validation errors before SSE setup

### Domain Tier Responsibilities

1. **ChatService.streamChatCompletion()**
   - Manages conversation context and thread state
   - Calls LLM provider's streamPrompt()
   - Updates message status (streaming → complete)
   - Accumulates content for persistence

2. **LLM Provider Integration**
   - AnthropicService implements AsyncIterable streaming
   - Transforms provider-specific events to LlmResponse chunks
   - Handles token counting and metadata

### Current Flow

```
Client → Edge SSE Endpoint → ChatService → LLM Provider
   ↑                            ↓               ↓
   ←──── SSE Events ←──── Callbacks ←──── AsyncIterable
```

## Observations

### Strengths
1. Clean separation of concerns
2. Edge handles HTTP/SSE protocol details
3. Domain handles business logic and state
4. Provider abstraction for multiple LLMs

### Limitations

1. **No Multiplexing at Edge**
   - Each client connection maps 1:1 to domain stream
   - No ability to broadcast or fan-out streams

2. **Limited Edge Orchestration**
   - Edge is mostly a pass-through for streaming
   - No stream transformation or enrichment capabilities

3. **No Stream Persistence**
   - Streams are ephemeral
   - No ability to replay or resume streams

4. **Single-Purpose Streaming**
   - Only for chat completions
   - No generic streaming infrastructure

## Opportunities for Enhancement

### 1. Stream Multiplexing
```typescript
// Edge could maintain stream registry
class StreamRegistry {
  private streams: Map<string, StreamSubscribers>;
  
  broadcast(streamId: string, chunk: any) {
    this.streams.get(streamId)?.forEach(sub => sub.send(chunk));
  }
}
```

### 2. Stream Transformation Pipeline
```typescript
// Edge could transform streams
interface StreamTransformer {
  transform(chunk: ChatChunk): TransformedChunk;
}

// Apply transformations: filtering, enrichment, formatting
```

### 3. Generic Streaming Infrastructure
```typescript
// Domain returns AsyncIterables
async function* streamContextThread(id: string): AsyncIterable<ThreadUpdate> {
  // Stream thread updates, message additions, etc.
}

// Edge converts to SSE
router.get('/stream/:resourceType/:id', async (req, res) => {
  const stream = await domainClient.stream(resourceType, id);
  setupSseHeaders(res);
  for await (const chunk of stream) {
    sendSseData(res, chunk);
  }
});
```

### 4. Stream Orchestration Features

1. **Rate Limiting**: Control stream speed at edge
2. **Buffering**: Handle slow clients
3. **Replay**: Cache and replay recent chunks
4. **Aggregation**: Combine multiple domain streams
5. **Filtering**: Client-specific stream filtering

### 5. Enhanced ContextThread Streaming

Currently, domain routes don't expose streaming. Could add:

```typescript
// Domain route
router.get('/:id/stream', async (req, res) => {
  const stream = service.streamContextThread(req.params.id);
  // Return as newline-delimited JSON or other format
});

// Edge orchestration
router.get('/conversations/:id/live', async (req, res) => {
  // Combine thread updates + AI responses
  const threadStream = domainClient.streamThread(id);
  const aiStream = chatService.streamResponses(id);
  
  // Multiplex both streams to client
  setupSseHeaders(res);
  // ... orchestration logic
});
```

## Recommendations

1. **Keep Business Logic in Domain**
   - Domain should return AsyncIterables
   - Keep thread/message management in domain

2. **Enhance Edge Orchestration**
   - Add stream registry for multiplexing
   - Implement transformation pipeline
   - Add client-specific filtering

3. **Create Generic Streaming**
   - Not just for chat completions
   - Support streaming any domain resource
   - Standardize stream chunk format

4. **Add Stream Persistence**
   - Optional stream recording
   - Replay capabilities
   - Stream analytics

5. **Better Error Recovery**
   - Reconnection support
   - Partial stream recovery
   - Graceful degradation

## Next Steps

1. Design generic AsyncIterable contract for domain services
2. Implement stream registry in edge tier
3. Add transformation pipeline
4. Create streaming endpoints for other resources
5. Document streaming patterns for new features