/**
 * Global error handling middleware
 */
import { Request, Response, NextFunction } from 'express';
import config from '../config';

/**
 * Error response structure
 */
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  stack?: string;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  
  const errorResponse: ErrorResponse = {
    error: statusCode === 500 ? 'Internal Server Error' : err.name,
    message: err.message || 'Something went wrong',
    statusCode,
  };
  
  // Include stack trace in development mode
  if (config.isDevelopment) {
    errorResponse.stack = err.stack;
  }
  
  console.error(`[Error] ${errorResponse.error}: ${errorResponse.message}`);
  if (err.stack) {
    console.error(err.stack);
  }
  
  res.status(statusCode).json(errorResponse);
};
