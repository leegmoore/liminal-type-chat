# WorkOS Critical Findings
Date: 2025-05-24

## Why NOT WorkOS for Liminal Type Chat

### 1. Vendor Lock-in (CRITICAL)
- **No documented export functionality** - once in, no clear path out
- Migration docs only show moving TO WorkOS, never away
- No "export all users" feature
- Must extract data piecemeal via API

### 2. Philosophy Mismatch
- Liminal is "local-first, bring your own keys"
- WorkOS requires internet dependency
- Contradicts user data ownership principle
- Adds external service dependency for core functionality

### 3. Hidden Costs & Limitations
- SSO connections: $125/month EACH
- Custom domains: $99/month extra
- No staging environment support
- Geographic data residency unclear
- Rate limits undocumented

### 4. The Lock-in Pattern
```
Easy Integration (3-6 hours)
    ↓
Growing Dependency 
    ↓
Feature Creep (SSO, SCIM, etc.)
    ↓
Expensive to Leave (no export tools)
    ↓
Trapped
```

### 5. Red Flags from Research
- No community forum or public knowledge base
- Many details require "contact sales"
- Data location/residency options unclear
- Limited transparency about technical limits
- Service credits as sole remedy for downtime

## Recommendation
Despite the attractive free tier and quick setup, WorkOS presents unacceptable risks for a local-first application. The vendor lock-in alone disqualifies it from consideration.

Simple local auth better aligns with Liminal's philosophy and gives users true control of their data.