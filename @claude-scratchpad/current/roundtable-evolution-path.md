# Evolution Path: Simple Prompt → AI Roundtable

## The Vision: AI Roundtable Mapping

```typescript
// Vercel AI SDK message structure
messages: [
  { role: 'system', content: 'You are Alice, a security expert...' },
  { role: 'user', content: 'What do you think about OAuth?' },
  { role: 'assistant', content: 'As a security expert, I believe...' }
]

// Maps to Roundtable participants
participants: [
  { 
    name: 'Alice', 
    role: 'security-expert',
    systemPrompt: 'You are Alice, a security expert...',
    provider: 'anthropic',
    model: 'claude-opus-4'
  },
  {
    name: 'Bob',
    role: 'frontend-dev', 
    systemPrompt: 'You are Bob, a React developer...',
    provider: 'openai',
    model: 'gpt-4.1'
  }
]
```

## Current Feature 002 Limitation

Our current contract:
```typescript
// Too simple for roundtables
{ prompt: string, provider?: string }
→ { content: string, model: string, usage: {...} }
```

This doesn't naturally extend to:
- Multiple participants
- Conversation history
- Role-specific system prompts
- Mixed providers in one conversation

## Organic Evolution Path

### Phase 1: Feature 002 as Designed (Quick Win)
```typescript
// Ship simple multi-provider support
POST /domain/llm/prompt
{ prompt: "Hello", provider: "openai" }
```

### Phase 2: Add Conversation Context (Feature 003?)
```typescript
// Extend contract to support messages
POST /domain/llm/chat
{
  // Simple prompt still works
  prompt?: string,
  
  // OR full message history
  messages?: [
    { role: 'system', content: string },
    { role: 'user', content: string },
    { role: 'assistant', content: string }
  ],
  
  provider?: string
}
```

### Phase 3: Named Participants (Feature 004?)
```typescript
// Extend messages with participant metadata
POST /domain/llm/roundtable
{
  participants: [
    { id: 'alice', name: 'Alice', systemPrompt: '...', provider: 'anthropic' }
  ],
  messages: [
    { participantId: 'alice', content: '...' },
    { participantId: 'user', content: '...' }
  ]
}
```

## Recommended Contract Adjustment for Feature 002

To ensure organic growth, consider this small change:

```typescript
// Instead of just prompt
{
  prompt: string,
  provider?: string
}

// Support both prompt AND messages from day 1
{
  // Simple mode (backward compatible)
  prompt?: string,
  
  // Advanced mode (ready for growth)
  messages?: Array<{
    role: 'system' | 'user' | 'assistant',
    content: string,
    // Future: name, participantId, etc.
  }>,
  
  provider?: string,
  
  // Must provide either prompt OR messages
}
```

## Benefits of This Approach

1. **No Breaking Changes**: Simple prompt mode always works
2. **Natural Evolution**: Messages array can gain participant fields later
3. **Vercel SDK Ready**: Already matches their conversation format
4. **Roundtable Foundation**: `role` can become `participantId` later

## Implementation Strategy

```typescript
// Domain service evolves naturally
class LLMService {
  async generateResponse(request: LLMRequest) {
    // Convert simple prompt to messages format
    const messages = request.messages || [
      { role: 'user', content: request.prompt! }
    ];
    
    // Use Vercel SDK with messages
    const result = await generateText({
      model: this.getModel(request.provider),
      messages
    });
    
    return this.formatResponse(result);
  }
}
```

## Decision Point

**Option A**: Ship Feature 002 as-is with simple prompt
- ✅ Faster to market
- ❌ Requires contract change later

**Option B**: Add messages support in Feature 002
- ✅ Organic growth path
- ✅ No future breaking changes
- ❌ Slightly more complex initially

Given your roundtable vision, Option B seems wiser. It's a small addition now that prevents a big rewrite later.