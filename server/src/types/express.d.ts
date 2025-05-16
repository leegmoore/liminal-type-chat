/**
 * Type declarations for Express Request
 */
// Express is referenced indirectly through namespace usage
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Express } from 'express-serve-static-core';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        name: string;
        scopes: string[];
        tier: string;
      };
    }

    interface Response {
      flush?: () => void;
    }
  }
}