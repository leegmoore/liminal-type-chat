/**
 * Authentication providers module exports
 */

// Core interfaces
export * from './IOAuthProvider';
export * from './bridge/IAuthBridgeService';

// Provider factories
export * from './OAuthProviderFactory';
export * from './bridge/AuthBridgeServiceFactory';

// Provider implementations
export * from './github/GitHubOAuthProvider';
export * from './bridge/AuthBridgeService';