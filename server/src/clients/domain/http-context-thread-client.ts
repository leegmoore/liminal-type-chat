import axios, { AxiosInstance } from 'axios';
import { 
  ContextThread, 
  CreateContextThreadParams, 
  Message, 
  UpdateContextThreadParams 
} from '../../types/domain';
import { ContextThreadClient } from './context-thread-client';

/**
 * HTTP client for the Context Thread domain service
 * Makes HTTP requests to the domain API
 */
export class HttpContextThreadClient implements ContextThreadClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get a list of context threads
   * @param limit Maximum number of context threads to return
   * @param offset Number of context threads to skip
   * @returns Promise resolving to context threads array
   */
  async getThreads(limit = 20, offset = 0): Promise<ContextThread[]> {
    const response = await this.client.get('/api/v1/domain/threads', {
      params: { limit, offset },
    });
    return response.data.threads;
  }

  /**
   * Get a context thread by ID
   * @param id ContextThread ID
   * @returns Promise resolving to context thread or null if not found
   */
  async getContextThread(id: string): Promise<ContextThread | null> {
    try {
      const response = await this.client.get(`/api/v1/domain/threads/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a new context thread
   * @param params ContextThread creation parameters
   * @returns Promise resolving to created context thread
   */
  async createContextThread(params: CreateContextThreadParams): Promise<ContextThread> {
    const response = await this.client.post('/api/v1/domain/threads', params);
    return response.data;
  }

  /**
   * Update a context thread
   * @param id ContextThread ID
   * @param params ContextThread update parameters
   * @returns Promise resolving to updated context thread or null if not found
   */
  async updateContextThread(
    id: string, 
    params: Partial<UpdateContextThreadParams>
  ): Promise<ContextThread | null> {
    try {
      const response = await this.client.put(`/api/v1/domain/threads/${id}`, params);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete a context thread
   * @param id ContextThread ID
   * @returns Promise resolving to true if deleted, false if not found
   */
  async deleteContextThread(id: string): Promise<boolean> {
    try {
      await this.client.delete(`/api/v1/domain/threads/${id}`);
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Add a message to an existing context thread by thread ID
   * @param threadId ContextThread ID
   * @param message Message to add
   * @returns The updated context thread with the new message, or null if thread not found
   */
  async addMessageToContextThread(
    threadId: string, 
    message: Omit<Message, 'id' | 'threadId'>
  ): Promise<ContextThread | null> {
    try {
      const endpoint = `/api/v1/domain/threads/${threadId}/messages`;
      const response = await this.client.post(endpoint, message);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}
