import React from 'react';
import { render, screen, act } from '@testing-library/react';
import ChatPage from '../ChatPage';
import { ChakraProvider } from '@chakra-ui/react';

import { vi } from 'vitest';

// Mock axios to prevent actual API calls
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { conversations: [] } }),
    post: vi.fn().mockResolvedValue({ data: {} })
  }
}));

// Mock authService functions to prevent auth-related issues
vi.mock('../../../services/authService', () => ({
  getAuthToken: vi.fn().mockReturnValue('mock-token'),
  loginAsGuest: vi.fn().mockResolvedValue({}),
  initializeAuth: vi.fn().mockReturnValue(true)
}));

describe('ChatPage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders with no conversations', async () => {
    // Wrap render in act to handle async state updates
    await act(async () => {
      render(
        <ChakraProvider>
          <ChatPage />
        </ChakraProvider>
      );
    });
    
    // Check that the conversations header is rendered
    expect(screen.getByText('Conversations')).toBeInTheDocument();
    
    // Check that the "No conversations yet" message is rendered
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    
    // Check that the "Create New Conversation" button is rendered
    expect(screen.getByText('Create New Conversation')).toBeInTheDocument();
  });
});