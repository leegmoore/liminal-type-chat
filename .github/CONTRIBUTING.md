# Contributing to Liminal Type Chat

Thank you for considering contributing to Liminal Type Chat! This project is designed for power users who want to customize their BYOK LLM chatbot experience, and your contributions help make it better for everyone.

## How Can I Contribute?

### Reporting Bugs

When reporting bugs, please include:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots if applicable
- Environment information (OS, Node version, etc.)

### Suggesting Enhancements

We welcome enhancement suggestions! Please include:
- A clear description of the feature
- The rationale for adding this feature
- Any relevant examples or mockups

### Code Contributions

1. Fork the repository
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your `.env` file based on `.env.example`
4. Start the development server: `npm run dev`

## Project Structure

Liminal Type Chat follows a tiered architecture:
- **Domain Tier**: Core business logic and database access
- **Edge Tier**: API routes and transformations
- **UI Tier**: React frontend

Please maintain this separation when contributing code.

## Coding Standards

- Follow the TypeScript style guide in the project
- Maintain test coverage (90% for domain services, 80% for others)
- Write clear, descriptive commit messages
- Document new code with JSDoc comments
- Add tests for new features

## Test Guidelines

- Unit tests for domain services and components
- Integration tests for API routes
- UI tests for React components
- Aim for the specified test coverage

## Pull Request Process

1. Update documentation if necessary
2. Add or update tests as needed
3. Make sure all tests pass
4. Get approval from a maintainer
5. The maintainer will merge your PR

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a positive community

## Questions?

If you have questions about contributing, feel free to open an issue for clarification.

---

Thank you for contributing to Liminal Type Chat!
