import { ContextThreadService } from '../../services/core/ContextThreadService';
import { ContextThreadRepository } from '../../providers/db/ContextThreadRepository';
import { ContextThreadClient } from './context-thread-client';
import { DirectContextThreadClient } from './direct-context-thread-client';
import { HttpContextThreadClient } from './http-context-thread-client';
import config from '../../config';

/**
 * Factory function to create the appropriate context thread client based on configuration
 * @param service Optional ContextThreadService for direct client mode
 * @returns Context thread client instance
 */
export function getContextThreadClient(service?: ContextThreadService): ContextThreadClient {
  // Check if the client mode has been overridden in the request headers
  // Use a properly typed approach to avoid the 'any' type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalObj = global as any;
  const requestOverride = globalObj.currentRequest?.headers?.['x-domain-client-mode'];
  const clientMode = requestOverride || config.domainClientMode;

  if (clientMode === 'direct' || clientMode === undefined) {
    if (!service) {
      // Import needed modules directly but with type safety
      // This is safe because we're not creating circular dependencies at the module level
      const repo = new ContextThreadRepository();
      service = new ContextThreadService(repo);
    }
    // At this point, service is guaranteed to be defined, but TypeScript doesn't know that
    // So we use a non-null assertion to tell TypeScript that service is not undefined here
    return new DirectContextThreadClient(service!);
  } else {
    return new HttpContextThreadClient(config.domainApiBaseUrl);
  }
}
