/**
 * Global error handling middleware
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { SystemErrorCode } from '../utils/error-codes';

/**
 * Global error handling middleware
 * @param err - Error object
 * @param _req - Express request object (unused)
 * @param res - Express response object
 * @param _next - Express next function (unused)
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Safely extract error properties
  const errorObj = err as Error;
  const message = errorObj && errorObj.message ? errorObj.message : 'Unknown error';
  const stack = errorObj && errorObj.stack ? errorObj.stack : undefined;
  
  // Log error (with stack trace in non-production environments)
  if (process.env.NODE_ENV !== 'production') {
    console.error(`Error: ${message}`);
    if (stack) {
      console.error(stack);
    }
  } else {
    // In production, log less verbose details
    console.error(`Error occurred: ${message}`);
  }

  // Handle different error types
  if (err instanceof AppError) {
    // Return standardized error format for known application errors
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle unknown errors by wrapping them in an AppError
  const unknownError = new AppError(
    SystemErrorCode.UNKNOWN_ERROR,
    'Internal server error',
    process.env.NODE_ENV !== 'production' ? message : undefined
  );

  return res.status(unknownError.statusCode).json(unknownError.toJSON());
}
