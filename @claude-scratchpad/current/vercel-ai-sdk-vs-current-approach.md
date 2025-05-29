# Vercel AI SDK Primitives vs Our Current Approach

## Current Approach (Simple Prompt/Response)
Our echo provider and planned multi-provider support uses a simple model:

```typescript
// Request
{ prompt: string, provider?: string }

// Response  
{ content: string, model: string, usage: { promptTokens, completionTokens } }
```

### Characteristics:
- **Single-turn**: Each request is independent
- **Text-only**: Just prompt in, text out
- **Simple streaming**: SSE for progressive text
- **No context**: Each call is stateless
- **Provider selection**: Via parameter

## Vercel AI SDK Primitives

The Vercel AI SDK offers much richer primitives:

### 1. Text Generation
```typescript
// Simple generation
const { text, usage, finishReason } = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: 'Write a poem about recursion.',
});

// With system prompt and messages
const { text } = await generateText({
  model: anthropic('claude-3-opus'),
  system: 'You are a helpful assistant.',
  messages: [
    { role: 'user', content: 'What is recursion?' },
    { role: 'assistant', content: 'Recursion is...' },
    { role: 'user', content: 'Can you give an example?' }
  ],
});
```

### 2. Streaming
```typescript
const { textStream } = await streamText({
  model: openai('gpt-4-turbo'),
  prompt: 'Write a story...',
});

for await (const textPart of textStream) {
  console.log(textPart);
}
```

### 3. Structured Output (JSON)
```typescript
const { object } = await generateObject({
  model: openai('gpt-4-turbo'),
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.string()),
      steps: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a recipe for chocolate cake.',
});
```

### 4. Tool/Function Calling
```typescript
const { text } = await generateText({
  model: openai('gpt-4-turbo'),
  messages,
  tools: {
    weather: {
      description: 'Get the weather in a location',
      parameters: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        const weather = await getWeather(location);
        return weather;
      },
    },
  },
});
```

### 5. Multi-modal (Images)
```typescript
const { text } = await generateText({
  model: openai('gpt-4-vision'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        { type: 'image', image: imageData }
      ],
    },
  ],
});
```

## Key Differences

### 1. **Conversation Context**
- **Current**: Stateless, single prompt
- **Vercel**: Full conversation history with roles (system, user, assistant)

### 2. **Output Types**
- **Current**: Plain text only
- **Vercel**: Text, structured JSON, or custom schemas

### 3. **Interaction Model**
- **Current**: Request/response
- **Vercel**: Can include tool calls, function execution, multi-step reasoning

### 4. **Streaming Granularity**
- **Current**: Text chunks via SSE
- **Vercel**: Token-level streaming, partial JSON streaming

### 5. **Provider Abstraction**
- **Current**: Provider as parameter
- **Vercel**: Provider wrapped in model function (e.g., `openai('gpt-4')`)

## Architecture Implications

### Option 1: Keep Simple Prompt Interface
```typescript
// Domain stays simple
POST /domain/llm/prompt
{ prompt, provider }

// Vercel SDK used internally
// Loses access to advanced features
```

### Option 2: Expose Vercel Primitives
```typescript
// New domain endpoints
POST /domain/llm/generate-text
POST /domain/llm/generate-object  
POST /domain/llm/stream-text

// Richer but more complex API
```

### Option 3: Hybrid Approach
```typescript
// Simple endpoint for basic use
POST /domain/llm/prompt

// Advanced endpoint for full features
POST /domain/llm/chat
{
  messages: Message[],
  system?: string,
  tools?: Tool[],
  responseFormat?: 'text' | 'json' | Schema,
  stream?: boolean
}
```

## Recommendation

For our AI Roundtable platform vision, we'll likely need:
1. **Conversation context** - Multiple participants, message history
2. **Structured outputs** - For extracting actions, summaries
3. **Tool calling** - For MCP integration at edge
4. **Streaming** - For real-time conversation

**Suggested approach**: Start with Option 1 (keep simple) but design knowing we'll migrate to Option 3 (hybrid) as we add roundtable features. This lets us:
- Ship provider support quickly
- Learn from real usage
- Add advanced features incrementally
- Maintain backward compatibility