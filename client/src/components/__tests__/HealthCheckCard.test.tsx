import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HealthCheckCard from '../HealthCheckCard';

const mockOnCheck = jest.fn();

describe('HealthCheckCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders card with title and subtitle', () => {
    render(
      <HealthCheckCard
        title="Test Title"
        subtitle="Test Subtitle"
        checkType="server"
        tier="domain"
        result={{
          data: null,
          loading: false,
          error: null
        }}
        onCheck={mockOnCheck}
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    expect(screen.getByText('DOMAIN')).toBeInTheDocument();
  });

  test('displays loading state correctly', () => {
    render(
      <HealthCheckCard
        title="Test Title"
        subtitle="Test Subtitle"
        checkType="server"
        tier="domain"
        result={{
          data: null,
          loading: true,
          error: null
        }}
        onCheck={mockOnCheck}
      />
    );

    expect(screen.getByText('Checking server health...')).toBeInTheDocument();
    // Check for spinner
    const spinner = document.querySelector('[role="status"]');
    expect(spinner).toBeInTheDocument();
  });

  test('displays server health data correctly', () => {
    const mockData = {
      status: 'ok' as const,
      timestamp: '2025-05-11T18:30:00Z',
      details: 'Server is healthy'
    };

    render(
      <HealthCheckCard
        title="Test Title"
        subtitle="Test Subtitle"
        checkType="server"
        tier="domain"
        result={{
          data: mockData,
          loading: false,
          error: null
        }}
        onCheck={mockOnCheck}
      />
    );

    expect(screen.getByText('Status: Healthy')).toBeInTheDocument();
    expect(screen.getByText('Server is healthy')).toBeInTheDocument();
    expect(screen.getByText(/Last checked:/)).toBeInTheDocument();
  });

  test('displays database health data correctly', () => {
    const mockData = {
      status: 'ok' as const,
      timestamp: '2025-05-11T18:30:00Z',
      database: {
        connected: true,
        name: 'SQLite',
        version: '3.39.2'
      }
    };

    render(
      <HealthCheckCard
        title="Test Title"
        subtitle="Test Subtitle"
        checkType="database"
        tier="edge"
        result={{
          data: mockData,
          loading: false,
          error: null
        }}
        onCheck={mockOnCheck}
      />
    );

    expect(screen.getByText('Status: Healthy')).toBeInTheDocument();
    expect(screen.getByText('Database:')).toBeInTheDocument();
    expect(screen.getByText('SQLite')).toBeInTheDocument();
    expect(screen.getByText('Connected:')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('Version:')).toBeInTheDocument();
    expect(screen.getByText('3.39.2')).toBeInTheDocument();
  });

  test('displays error state correctly', () => {
    render(
      <HealthCheckCard
        title="Test Title"
        subtitle="Test Subtitle"
        checkType="server"
        tier="domain"
        result={{
          data: null,
          loading: false,
          error: 'Failed to fetch'
        }}
        onCheck={mockOnCheck}
      />
    );

    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  test('calls onCheck function when button is clicked', () => {
    render(
      <HealthCheckCard
        title="Test Title"
        subtitle="Test Subtitle"
        checkType="server"
        tier="domain"
        result={{
          data: null,
          loading: false,
          error: null
        }}
        onCheck={mockOnCheck}
      />
    );

    const button = screen.getByText('Check Server Health');
    fireEvent.click(button);
    expect(mockOnCheck).toHaveBeenCalledTimes(1);
  });
});
