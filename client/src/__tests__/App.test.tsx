import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the Header, Footer, and HealthDashboard components
jest.mock('../components/Header', () => () => (
  <div data-testid="mock-header">Header Component</div>
));
jest.mock('../components/Footer', () => () => (
  <div data-testid="mock-footer">Footer Component</div>
));
jest.mock('../pages/HealthDashboard', () => () => (
  <div data-testid="mock-dashboard">Dashboard Component</div>
));

describe('App', () => {
  test('renders all main components in correct layout', () => {
    render(<App />);
    
    // Check that all components are rendered
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    expect(screen.getByTestId('mock-dashboard')).toBeInTheDocument();
    
    // Check for main element
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
  });
});
