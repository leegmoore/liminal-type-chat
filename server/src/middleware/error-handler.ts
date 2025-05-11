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
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error (with stack trace in non-production environments)
  if (process.env.NODE_ENV !== 'production') {
    console.error(`Error: ${err.message}`);
    console.error(err.stack);
  } else {
    // In production, log less verbose details
    console.error(`Error occurred: ${err.message}`);
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
    process.env.NODE_ENV !== 'production' ? err.message : undefined
  );

  return res.status(unknownError.statusCode).json(unknownError.toJSON());
}
