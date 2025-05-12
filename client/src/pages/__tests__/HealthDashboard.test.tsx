import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import HealthDashboard from '../HealthDashboard';
import * as healthService from '../../services/healthService';

// Mock the health service functions
vi.mock('../../services/healthService', () => ({
  checkServerHealth: vi.fn(),
  checkDatabaseHealth: vi.fn(),
}));

const mockCheckServerHealth = healthService.checkServerHealth as ReturnType<typeof vi.fn>;
const mockCheckDatabaseHealth = healthService.checkDatabaseHealth as ReturnType<typeof vi.fn>;

describe('HealthDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckServerHealth.mockResolvedValue({
      status: 'ok',
      timestamp: '2025-05-11T18:30:00Z',
    });
    mockCheckDatabaseHealth.mockResolvedValue({
      status: 'ok',
      timestamp: '2025-05-11T18:30:00Z',
      database: {
        connected: true,
        name: 'SQLite',
      },
    });
  });

  test('renders all section headings correctly', () => {
    render(<HealthDashboard />);
    
    expect(screen.getByText('System Health Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Domain Tier Health')).toBeInTheDocument();
    expect(screen.getByText('Edge Tier Health')).toBeInTheDocument();
  });

  test('renders all health check cards', () => {
    render(<HealthDashboard />);
    
    expect(screen.getByText('Domain Server Health')).toBeInTheDocument();
    expect(screen.getByText('Domain Database Health')).toBeInTheDocument();
    expect(screen.getByText('Edge Server Health')).toBeInTheDocument();
    expect(screen.getByText('Edge Database Health')).toBeInTheDocument();
  });

  test('Domain server health check button works correctly', async () => {
    render(<HealthDashboard />);
    
    // Get all buttons with this name and select the first one (Domain Server Health)
    const buttons = screen.getAllByRole('button', { name: /Check Server Health/i });
    const button = buttons[0];
    fireEvent.click(button);
    
    expect(mockCheckServerHealth).toHaveBeenCalledWith('domain');
    
    await waitFor(() => {
      expect(screen.getByText('Status: Healthy')).toBeInTheDocument();
    });
  });

  test('Domain database health check button works correctly', async () => {
    render(<HealthDashboard />);
    
    const buttons = screen.getAllByRole('button', { name: /Check Database Health/i });
    fireEvent.click(buttons[0]); // First database button is for domain tier
    
    expect(mockCheckDatabaseHealth).toHaveBeenCalledWith('domain');
    
    await waitFor(() => {
      expect(screen.getByText('Database:')).toBeInTheDocument();
      expect(screen.getByText('SQLite')).toBeInTheDocument();
    });
  });

  test('Edge server health check button works correctly', async () => {
    render(<HealthDashboard />);
    
    const buttons = screen.getAllByRole('button', { name: /Check Server Health/i });
    fireEvent.click(buttons[1]); // Second server button is for edge tier
    
    expect(mockCheckServerHealth).toHaveBeenCalledWith('edge');
    
    await waitFor(() => {
      expect(screen.getAllByText('Status: Healthy').length).toBeGreaterThanOrEqual(1);
    });
  });

  test('Edge database health check button works correctly', async () => {
    render(<HealthDashboard />);
    
    const buttons = screen.getAllByRole('button', { name: /Check Database Health/i });
    fireEvent.click(buttons[1]); // Second database button is for edge tier
    
    expect(mockCheckDatabaseHealth).toHaveBeenCalledWith('edge');
    
    await waitFor(() => {
      expect(screen.getAllByText('Database:').length).toBeGreaterThanOrEqual(1);
    });
  });

  test('Handles error from domain server health check API', async () => {
    mockCheckServerHealth.mockRejectedValue(new Error('Domain API Error'));
    
    render(<HealthDashboard />);
    
    // Get all buttons with this name and select the first one (Domain Server Health)
    const buttons = screen.getAllByRole('button', { name: /Check Server Health/i });
    const button = buttons[0];
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Domain API Error')).toBeInTheDocument();
    });
  });

  test('Handles error from edge server health check API', async () => {
    mockCheckServerHealth.mockRejectedValue(new Error('Edge API Error'));
    
    render(<HealthDashboard />);
    
    // Get the second button (Edge Server Health)
    const buttons = screen.getAllByRole('button', { name: /Check Server Health/i });
    const button = buttons[1]; // Second button is for edge tier
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Edge API Error')).toBeInTheDocument();
    });
  });

  test('Handles error from domain database health check API', async () => {
    mockCheckDatabaseHealth.mockRejectedValue(new Error('Domain DB Error'));
    
    render(<HealthDashboard />);
    
    // Get the first database health check button (Domain Database Health)
    const buttons = screen.getAllByRole('button', { name: /Check Database Health/i });
    const button = buttons[0]; // First button is for domain tier
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Domain DB Error')).toBeInTheDocument();
    });
  });

  test('Handles error from edge database health check API', async () => {
    mockCheckDatabaseHealth.mockRejectedValue(new Error('Edge DB Error'));
    
    render(<HealthDashboard />);
    
    // Get the second database health check button (Edge Database Health)
    const buttons = screen.getAllByRole('button', { name: /Check Database Health/i });
    const button = buttons[1]; // Second button is for edge tier
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Edge DB Error')).toBeInTheDocument();
    });
  });
});
