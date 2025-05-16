/**
 * Helper utilities for Server-Sent Events (SSE) streaming
 */
import { Response } from 'express';

/**
 * Set up SSE response headers with proper CORS configuration
 * @param res Express response object
 */
export function setupSseHeaders(res: Response): void {
  // Basic SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  
  // CORS headers needed for EventSource
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Disable nginx buffering if behind nginx
  res.setHeader('X-Accel-Buffering', 'no');
}

/**
 * Send data directly as an SSE event
 * Format is compatible with EventSource.onmessage handler
 * @param res Express response object
 * @param data Data to send (will be JSON stringified)
 */
export function sendSseData(res: Response, data: unknown): void {
  // Format for EventSource.onmessage - just send the raw data
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  
  // Ensure data is flushed immediately
  const responseWithFlush = res as Response & { flush?: () => void };
  if (typeof responseWithFlush.flush === 'function') {
    responseWithFlush.flush();
  }
}

/**
 * Send an error as an SSE event
 * @param res Express response object
 * @param message Error message
 * @param details Additional error details
 */
export function sendSseError(res: Response, message: string, details?: string): void {
  const errorData = {
    error: true,
    message,
    details: details || 'Unknown error'
  };
  
  sendSseData(res, errorData);
}
