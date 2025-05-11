# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability within Liminal Type Chat, please send an email to [INSERT YOUR EMAIL]. All security vulnerabilities will be promptly addressed.

Please do not disclose security vulnerabilities publicly until they have been handled by the maintainers.

## Application Security Architecture

Liminal Type Chat is designed primarily as a local-first tool for power users, with options for simple cloud deployment. The application follows a tiered architecture with:

- **Domain Tier**: Core business logic and database access
- **Edge Tier**: API routes and transformations
- **UI Tier**: React frontend

## Security Considerations for Self-Hosting

### Local-First Mode
When running Liminal Type Chat locally (the primary use case):
- Your data remains on your machine
- Conversations are stored in a local SQLite database
- No data is sent to external servers except when explicitly invoking an external LLM API

### Cloud Deployment Mode
If deploying the Edge tier to a cloud environment:
- Ensure you use HTTPS with valid certificates
- Consider adding authentication if exposing to the internet
- Be aware that user data, including potentially sensitive conversations, will be stored on your server
- Regularly update dependencies and apply security patches

## Current Security Controls

- Type safety via TypeScript throughout the application
- Error handling designed to avoid leaking sensitive information
- Environment variables for configuration
- No hardcoded secrets in the codebase

## Planned Security Enhancements

See the [ROADMAP.md](../docs/ROADMAP.md) file for upcoming security improvements.

## Security Scanning Process

We recommend the following security scanning process for contributors and users deploying Liminal Type Chat:

### 1. Local Development

- **ESLint with security plugins**: Run regularly during development
- **Pre-commit hooks**: We use Husky with secrets scanning to prevent accidental commits of sensitive data
- **Dependency scanning**: Regular `npm audit` checks

### 2. Continuous Integration

Our GitHub Actions workflow includes:
- Running tests with coverage reporting
- Linting checks
- Dependency vulnerability scanning
- Static analysis

### 3. Regular Manual Checks

We recommend:
- Quarterly dependency reviews
- Regular updates to the latest stable versions
- Code reviews with security focus for all PRs

## Security Best Practices for Users

- Keep your Node.js environment updated
- Regularly update Liminal Type Chat and its dependencies
- Use environment variables for storing sensitive configuration (API keys, etc.)
- If publicly exposing the Edge tier, consider adding authentication
- Be cautious about what data you store in conversations if sharing access with others

## Third-Party Dependencies

Liminal Type Chat uses various NPM packages. We strive to:
- Keep dependencies up to date
- Use well-maintained packages with active communities
- Avoid packages with known security issues

---

This security policy is a living document and will be updated as the project evolves.

Last updated: May 2025
