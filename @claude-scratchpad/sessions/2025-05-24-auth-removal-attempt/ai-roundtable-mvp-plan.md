# AI Roundtable MVP Implementation Plan

## Current State vs. MVP Requirements

### Current State
- Single provider (Anthropic/Claude)
- Callback-based streaming (not AsyncIterable)
- No stream multiplexing
- Basic SSE implementation

### MVP Requirements
- 3+ LLM providers (Claude, GPT-4, Gemini)
- Robust streaming with proper error handling
- Stream orchestration for multiple AI responses
- Fair scheduling between AI participants

## Decision: Vercel AI SDK for Provider Management

### Why Vercel AI SDK Makes Sense Now

1. **Rapid Multi-Provider Support**
```typescript
// Current: Build each provider from scratch
class OpenAIService implements ILlmService { /* 200+ lines */ }
class GeminiService implements ILlmService { /* 200+ lines */ }

// With Vercel AI SDK: Done in minutes
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
```

2. **Built-in Streaming Robustness**
- Automatic retries
- Error recovery
- Backpressure handling
- Consistent stream format

3. **Time to MVP**
- Without SDK: 3-4 weeks (build each provider)
- With SDK: 1-2 weeks (focus on orchestration)

## Implementation Strategy

### Phase 1: Provider Integration (Week 1)

1. **Install Vercel AI SDK**
```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
```

2. **Create Unified Provider Adapter**
```typescript
// providers/llm/vercel-ai/VercelAIAdapter.ts
class VercelAIAdapter implements ILlmService {
  constructor(private provider: 'anthropic' | 'openai' | 'google') {}
  
  async *streamPrompt(prompt: string, options: LlmOptions) {
    const model = this.getModel(this.provider, options.modelId);
    const stream = await streamText({
      model,
      messages: [{ role: 'user', content: prompt }],
    });
    
    for await (const chunk of stream.textStream) {
      yield chunk;
    }
  }
}
```

3. **Update LlmServiceFactory**
```typescript
// Support for all providers through single adapter
const providers = {
  anthropic: new VercelAIAdapter('anthropic'),
  openai: new VercelAIAdapter('openai'),
  google: new VercelAIAdapter('google'),
};
```

### Phase 2: Streaming Architecture (Week 1-2)

1. **Convert to AsyncIterables in Domain**
```typescript
// services/core/ChatService.ts
async *streamChatCompletion(
  threadId: string,
  prompt: string,
  provider: LlmProvider
): AsyncIterable<ChatCompletionChunk> {
  const llmService = this.factory.getService(provider);
  
  for await (const chunk of llmService.streamPrompt(prompt)) {
    yield {
      threadId,
      content: chunk,
      provider,
      // ...
    };
  }
}
```

2. **Edge Tier Stream Orchestrator**
```typescript
// routes/edge/roundtable/StreamOrchestrator.ts
class StreamOrchestrator {
  async *orchestrateRoundtable(
    prompt: string,
    participants: AIParticipant[]
  ): AsyncIterable<RoundtableEvent> {
    // Create streams for each participant
    const streams = participants.map(p => ({
      participant: p,
      stream: this.chatService.streamChatCompletion(
        threadId,
        prompt,
        p.provider
      )
    }));
    
    // Fair scheduling between streams
    yield* this.fairMerge(streams);
  }
  
  private async *fairMerge(streams: ParticipantStream[]) {
    // Round-robin or priority-based merging
    // Handle backpressure
    // Manage turn-taking
  }
}
```

### Phase 3: Roundtable MVP Features (Week 2)

1. **Roundtable Session Management**
```typescript
interface RoundtableSession {
  id: string;
  participants: AIParticipant[];
  topic: string;
  turnOrder: TurnManager;
  context: SharedContext;
}

interface AIParticipant {
  id: string;
  name: string;  // "Claude", "GPT-4", "Gemini"
  provider: LlmProvider;
  modelId: string;
  personality?: string;  // Optional personality prompt
  expertise?: string;    // Area of focus
}
```

2. **Turn Management**
```typescript
class TurnManager {
  // Ensure fair participation
  // Prevent one AI from dominating
  // Handle interruptions/corrections
  // Manage conversation flow
}
```

3. **Shared Context**
```typescript
class SharedContext {
  // What all AIs know about the conversation
  // Previous responses from other AIs
  // Topic constraints
  // Moderator instructions
}
```

## MVP Endpoint Design

```typescript
// POST /api/v1/roundtable/sessions
// Create a new roundtable session

// GET /api/v1/roundtable/sessions/:id/stream
// SSE endpoint for roundtable conversation
interface RoundtableEvent {
  type: 'message' | 'turn' | 'thinking' | 'complete';
  participantId: string;
  content?: string;
  metadata?: any;
}
```

## Risk Mitigation

1. **Rate Limits**: Implement provider-specific rate limiting
2. **Cost Control**: Token counting and limits per session
3. **Error Handling**: Graceful degradation if one provider fails
4. **Testing**: Mock providers for development/testing

## Timeline

- **Week 1**: Vercel AI SDK integration + AsyncIterable refactor
- **Week 2**: Stream orchestration + Roundtable MVP
- **Week 3**: Testing, error handling, UI integration
- **Week 4**: Polish, performance optimization

## Next Steps

1. Evaluate Vercel AI SDK with a spike
2. Design the exact roundtable interaction model
3. Define personality/expertise templates
4. Create cost estimation model
5. Build prototype UI for roundtable