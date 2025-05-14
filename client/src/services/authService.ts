/**
 * Authentication service for managing tokens and API authorization
 */
import axios from 'axios';

// API base URL - uses proxy in development
const apiBaseUrl = '/api/v1';

// Token storage keys
const TOKEN_STORAGE_KEY = 'liminal_auth_token';

/**
 * Store the authentication token in local storage
 * @param token - JWT token to store
 */
export const storeAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  
  // Configure axios global defaults to include the token in future requests
  setAuthHeader(token);
};

/**
 * Retrieve the stored authentication token
 * @returns The stored JWT token or null if not found
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * Remove the stored authentication token (logout)
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  
  // Clear auth header from axios defaults
  delete axios.defaults.headers.common['Authorization'];
};

/**
 * Set the Authorization header for all axios requests
 * @param token - JWT token to set in the Authorization header
 */
export const setAuthHeader = (token: string): void => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

/**
 * Initialize authentication from stored token (call on app start)
 * @returns Whether a valid token was found and restored
 */
export const initializeAuth = (): boolean => {
  const token = getAuthToken();
  if (token) {
    setAuthHeader(token);
    return true;
  }
  return false;
};

/**
 * Register a new user
 * @param email - User email
 * @param password - User password
 * @param name - User name
 */
export const register = async (
  email: string, 
  password: string, 
  name: string
): Promise<void> => {
  const response = await axios.post(`${apiBaseUrl}/auth/register`, {
    email,
    password,
    name
  });
  
  if (response.data?.token) {
    storeAuthToken(response.data.token);
  }
};

/**
 * Log in an existing user
 * @param email - User email
 * @param password - User password
 */
export const login = async (
  email: string, 
  password: string
): Promise<void> => {
  const response = await axios.post(`${apiBaseUrl}/auth/login`, {
    email,
    password
  });
  
  if (response.data?.token) {
    storeAuthToken(response.data.token);
  }
};

/**
 * Guest login/demo mode for testing without authentication
 * Creates a temporary demo user account and logs in
 */
export const loginAsGuest = async (): Promise<void> => {
  try {
    // In development mode with bypass authentication, we can generate a token locally
    if (process.env.NODE_ENV === 'development') {
      // Create a simple mock token (this is only for local development testing)
      const mockToken = 'dev.token.forTestingOnly';
      storeAuthToken(mockToken);
      console.log('Logged in as guest user in development mode');
      return;
    }
    
    // For production, we'd use the server's endpoint
    // Generate a unique demo email
    const timestamp = new Date().getTime();
    const demoEmail = `demo-${timestamp}@liminal-type-chat.local`;
    
    try {
      // Try to use a guest login endpoint if available
      const response = await axios.post(`${apiBaseUrl}/auth/guest-login`);
      if (response.data?.token) {
        storeAuthToken(response.data.token);
        console.log('Logged in as guest user via server endpoint');
        return;
      }
    } catch (guestError) {
      console.warn('Guest login endpoint not available, falling back to registration:', guestError);
    }
    
    // Fallback: try register endpoint
    await register(demoEmail, `demo-${timestamp}`, 'Demo User');
    
    console.log('Logged in as demo user via registration');
  } catch (error) {
    console.error('Failed to create demo account:', error);
    throw new Error('Demo login failed');
  }
};
