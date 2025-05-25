# Environment-Aware Security

This document describes the environment-aware security system in Liminal Type Chat, which ensures appropriate security controls are applied based on the runtime environment.

## Overview

The application uses a multi-factor environment detection system to determine the current runtime environment and apply appropriate security profiles. This ensures that:

1. Development environments have developer-friendly settings
2. Production environments enforce strict security controls
3. Security bypasses cannot be accidentally enabled in production

## Environment Types

The system recognizes four distinct environments:

| Environment | Description | Security Level |
|-------------|-------------|----------------|
| `LOCAL` | Local development environment | Relaxed |
| `DEVELOPMENT` | Development/testing environment | Moderate |
| `STAGING` | Pre-production environment | Strict |
| `PRODUCTION` | Production environment | Maximum |

## Environment Detection

The environment is detected using multiple signals, in order of precedence:

1. `APP_ENV` environment variable (explicit setting)
2. `NODE_ENV` environment variable (standard setting)
3. `ENFORCE_PRODUCTION_SECURITY` flag (forces production security)
4. Hostname checks (for production indicators)
5. Default fallback (local for development, production for safety)

## Security Profiles

Each environment has a specific security profile that defines:

| Feature | Local | Development | Staging | Production |
|---------|-------|-------------|---------|------------|
| Authentication Required | Optional | Required | Required | Required |
| Strict CORS | No | No | Yes | Yes |
| Strict Security Headers | No | Yes | Yes | Yes |
| Allow Mock Services | Yes | Yes | No | No |
| Rate Limiting | No | Yes | Yes | Yes |
| Extended Token Lifetime | Yes | Yes | No | No |

## Environment Configuration

### Local Environment

For local development, create a `.env.local` file with:

```
NODE_ENV=development
APP_ENV=local
DEV_REQUIRE_AUTH=false  # Set to true to require auth locally
```

Run `npm run setup` to generate a secure local environment configuration.

### Development Environment

For development/testing environments:

```
NODE_ENV=development
APP_ENV=development
```

### Staging Environment

For pre-production environments:

```
NODE_ENV=production
APP_ENV=staging
```

### Production Environment

For production environments:

```
NODE_ENV=production
APP_ENV=production
```

## Security Override

You can override the environment's default security profile by setting:

```
ENFORCE_SECURITY=true
```

This will apply production-level security settings regardless of the environment.

## Development Features

In the local environment:

1. Authentication can be bypassed for easy testing
2. Mock services are allowed for development without API keys
3. Security headers are relaxed for local development tools
4. Rate limiting is disabled for rapid testing

## Visual Indicators

The application includes visual indicators when security bypasses are active:

1. The authentication middleware adds an `X-Dev-Auth-Bypass` header
2. Extended token lifetime adds an `X-Token-Extended-Lifetime` header
3. Console warnings are displayed when security bypasses are active
4. In frontend, a development banner appears when bypasses are active

## Security Logging

Security events are logged with appropriate levels:

- Authentication bypasses are logged as warnings
- Security override usage is logged as info
- Security bypass attempts in production are logged as errors

## Implementation

The environment-aware security system is implemented in:

- `src/services/core/EnvironmentService.ts` - Core environment detection
- `src/middleware/auth-middleware.ts` - Authentication with environment awareness
- Other security middleware integrates with the EnvironmentService

## Best Practices

1. **Never** set `BYPASS_AUTH=true` in production environments
2. Use `APP_ENV=local` for local development
3. Run with `ENFORCE_SECURITY=true` to test production security locally
4. Use the `setup` script to generate secure local defaults
5. Explicitly set `APP_ENV` in all deployment environments