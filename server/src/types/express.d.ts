/**
 * Type declarations for Express Request
 */
// Express is referenced indirectly through namespace usage
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Express } from 'express-serve-static-core';

declare global {
  namespace Express {
    // Phase 1: Auth removed - Request extension no longer needed
    
    interface Response {
      flush?: () => void;
    }
  }
}