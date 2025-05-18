# Security Architecture

**Last Updated:** 2025-05-18  
**Status:** Stable  
**Related Components:** Authentication, API Key Manager, HTTP Security Middleware

## Overview

This document outlines the security architecture of the Liminal Type Chat application. Security is a fundamental aspect of the project's design, with particular focus on protecting user API keys for LLM services and ensuring secure authentication flows.

## Contents

- [Design Goals](#design-goals)
- [Component Structure](#component-structure)
- [Authentication and Authorization](#authentication-and-authorization)
- [API Key Protection](#api-key-protection)
- [HTTP Security](#http-security)
- [Secure Development Practices](#secure-development-practices)
- [Developer Guidance](#developer-guidance)

## Design Goals

- Protect user API keys with strong encryption and secure handling
- Implement OAuth 2.0 with PKCE for secure authentication
- Apply defense-in-depth with multiple security controls
- Support environment-specific security profiles
- Follow industry best practices for web application security
- Maintain secure development lifecycle processes
- Provide clear guidance for developers on security requirements

## Component Structure

The security architecture consists of several interconnected components:

```
                  ┌─────────────────┐
                  │                 │
                  │  Security Layer │
                  │                 │
                  └────────┬────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
┌──────────▼──────┐ ┌──────▼─────┐ ┌──────▼─────────┐
│                 │ │            │ │                │
│  Authentication │ │ API Key    │ │ HTTP Security  │
│  & Authorization│ │ Protection │ │ Controls       │
│                 │ │            │ │                │
└────────┬────────┘ └─────┬──────┘ └────────┬───────┘
         │                │                 │
         │                │                 │
┌────────▼────────────────▼─────────────────▼───────┐
│                                                   │
│              Application Components               │
│                                                   │
└───────────────────────────────────────────────────┘
```

## Authentication and Authorization

Liminal Type Chat implements a comprehensive authentication and authorization system:

### OAuth Integration

- Integration with industry-standard OAuth 2.0 providers
- Secure handling of authorization code flow with PKCE extension
- State parameter validation to prevent CSRF attacks
- Strict validation of redirect URIs

### Session Management

- JWT-based (JSON Web Token) authentication
- Token-based authorization with appropriate expiration
- Secure handling of user sessions
- Role-based access control as needed

### Authorization Model

The application enforces an authorization model based on:

- Role-based permissions for administrative functions
- Resource-based permissions for user-specific data
- Contextual permission checking at API boundaries
- Least privilege principle throughout the system

## API Key Protection

One of the most critical security aspects is the protection of user-provided API keys for LLM services:

### Key Encryption

- AES-256-GCM encryption for all stored API keys
- Authenticated encryption to ensure data integrity
- Secure key management following industry best practices
- Keys are never stored in plaintext anywhere in the application

### Key Handling

- API keys are validated before storage
- Keys are only decrypted when needed for API calls
- Key usage is tracked and logged (without exposing key contents)
- Failed decryption attempts are logged and monitored

### Implementation Details

```typescript
// Example of API key validation process
async function validateAndStoreApiKey(
  userId: string, 
  provider: string, 
  key: string
): Promise<boolean> {
  try {
    // Validate key with provider
    const isValid = await validateWithProvider(provider, key);
    if (!isValid) {
      return false;
    }
    
    // Encrypt and store
    const encryptedKey = await encryptSensitiveData(key);
    await storeEncryptedKey(userId, provider, encryptedKey);
    
    return true;
  } catch (error) {
    logger.error('Error storing API key', { provider, userId, error: error.message });
    return false;
  }
}
```

## HTTP Security

The application implements a comprehensive set of HTTP security controls:

### Security Headers

- **Content-Security-Policy (CSP)**: Prevents XSS attacks by controlling resource loading
- **Strict-Transport-Security (HSTS)**: Enforces HTTPS connections
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **Referrer-Policy**: Controls information in the Referer header
- **Permissions-Policy**: Limits browser features in application context

### Input Validation

- Comprehensive validation for all user input
- Schema-based validation for API requests
- Sanitization of data before processing
- Prevention of common injection attacks

### Rate Limiting

- Request rate limiting to prevent abuse
- Tiered limits based on endpoint sensitivity
- Per-user and per-IP limits
- Graduated response to potential abuse

### CORS Configuration

- Strict Cross-Origin Resource Sharing policy
- Explicit allowlisting of authorized origins
- Limited exposure of sensitive headers
- Appropriate handling of preflight requests

## Secure Development Practices

The project follows these secure development practices:

### Dependency Management

- Regular security auditing of dependencies
- Automated vulnerability scanning
- Pinned dependency versions
- Careful evaluation of new dependencies

### Code Security

- Static analysis tools integrated into CI pipeline
- Security-focused code reviews
- No secrets in code
- Principle of least privilege

### Environment Security

- Secure configuration management
- Environment-specific security controls
- Secret management for sensitive configuration
- Validation of security configuration at startup

## Developer Guidance

### Local Development

For local development, follow these guidelines:

1. **Environment Setup**
   - Create a `.env.local` file with development configuration
   - Generate a development encryption key (follow README instructions)
   - Never use production keys in development

2. **Authentication Testing**
   - Use the development OAuth configuration in `.env.example`
   - Create test users as needed for different roles
   - In development, extended token lifetimes may be configured

3. **API Key Testing**
   - Use test API keys from LLM providers when available
   - For testing without valid API keys, use the mock provider mode

### Security Testing

Developers should regularly test security controls:

- Verify proper JWT validation
- Confirm authorization checks are working
- Test input validation with boundary cases
- Verify encryption/decryption flows

## Trade-offs and Decisions

### OAuth Provider Selection

GitHub was selected as the initial OAuth provider due to its widespread usage among developers, good documentation, and reliable implementation. The system is designed to support multiple providers, with GitHub serving as the reference implementation.

### JWT vs. Session Cookies

JWT tokens were selected over traditional session cookies for several reasons:
- Better support for cross-domain authentication
- Reduced database load (no session lookups)
- Easier implementation of stateless services
- Support for distributed architectures

This decision does require careful management of token lifetimes and refresh strategies.

## Related Documentation

- [Security Implementation](./implementation.md)
- [OAuth PKCE Flow](./auth/oauth-pkce.md)
- [Environment Security](./environment-security.md)
- [Security Testing](./testing.md)

## Revision History

| Date | Changes | Author |
|------|---------|--------|
| 2025-05-18 | Migrated to wiki template | LLM Chat Team |
| 2025-05-10 | Added environment-specific security details | LLM Chat Team |
| 2025-04-15 | Initial version | LLM Chat Team |