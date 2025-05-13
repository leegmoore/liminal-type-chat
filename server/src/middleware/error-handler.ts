/**
 * Global error handling middleware
 */
import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationErrorItem } from '../utils/errors';
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
  // Simplified logging to avoid max-len and no-explicit-any issues
  if (err instanceof Error) {
    console.log(`ERR_HNDLR name: ${err.name}, msg: ${err.message.substring(0, 50)}`);
  } else {
    console.log('ERR_HNDLR RX_NON_ERR:', typeof err);
  }
  console.log('errorHandler: err instanceof AppError:', err instanceof AppError);

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

  // Enhanced helper to check if an error has AppError's shape
  const isAppErrorShape = (
    error: unknown
  ): error is {
    statusCode: number;
    errorCode: string; 
    message: string;   
    code: number;      
    details?: string;
    items?: ValidationErrorItem[];
    [key: string]: unknown;
  } => {
    if (error && typeof error === 'object') {
      const potentialError = error as { 
        statusCode?: unknown;
        errorCode?: unknown;
        message?: unknown;
        code?: unknown;
      };
      return (
        typeof potentialError.statusCode === 'number' &&
        typeof potentialError.errorCode === 'string' && 
        typeof potentialError.message === 'string' &&
        typeof potentialError.code === 'number'
      );
    }
    return false;
  };

  // Handle different error types based on shape
  if (isAppErrorShape(err)) {
    // Manually construct response from the error's properties
    const errorResponse = {
      error: {
        code: err.code,
        message: err.message,
        errorCode: err.errorCode, 
        ...(err.details && { details: err.details }), 
        ...(err.items && err.items.length > 0 && { items: err.items }),
      }
    };
    console.log('errorHandler sending AppError-like response:', JSON.stringify(errorResponse));
    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle unknown errors by wrapping them in a standard AppError
  console.log('errorHandler handling as unknown error');
  // If it's not an AppError or shape, wrap it
  const unknownError = new AppError(
    SystemErrorCode.UNKNOWN_ERROR,
    'Internal server error',
    process.env.NODE_ENV !== 'production' ? message : undefined
  );

  return res.status(unknownError.statusCode).json(unknownError.toJSON());
}
