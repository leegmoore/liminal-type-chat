# LLM Streaming Architecture Analysis

## Current State Assessment

### Domain Tier Streaming
- **Uses callbacks, NOT AsyncIterables** - This is a key architectural limitation
- ChatService.streamChatCompletion() accepts a callback function
- Each chunk updates the database and passes through the callback
- Message status tracking: `pending → streaming → complete/error`
- Provider abstraction through ILlmService interface

### Edge Tier Streaming  
- Acts as a simple pass-through for SSE conversion
- Minimal orchestration or transformation
- Clean separation but underutilized potential
- Handles client connections and SSE protocol

### Key Gaps
1. **No AsyncIterables** - Current callback approach limits composability
2. **Tight coupling** - Callbacks create dependencies between layers
3. **Limited orchestration** - Edge tier not leveraging its position
4. **No backpressure handling** - Callbacks don't manage flow control

## Vision vs Reality

### PRD Vision: AI Roundtable
- Multiple AI perspectives collaborating in real-time
- Stream multiplexing for fair scheduling between AI panelists
- Transformative "threshold" experience with real dialogue
- Platform-first design for future extensions

### Current Reality
- Single-stream, sequential responses
- No multiplexing or orchestration capabilities
- Basic SSE pass-through without transformation
- Limited to simple chat completion streaming

## Strategic Opportunities

### 1. AsyncIterable Refactor (Domain Tier)
```typescript
// Current: Callback-based
streamChatCompletion(threadId: string, prompt: string, onChunk: (chunk) => void)

// Proposed: AsyncIterable-based
async *streamChatCompletion(threadId: string, prompt: string): AsyncIterable<ChatCompletionChunk>
```

Benefits:
- Natural backpressure handling
- Composable stream transformations
- Better error propagation
- Cleaner architectural boundaries

### 2. Edge Tier Stream Orchestration
The edge tier should become a sophisticated streaming orchestration layer:

**Core Capabilities:**
- **Multiplexing**: Broadcast single stream to multiple clients
- **Transformation**: Filter, enrich, format streams
- **Buffering**: Handle slow clients without blocking
- **Aggregation**: Combine multiple streams (AI Roundtable)
- **Persistence**: Stream replay and recovery

**Implementation Pattern:**
```typescript
class StreamOrchestrator {
  // Registry for active streams
  private streams: Map<string, StreamContext>
  
  // Transform pipeline
  async *transform(stream: AsyncIterable<any>, transformers: Transformer[])
  
  // Multiplex to multiple clients
  broadcast(streamId: string, clients: Set<Client>)
  
  // Aggregate multiple AI streams
  async *roundtable(streams: AsyncIterable<any>[]): AsyncIterable<RoundtableEvent>
}
```

### 3. Generic Streaming Infrastructure
Extend streaming beyond chat completions:
- ContextThread updates (live conversation changes)
- Tool execution streams (MCP operations)
- System events (user joins, AI panelist changes)
- Platform events (cross-application notifications)

### 4. AI Roundtable Architecture
To achieve the PRD vision:

```
                     Edge Tier Orchestration
                    ┌─────────────────────┐
                    │  Stream Aggregator   │
                    │  - Fair scheduling   │
                    │  - Turn management   │
                    │  - Context sharing   │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
     ┌──────────┐      ┌──────────┐      ┌──────────┐
     │ Claude    │      │ GPT-4    │      │ Gemini   │
     │ Stream    │      │ Stream   │      │ Stream   │
     └──────────┘      └──────────┘      └──────────┘
```

## Recommended Implementation Path

### Phase 1: AsyncIterable Foundation (1-2 weeks)
1. Refactor domain tier to return AsyncIterables
2. Update ILlmService interface for async generators
3. Convert edge tier to consume AsyncIterables
4. Add basic error handling and recovery

### Phase 2: Edge Orchestration (2-3 weeks)
1. Build StreamOrchestrator with registry
2. Add transformation pipeline
3. Implement multiplexing for broadcast
4. Create buffering and backpressure handling

### Phase 3: AI Roundtable MVP (3-4 weeks)
1. Design roundtable event protocol
2. Implement stream aggregation
3. Add turn management and fair scheduling
4. Build context sharing between AI streams

### Phase 4: Platform Features (ongoing)
1. Generic streaming for all resources
2. Stream persistence and replay
3. Cross-application event streaming
4. Advanced orchestration patterns

## Technical Decisions to Make

1. **Stream Protocol**: Stick with SSE or consider WebSockets for bidirectional needs?
2. **State Management**: Where to store stream state (Redis, in-memory, database)?
3. **Error Recovery**: How to handle reconnections and partial stream replay?
4. **Performance**: Buffer sizes, chunk sizes, concurrency limits?
5. **Security**: Stream authorization, rate limiting, resource protection?

## Next Steps

1. Discuss AsyncIterable refactor approach
2. Design edge tier orchestration patterns
3. Define AI Roundtable event protocol
4. Create proof-of-concept for stream aggregation
5. Plan incremental migration strategy