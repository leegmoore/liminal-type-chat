# Platform Extension: Lyric Writing & AI Music Workflows

## Architecture Vision: Liminal Platform

```
┌─────────────────────────────────────────────────────────────┐
│                     Liminal Platform                        │
├─────────────────────┬───────────────────┬──────────────────┤
│  Liminal Type Chat  │  Liminal Lyrics   │  Liminal Music   │
│   (AI Roundtable)   │  (Lyric Writing)  │  (AI Prompting)  │
└──────────┬──────────┴─────────┬─────────┴──────────┬───────┘
           │                    │                     │
           ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shared Edge Tier                         │
│  - Common Auth/Session Management                           │
│  - Unified MCP Tool Registry                               │
│  - Shared Stream Orchestration                             │
│  - Cross-App Event Bus                                     │
└─────────────────────────────────────────────────────────────┘
           │                    │                     │
           ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Shared Domain Tier                        │
│  - Core Services (Chat, Context, User)                     │
│  - Shared LLM Providers                                    │
│  - Common Database Schema                                  │
│  - Platform-wide Business Rules                            │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Approach

### 1. **MCP Tools for Music/Lyrics**

```typescript
// Edge Tier: New MCP Tools
interface LyricMCPTools {
  // Lyric-specific tools
  'lyrics:rhyme-finder': (word: string) => RhymeResult[]
  'lyrics:syllable-counter': (text: string) => SyllableCount
  'lyrics:mood-analyzer': (lyrics: string) => MoodAnalysis
  
  // Music prompting tools
  'music:genre-analyzer': (description: string) => GenreMatch[]
  'music:prompt-builder': (params: MusicParams) => AIPrompt
  'music:reference-finder': (style: string) => SongReferences[]
}

// Register in shared MCP registry
class MCPToolRegistry {
  registerNamespace(namespace: string, tools: MCPTools) {
    // Liminal Type Chat tools: 'chat:*'
    // Liminal Lyrics tools: 'lyrics:*'
    // Liminal Music tools: 'music:*'
  }
}
```

### 2. **Domain Extensions**

```typescript
// Domain Tier: Extend existing services
interface IContextThreadService {
  // Existing chat methods...
  
  // New workflow-specific methods
  createLyricSession(params: LyricSessionParams): Promise<ContextThread>
  createMusicSession(params: MusicSessionParams): Promise<ContextThread>
}

// New domain entities
interface LyricProject {
  id: string
  threadId: string  // Links to ContextThread
  title: string
  genre: string
  mood: string
  verses: Verse[]
  metadata: LyricMetadata
}

interface MusicPrompt {
  id: string
  threadId: string  // Links to ContextThread
  style: string
  instruments: string[]
  generatedPrompts: AIPrompt[]
  audioReferences: AudioReference[]
}
```

### 3. **Database Schema Extensions**

```sql
-- Leverage existing tables
-- context_threads (already exists)
-- messages (already exists)

-- New tables for lyric/music features
CREATE TABLE lyric_projects (
  id TEXT PRIMARY KEY,
  thread_id TEXT REFERENCES context_threads(id),
  title TEXT,
  genre TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE music_prompts (
  id TEXT PRIMARY KEY,
  thread_id TEXT REFERENCES context_threads(id),
  style TEXT,
  instruments TEXT, -- JSON array
  created_at TIMESTAMP
);

-- Store structured data in messages.metadata
-- This leverages existing message storage
```

### 4. **Edge Tier Routes**

```typescript
// New edge routes for each app
router.use('/api/v1/lyrics', lyricRoutes)
router.use('/api/v1/music', musicRoutes)

// Lyric-specific endpoints
POST /api/v1/lyrics/projects
GET  /api/v1/lyrics/projects/:id
POST /api/v1/lyrics/projects/:id/collaborate  // AI collaboration
GET  /api/v1/lyrics/rhyme-assist             // Real-time rhyme help

// Music-specific endpoints  
POST /api/v1/music/prompts/generate
GET  /api/v1/music/prompts/:id/stream
POST /api/v1/music/analyze-reference
```

### 5. **UI Integration Patterns**

```typescript
// Shared components library
@liminal/ui-components
  - ChatInterface (used by all apps)
  - StreamDisplay 
  - MCPToolPanel
  - AIParticipantList

// App-specific UIs
liminal-lyrics-ui/
  - LyricEditor
  - RhymeAssistant
  - VerseStructureBuilder
  
liminal-music-ui/
  - PromptBuilder
  - StyleSelector
  - ReferenceUploader
```

### 6. **Cross-App Integration**

```typescript
// Event bus for cross-app communication
interface PlatformEvent {
  source: 'chat' | 'lyrics' | 'music'
  type: string
  payload: any
}

// Example: Start lyric session from chat
chatService.on('mention:lyrics', (event) => {
  // Transition to lyrics app with context
  const lyricSession = await lyricService.createFromChat(event.threadId)
  eventBus.emit({
    source: 'chat',
    type: 'lyrics:session:created',
    payload: { sessionId: lyricSession.id }
  })
})

// Example: Use roundtable for lyric feedback
lyricService.requestFeedback = async (lyrics: string) => {
  // Leverage AI roundtable for critique
  const feedback = await chatService.roundtable({
    participants: ['claude', 'gpt-4', 'gemini'],
    topic: 'Critique these lyrics',
    context: lyrics
  })
  return feedback
}
```

## Benefits of This Architecture

### 1. **Reuse Core Infrastructure**
- LLM providers work across all apps
- Database and auth are shared
- Stream orchestration benefits all apps

### 2. **Modular Growth**
- Each app can evolve independently
- New apps can be added easily
- Shared improvements benefit all

### 3. **Cross-Pollination**
- Chat conversations can spawn lyric sessions
- Music prompts can use roundtable feedback
- Unified user experience across apps

### 4. **Cost Efficiency**
- Single deployment infrastructure
- Shared LLM API keys
- Common monitoring/logging

## Implementation Strategy

### Phase 1: Foundation (Current)
- Complete core Liminal Type Chat
- Ensure architecture supports extensions
- Build shared component library

### Phase 2: First Extension
- Choose lyrics OR music (not both)
- Implement as separate routes/UI
- Validate shared service approach

### Phase 3: Platform Features
- Cross-app event system
- Unified user dashboard
- Shared workspace concept

### Phase 4: Advanced Integration
- AI agents that work across apps
- Workflow automation
- Platform-wide search/discovery

## Key Decisions

1. **Monorepo vs Separate Repos**
   - Recommend monorepo for shared code
   - Apps in separate packages
   - Shared packages for common code

2. **Deployment Strategy**
   - Single backend serves all apps
   - Multiple frontends (or unified UI)
   - Feature flags for gradual rollout

3. **Data Isolation**
   - Shared user/auth tables
   - App-specific tables with FK to core
   - Careful with cross-app queries

This architecture lets you leverage everything you've built while maintaining clean boundaries between different application domains.