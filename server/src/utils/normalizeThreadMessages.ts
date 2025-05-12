import { Message } from '../types/domain';

/**
 * Normalizes a thread's messages array by sorting by createdAt timestamp.
 * 
 * This utility is initially responsible only for simple sorting by createdAt.
 * In future milestones, it will be enhanced to handle more complex logic like
 * reconciling messages with different status values, handling race conditions,
 * and dealing with streaming interruptions.
 * 
 * @param messages The array of messages to normalize
 * @returns A new sorted array of messages
 */
export function normalizeThreadMessages(messages: Message[]): Message[] {
  if (!messages || messages.length === 0) {
    return [];
  }

  // Create a shallow copy to avoid mutating the original array
  return [...messages].sort((a, b) => a.createdAt - b.createdAt);
}
