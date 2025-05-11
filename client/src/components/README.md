# UI Components

This directory contains the reusable UI components for the Liminal Type Chat application. These components follow a modular design pattern and use Chakra UI for styling.

## Component Overview

### Layout Components

- **Header**: Application header with navigation links and branding.
- **Footer**: Application footer with copyright information and links.

### Health Check Components

- **HealthCheckCard**: A reusable card component that displays health status information. It handles:
  - Loading states with spinners
  - Success/failure visualization
  - Error message display
  - Health check triggers via button
  - Server vs. database status indicators
  - Domain vs. edge tier visualization

## Component Design Principles

1. **Single Responsibility**: Each component handles one specific part of the UI.
2. **Reusability**: Components are designed to be reused across different pages.
3. **Testability**: All components are designed for easy testing with React Testing Library.
4. **Type Safety**: Strict TypeScript interfaces for all props.
5. **Accessibility**: WCAG 2.1 AA compliant with proper aria attributes.

## Folder Structure

```
components/
├── Header.tsx
├── Footer.tsx
├── HealthCheckCard.tsx
├── __tests__/
│   ├── Header.test.tsx
│   ├── Footer.test.tsx
│   └── HealthCheckCard.test.tsx
└── README.md
```

## Testing

All components have corresponding test files in the `__tests__` directory. Tests cover:

1. Rendering in different states
2. User interactions (clicks, hovers, etc.)
3. Prop changes and their effects
4. Accessibility concerns

## Adding New Components

When adding new components:

1. Create the component file in this directory
2. Use the following template:

```tsx
import React from 'react';
import { Box } from '@chakra-ui/react';

interface ComponentNameProps {
  // Define props here
}

export const ComponentName: React.FC<ComponentNameProps> = ({ /* destructure props */ }) => {
  return (
    <Box>
      {/* Component content */}
    </Box>
  );
};
```

3. Add corresponding test file in `__tests__/`
4. Update this README if adding a new category of components

## Future Component Additions

As we move into Milestone 5 and beyond, we'll add components for:

- Chat interface elements
- Message displays
- Conversation history
- LLM provider selection
- Settings panels
