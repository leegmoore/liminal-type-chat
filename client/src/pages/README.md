# Page Components

This directory contains the page-level components for the Liminal Type Chat application. Unlike the reusable UI components in the `components` directory, these are larger-scope components that represent entire pages or views in the application.

## Page Component Overview

### Health Dashboard

- **HealthDashboard**: The main dashboard page that displays health status for both domain and edge tiers.
  - Contains multiple `HealthCheckCard` components
  - Manages API calls to health endpoints
  - Handles overall page layout and section organization
  - Implements real-time health status updates

## Page Design Principles

1. **Container Pattern**: Page components act as containers that manage data and state for their child components.
2. **API Integration**: Pages handle API calls and distribute data to presentational components.
3. **Routing**: Pages are connected to routes in the application router.
4. **Responsive Design**: All pages adapt to different screen sizes through Chakra UI's responsive utilities.
5. **Error Boundaries**: Pages implement error handling for their contained components.

## Folder Structure

```
pages/
├── HealthDashboard.tsx
├── __tests__/
│   └── HealthDashboard.test.tsx
└── README.md
```

## Testing

Page components have corresponding test files in the `__tests__` directory. These tests focus on:

1. Integration testing with child components
2. API call mocking and response handling
3. State management across the page
4. Error handling scenarios

## Adding New Pages

When adding new pages:

1. Create the page component file in this directory
2. Add the route to the router configuration in `App.tsx`
3. Create a corresponding test file in `__tests__/`
4. Update this README if adding a page with new functionality

## Future Page Additions

As we proceed with development, we'll add these pages:

- **ChatPage**: Main conversation interface
- **SettingsPage**: User preferences and API key management
- **HistoryPage**: Conversation history and saved prompts
- **TemplatesPage**: Predefined prompt templates

## Relationship to Router

The root `App.tsx` file contains the React Router configuration that maps URL paths to these page components. When adding a new page, update the router configuration to include the new route.
