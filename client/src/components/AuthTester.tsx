import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Input,
  Switch,
  FormControl,
  FormLabel,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  Code,
  VStack,
  FormHelperText
} from '@chakra-ui/react';

// Server API URL - adjust as needed
// Vite uses import.meta.env instead of process.env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8765';

/**
 * Auth testing component that provides UI for testing OAuth flows
 */
const AuthTester: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [redirectUri, setRedirectUri] = useState(
    `${window.location.origin}/auth-tester`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authState, setAuthState] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [usePkce, setUsePkce] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<Record<string, unknown> | null>(null);
  
  // Parse query parameters on initial load and after redirects
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    
    if (code) {
      setAuthCode(code);
      // Clear the URL to avoid re-processing on refresh
      navigate('/auth-tester', { replace: true });
    }
    
    if (state) {
      setAuthState(state);
    }
    
    if (error) {
      setError(`OAuth error: ${error}`);
    }
  }, [location.search, navigate]);
  
  /**
   * Start OAuth authorization flow with GitHub
   */
  const startGitHubAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`${API_URL}/api/v1/auth/oauth/github/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          redirectUri,
          usePkce
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to start auth flow');
      }
      
      const data = await response.json();
      
      // Store state in localStorage for verification after redirect
      localStorage.setItem('auth_state', data.state);
      localStorage.setItem('auth_pkce_enabled', String(data.pkceEnabled));
      
      // Redirect to GitHub login
      window.location.href = data.authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start auth flow');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exchange code for token
   */
  const exchangeCodeForToken = async () => {
    if (!authCode || !authState) {
      setError('Missing authorization code or state');
      return;
    }
    
    // Verify state matches what we stored before redirect
    const storedState = localStorage.getItem('auth_state');
    if (storedState !== authState) {
      setError('State mismatch! Possible CSRF attack.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`${API_URL}/api/v1/auth/oauth/github/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: authCode,
          redirectUri,
          state: authState
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to exchange code for token');
      }
      
      const data = await response.json();
      console.log('Token exchange response:', JSON.stringify(data, null, 2));
      
      // Handle case where token might be an empty object
      let tokenValue = '';
      if (typeof data.token === 'string' && data.token) {
        tokenValue = data.token;
      } else if (data.token && typeof data.token === 'object') {
        console.error('Received token as object from server:', data.token);
        throw new Error(`Server returned token as object: ${JSON.stringify(data.token)}`);
      } else if (!data.token) {
        console.error('No token in response');
        throw new Error('Server did not return a token');
      } else {
        console.error('Invalid token type:', typeof data.token, data.token);
        throw new Error(`Server returned invalid token type: ${typeof data.token}`);
      }
      
      setToken(tokenValue);
      setTokenInfo(data.user || {});
      setSuccess('Successfully obtained token!');
      
      // Clear code and state
      setAuthCode(null);
      setAuthState(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to exchange code for token');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Parse JWT token to display its contents
   */
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return { error: 'Invalid token format' };
    }
  };

  /**
   * Clean up expired PKCE sessions
   */
  const cleanupSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`${API_URL}/api/v1/auth/maintenance/cleanup-sessions`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to clean up sessions');
      }
      
      setSuccess('Expired sessions cleaned up successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clean up sessions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="800px" mx="auto" p={4}>
      <Heading as="h1" mb={6}>
        OAuth PKCE Authentication Tester
      </Heading>
      
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <Spinner size="lg" />
        </Box>
      )}
      
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert status="success" mb={4}>
          <AlertIcon />
          {success}
        </Alert>
      )}
      
      <Card mb={6} variant="outline">
        <CardHeader>
          <Heading size="md">Step 1: Configure Authentication</Heading>
        </CardHeader>
        <CardBody>
          <VStack align="start" spacing={4}>
            <FormControl>
              <FormLabel>Redirect URI</FormLabel>
              <Input 
                value={redirectUri}
                onChange={e => setRedirectUri(e.target.value)}
              />
              <FormHelperText>
                This should match the redirect URI configured in your GitHub OAuth App
              </FormHelperText>
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="pkce-switch" mb="0">
                Use PKCE (recommended)
              </FormLabel>
              <Switch 
                id="pkce-switch"
                isChecked={usePkce} 
                onChange={(e) => setUsePkce(e.target.checked)} 
              />
            </FormControl>
            
            <Button 
              colorScheme="blue" 
              onClick={startGitHubAuth}
              isLoading={loading}
            >
              Start GitHub Authentication
            </Button>
          </VStack>
        </CardBody>
      </Card>
      
      {authCode && (
        <Card mb={6} variant="outline">
          <CardHeader>
            <Heading size="md">Step 2: Exchange Code for Token</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="start" spacing={2} mb={4}>
              <Text>
                <strong>Code:</strong> {authCode}
              </Text>
              <Text>
                <strong>State:</strong> {authState}
              </Text>
              <Text>
                <strong>PKCE Enabled:</strong> {String(
                  localStorage.getItem('auth_pkce_enabled') || 'unknown'
                )}
              </Text>
            </VStack>
            
            <Button 
              colorScheme="blue" 
              onClick={exchangeCodeForToken}
              isLoading={loading}
            >
              Exchange Code for Token
            </Button>
          </CardBody>
        </Card>
      )}
      
      {token && (
        <Card mb={6} variant="outline">
          <CardHeader>
            <Heading size="md">Authentication Result</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="start" spacing={4} width="100%">
              <Box width="100%">
                <Text fontWeight="bold" mb={2}>JWT Token:</Text>
                <Code p={2} width="100%" overflowX="auto" whiteSpace="nowrap">
                  {token || ''}
                </Code>
              </Box>
              
              <Divider />
              
              <Box width="100%">
                <Text fontWeight="bold" mb={2}>Token Payload:</Text>
                <Code display="block" p={2} width="100%" overflowX="auto" whiteSpace="pre">
                  {token ? JSON.stringify(parseJwt(token), null, 2) : ''}
                </Code>
              </Box>
              
              <Divider />
              
              {tokenInfo && Object.keys(tokenInfo).length > 0 && (
                <Box width="100%">
                  <Text fontWeight="bold" mb={2}>User Info:</Text>
                  <Code display="block" p={2} width="100%" overflowX="auto" whiteSpace="pre">
                    {JSON.stringify(tokenInfo, (key, value) => {
                      // Filter out any empty objects to prevent React rendering errors
                      if (value && typeof value === 'object' && Object.keys(value).length === 0) {
                        return undefined;
                      }
                      return value;
                    }, 2)}
                  </Code>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}
      
      <Card variant="outline">
        <CardHeader>
          <Heading size="md">Maintenance</Heading>
        </CardHeader>
        <CardBody>
          <Button 
            colorScheme="blue" 
            variant="outline"
            onClick={cleanupSessions}
            isLoading={loading}
          >
            Clean Up Expired PKCE Sessions
          </Button>
        </CardBody>
      </Card>
    </Box>
  );
};

export default AuthTester;