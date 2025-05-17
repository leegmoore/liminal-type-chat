# Testing OAuth with PKCE

This document provides instructions for testing the OAuth with PKCE implementation in Liminal Type Chat.

## Prerequisites

1. Create a GitHub OAuth application
2. Configure the server and client
3. Start both the server and client applications

## Creating a GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Create a new OAuth App with these settings:
   - **Application name**: Liminal Type Chat (Development)
   - **Homepage URL**: http://localhost:5173
   - **Authorization callback URL**: http://localhost:5173/auth-tester
   - **Description**: (Optional) Local development OAuth app for Liminal Type Chat

3. After registering, GitHub will display your Client ID
4. Generate a new client secret by clicking "Generate a new client secret"
5. Save both the Client ID and Client Secret securely - you'll need them for configuration

## Configuration

### Server Configuration

1. Open `/server/.env.local`
2. Update the GitHub OAuth credentials:
   ```
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```
3. Ensure CORS is properly configured:
   ```
   CORS_ORIGIN=http://localhost:5173
   ```

### Client Configuration

1. Ensure the client has the correct API URL in `/client/.env.local`:
   ```
   REACT_APP_API_URL=http://localhost:8765
   ```

## Running the Tests

1. Start the server:
   ```
   cd server
   npm run dev
   ```

2. In a separate terminal, start the client:
   ```
   cd client
   npm run dev
   ```

3. Navigate to http://localhost:5173/auth-tester in your browser
4. Use the Auth Tester interface to test the OAuth flow:
   - Click "Start GitHub Authentication"
   - Authorize the application on GitHub
   - You will be redirected back to the Auth Tester page
   - Click "Exchange Code for Token" to complete the flow
   - The interface will display the JWT token and user information

## Troubleshooting

If you encounter issues:

1. **"The site can't be reached"**: 
   - Check that both servers are running
   - Verify port configurations match (client on 5173, server on 8765)

2. **CORS errors**:
   - Ensure CORS_ORIGIN in `.env.local` matches the client URL exactly
   - Check browser console for specific CORS error messages

3. **OAuth Authentication Failures**:
   - Verify your GitHub OAuth App configuration
   - Ensure the callback URL is exactly http://localhost:5173/auth-tester
   - Check that client ID and secret are correctly set in `.env.local`

4. **Invalid State Errors**:
   - Clear your browser's localStorage
   - Try the flow again from the beginning

5. **Token Exchange Failures**:
   - Check server logs for more detailed error messages
   - Verify that PKCE verification is working as expected

## Technical Details

The implementation uses:

- PKCE (Proof Key for Code Exchange) for enhanced security
- S256 (SHA-256) code challenge method
- State parameter for CSRF protection
- JWT tokens for authentication after OAuth login
- In-memory storage for PKCE sessions

The Auth Tester component provides:
- Options to enable/disable PKCE (PKCE is recommended and enabled by default)
- Details about the authentication flow
- Token inspection tools
- Session cleanup functionality