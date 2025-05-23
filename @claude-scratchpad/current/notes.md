# OAuth Testing Notes

## Observations
- OAuth flow completed instantly (page flicker)
- Authorization code received without manual GitHub interaction
- This suggests BYPASS_AUTH might be affecting OAuth flow too
- PKCE is properly enabled and code_verifier is being used

## Current State
- Have authorization code: d1c1199c20520c2991c1
- State matches (CSRF protection working)
- Token exchange successful (200 response, 153 bytes)
- React rendering error on displaying results

## React Error
- Same error the previous Claude encountered
- "Objects are not valid as a React child (found: object with keys {})"
- We already have the fix for empty tokenInfo
- Error might be from a different empty object being rendered

## Debugging Attempt
- Added console.log to see token exchange response
- Need to check what's in the user object
- Possible issue: profileImageUrl might be an object instead of string/null

## Root Cause Found
- Token is being returned as empty object {} instead of string
- This is causing React rendering error
- Server response: `"token": {}`
- JWT service might not be properly initialized or generateToken is returning empty object

## ACTUAL Root Cause
- generateToken returns a Promise<string>, not a string
- The code wasn't awaiting the promise
- The empty object {} was actually an unresolved Promise
- Fixed by adding `await` before jwtService.generateToken()

## Next Steps When Continuing
1. Verify server is running (check with `npm run api -- /api/v1/edge/health`)
2. Go to http://localhost:5173/auth-tester
3. Try the OAuth flow again - should now get a proper JWT token string
4. Continue with auth bridge testing per AUTH_BRIDGE_TESTING.md