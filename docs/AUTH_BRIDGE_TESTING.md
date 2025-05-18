# Authentication Bridge Manual Testing Guide

This document outlines the steps to manually test the Edge-Domain Authentication Bridge implemented in Phase 3 of the security hardening milestone (Milestone 0009).

## Overview

The Edge-Domain Authentication Bridge creates a secure separation between client-facing edge APIs and internal domain services. This testing guide will help verify that all aspects of this security boundary are working correctly.

## Prerequisites

1. The server is running on port 8765
2. The client is running on port 5173
3. GitHub OAuth is properly configured with the correct client ID and secret
4. You have a GitHub account for testing OAuth

## Test Scenarios

### Test 1: Edge Authentication Flow with GitHub OAuth and PKCE

**Objective**: Verify the complete OAuth flow with PKCE protection works correctly.

**Steps**:
1. Open your browser and navigate to http://localhost:5173
2. Click on the "Sign In" button in the header
3. You should be redirected to the GitHub authorization page
4. Authorize the application
5. You should be redirected back to the application and automatically logged in
6. Verify that you see your GitHub username in the header

**Expected Results**:
- The login process completes successfully
- Your GitHub profile information is displayed in the UI
- You can access protected routes
- Check network tab to verify the PKCE flow (authorization request should include code_challenge)

### Test 2: Edge to Domain Token Exchange

**Objective**: Verify that edge tokens are properly exchanged for domain tokens when accessing domain endpoints.

**Steps**:
1. Open the browser console (F12 or right-click > Inspect > Console)
2. Create a new conversation or access an existing one
3. Check the network requests when accessing conversation data (filter for requests to /api/v1/domain endpoints)
4. Verify that requests to domain endpoints include a "Bearer" token in the Authorization header
5. Compare this token with the edge token (stored in localStorage)

**Expected Results**:
- Network requests to domain endpoints should use a different JWT token than edge endpoints
- All authenticated requests should succeed
- The domain token should have additional domain-specific scopes
- The domain token should be signed with the appropriate environment key

### Test 3: Security Headers Implementation

**Objective**: Verify that appropriate security headers are being set based on the environment.

**Steps**:
1. Open the browser developer tools (F12)
2. Go to the Network tab
3. Refresh the page
4. Select any request to the backend server
5. Check the response headers
6. Verify the presence of security headers:
   - Content-Security-Policy
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection
   - Referrer-Policy

**Expected Results**:
- All security headers should be present with appropriate values
- In local/development environments, some policies may be relaxed
- CSP should include necessary domains for API communication

### Test 4: Error Handling and Token Validation

**Objective**: Verify that the system properly handles invalid or expired tokens.

**Steps**:
1. Manually modify a JWT token in local storage to be invalid:
   - Open DevTools > Application > Local Storage
   - Modify a character in the stored JWT token
2. Attempt to access a protected route
3. You should be automatically logged out or prompted to log in again
4. Check the console for appropriate error messages

**Expected Results**:
- The application should gracefully handle invalid tokens
- Appropriate error messages should be displayed
- The user should be redirected to the login page

### Test 5: Token Scopes and Permissions

**Objective**: Verify that token scopes properly control access to resources.

**Steps**:
1. Log in to the application
2. Try to access different levels of protected functionality:
   - Reading conversations (basic permission)
   - Creating a new conversation (write permission)
   - Accessing admin functionality (if available)
3. Use the network tab to inspect responses

**Expected Results**:
- You should only have access to functions permitted by your token's scopes
- Attempting to access unauthorized functions should show appropriate error messages
- Domain tokens should include all necessary scopes for domain operations

### Test 6: Environment-based Security

**Objective**: Verify that security measures are appropriately enforced based on the environment.

**Steps**:
1. In local environment:
   - Check if security bypasses work when configured
   - Verify development routes are accessible

2. In production-like environment (requires changing environment settings):
   - Verify all security measures are strictly enforced
   - Verify development routes are inaccessible
   - Check that security bypass flags are ignored

**Expected Results**:
- Security levels should differ appropriately between environments
- Production-like environments should enforce the strictest security measures
- Development conveniences should only be available in local environments

## Testing the Integrated Flow

1. Start with a clean session (clear localStorage and cookies)
2. Sign in with GitHub OAuth
3. Create a new conversation
4. Add messages to the conversation
5. Navigate to a different page and back
6. Verify authentication persists appropriately
7. Sign out
8. Verify you can no longer access protected resources

## Troubleshooting Common Issues

- **OAuth Redirect Issues**: Check that redirect URIs match exactly between GitHub config and application
- **Token Validation Errors**: Check environment configuration and key generation
- **CORS Errors**: Verify security headers are not blocking legitimate requests
- **JWT Issues**: Use a JWT debugger to inspect token contents and verify claims

## Reporting Issues

If you encounter any issues during testing, please document:
1. The specific test that failed
2. The expected vs. actual behavior
3. Any error messages displayed (console, network responses)
4. Steps to reproduce the issue
5. Browser and environment information
6. Any relevant network requests/responses

Submit this information to the development team for resolution.

## Verification Checklist

- [ ] GitHub OAuth login with PKCE works correctly
- [ ] Edge tokens are properly validated
- [ ] Domain tokens are generated with appropriate scopes
- [ ] Security headers are properly set
- [ ] Token validation rejects invalid tokens
- [ ] Permissions are properly enforced
- [ ] Environment-specific security works as expected
- [ ] Error handling is graceful and user-friendly