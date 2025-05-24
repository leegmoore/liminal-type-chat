const axios = require('axios');

async function testCookieAuth() {
  // Create axios instance with cookie support
  const client = axios.create({
    baseURL: 'http://localhost:8765',
    withCredentials: true,
    // Use axios-cookiejar-support for cookie handling
    jar: true
  });

  try {
    // 1. Test logout to clear any existing cookies
    console.log('1. Testing logout endpoint...');
    const logoutRes = await client.post('/api/v1/auth/logout');
    console.log('Logout response:', logoutRes.data);

    // 2. Simulate getting a token (in real flow this would be OAuth)
    // For testing, we'll use the existing token from localStorage if available
    const testToken = process.env.TEST_TOKEN || 'your-test-token-here';
    
    // 3. Test token refresh which should set a cookie
    console.log('\n2. Testing token refresh (which sets cookie)...');
    try {
      const refreshRes = await client.post('/api/v1/auth/token/refresh', {
        token: testToken
      });
      console.log('Refresh response:', refreshRes.data);
      
      // Check if cookie was set
      const cookies = refreshRes.headers['set-cookie'];
      console.log('Cookies set:', cookies);
    } catch (error) {
      console.error('Token refresh failed:', error.response?.data || error.message);
      console.log('\nNote: You need a valid token to test cookie auth.');
      console.log('You can get one by going through the OAuth flow first.');
      return;
    }

    // 4. Test accessing a protected endpoint using cookie auth
    console.log('\n3. Testing protected endpoint with cookie auth...');
    // Remove Authorization header to ensure we're using cookie
    delete client.defaults.headers.common['Authorization'];
    
    const conversationsRes = await client.get('/api/v1/conversations');
    console.log('Conversations response:', {
      status: conversationsRes.status,
      data: conversationsRes.data
    });
    
    console.log('\n✅ Cookie authentication is working!');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testCookieAuth();