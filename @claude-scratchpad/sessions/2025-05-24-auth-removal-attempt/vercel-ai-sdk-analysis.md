# Vercel AI SDK: Downsides & BYOK Analysis

## Key Downsides

### 1. **BYOK is NOT Fully Supported Yet**
- Vercel AI Gateway (their proxy service) doesn't support BYOK yet
- They're "planning to explore" it in the future
- Currently, they manage all API keys centrally

### 2. **How API Keys Work in Vercel AI SDK**
```typescript
// You still provide your own keys to the SDK
import { openai } from '@ai-sdk/openai';

const openaiClient = openai({
  apiKey: process.env.OPENAI_API_KEY, // Your key
});

// But if using Vercel AI Gateway (optional):
// Keys are managed by Vercel, not you
```

### 3. **Provider Breaking Changes**
- Recent example: Perplexity API changes broke SDK integration
- You're dependent on Vercel to fix provider compatibility
- Can't quickly patch issues yourself

### 4. **Abstraction Trade-offs**
```typescript
// Less control over provider-specific features
// Can't access advanced Anthropic features like:
- System prompts with specific formats
- Detailed token usage
- Provider-specific parameters
```

### 5. **Production Limitations**
- No built-in rate limiting per user
- No cost tracking/budgeting features
- Limited observability (need third-party tools)
- No built-in caching layer

### 6. **Vendor Lock-in Risk**
- Your code becomes dependent on Vercel's abstractions
- Migrating away means rewriting provider integrations
- Breaking changes require code updates (SDK 4.0 had many)

## BYOK Clarification

**Vercel AI SDK itself**: YES, you use your own API keys
```typescript
// You provide keys via environment variables
const anthropic = anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});
```

**Vercel AI Gateway** (optional proxy): NO BYOK yet
- This is their managed proxy service
- They handle keys, rate limits, billing
- BYOK "planned for future"

## For Your Use Case

### Pros for AI Roundtable:
- ✅ Quick multi-provider setup
- ✅ Consistent streaming API
- ✅ Active maintenance
- ✅ You keep using your own keys

### Cons for Your Architecture:
- ❌ Less control over streaming details
- ❌ Can't optimize provider-specific features
- ❌ Another dependency to manage
- ❌ Potential breaking changes

## Recommendation

**Use Vercel AI SDK for MVP** because:
1. Speed to market for roundtable
2. You can always unwrap later
3. BYOK works for direct SDK usage
4. Streaming abstraction saves weeks

**But plan for:**
- Wrapper pattern to isolate SDK
- Monitor for breaking changes
- Keep provider-specific needs minimal
- Have fallback plan to unwrap if needed

```typescript
// Isolate SDK usage
class VercelAIProvider implements ILlmService {
  // Easy to replace later if needed
}
```