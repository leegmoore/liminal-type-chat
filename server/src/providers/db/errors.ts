/**
 * Custom error thrown when the messages JSON data stored in the database
 * for a ContextThread is corrupted and cannot be parsed.
 */
export class MessagesCorruptedError extends Error {
  cause?: unknown;

  constructor(threadId: string, originalError?: unknown) {
    super(
      `Messages data for ContextThread (ID: ${threadId}) is corrupted and cannot be parsed.`
    );
    this.name = 'MessagesCorruptedError';
    // If an original error is provided (e.g., from JSON.parse), store it
    if (originalError instanceof Error) {
      this.cause = originalError;
    }
    // Ensure the prototype chain is correct for instanceof checks
    Object.setPrototypeOf(this, MessagesCorruptedError.prototype);
  }
}
