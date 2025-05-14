/**
 * Type declarations for Express Request
 */
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