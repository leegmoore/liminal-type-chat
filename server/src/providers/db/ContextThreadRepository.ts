import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { ContextThread, Message } from '../../types/domain';
import { MessagesCorruptedError } from './errors';

const DB_RELATIVE_PATH = '../../../db/liminal.db'; // Relative to dist/src/providers/db
const SCHEMA_RELATIVE_PATH = '../../db/schema.sql'; // Relative to src/providers/db

/**
 * Repository for ContextThread entities.
 * Handles CRUD operations and mapping between the database and domain models.
 */
export class ContextThreadRepository {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const absoluteDbPath = dbPath || path.join(__dirname, DB_RELATIVE_PATH);
    const dbDir = path.dirname(absoluteDbPath);

    // Ensure the database directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`Created database directory: ${dbDir}`);
    }

    // Initialize the database connection
    this.db = new Database(absoluteDbPath);
    console.log(`Database connected at: ${absoluteDbPath}`);

    // Ensure the table exists by running the schema
    this.applySchema();

    // Recommended settings for performance and safety
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
  }

  private applySchema(): void {
    try {
      const schemaPath = path.join(__dirname, SCHEMA_RELATIVE_PATH);
      const schema = fs.readFileSync(schemaPath, 'utf8');
      this.db.exec(schema);
      console.log('Database schema applied successfully.');
    } catch (error) {
      console.error('Failed to apply database schema:', error);
      throw new Error('Failed to initialize database schema.');
    }
  }

  // Helper to safely parse messages
  private parseMessages(messagesJson: string | null, threadId: string): Message[] {
    // Handle null or empty string case - return empty array
    if (messagesJson === null || messagesJson.trim() === '') {
      return [];
    }
    try {
      const parsed = JSON.parse(messagesJson);
      if (!Array.isArray(parsed)) {
        throw new Error('Parsed messages data is not an array.');
      }
      return parsed;
    } catch (error) {
      console.error(
        `Failed to parse messages JSON for thread ${threadId}:`,
        messagesJson,
        error
      );
      throw new MessagesCorruptedError(threadId, error);
    }
  }

  // Helper to safely parse metadata
  private parseMetadata(metadataJson: string | null): Record<string, unknown> | undefined {
    if (metadataJson === null || metadataJson.trim() === '') {
      return undefined; // Explicitly return undefined if no metadata
    }
    try {
      const parsed = JSON.parse(metadataJson);
      // Basic check: ensure it's an object (non-array, non-null)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Parsed metadata is not a valid object.');
      }
      return parsed;
    } catch (error) {
      console.error('Failed to parse metadata JSON:', metadataJson, error);
      // For metadata corruption, we'll return undefined and log the error
      return undefined;
    }
  }

  // Transform DB row to Domain object
  private toDomain(row: any): ContextThread | null { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      createdAt: row.created_at, // Assuming numbers are stored directly
      updatedAt: row.updated_at,
      metadata: this.parseMetadata(row.metadata),
      messages: this.parseMessages(row.messages, row.id),
    };
  }

  /**
   * Create a new context thread in the database.
   * @param threadData The thread data to insert
   * @returns The inserted thread
   */
  create(threadData: ContextThread): ContextThread {
    const sql = `
      INSERT INTO context_threads (id, title, created_at, updated_at, metadata, messages)
      VALUES (@id, @title, @createdAt, @updatedAt, @metadata, @messages)
    `;
    try {
      const stmt = this.db.prepare(sql);
      stmt.run({
        id: threadData.id,
        title: threadData.title ?? null, // Ensure null if undefined
        createdAt: threadData.createdAt,
        updatedAt: threadData.updatedAt,
        metadata: threadData.metadata ? JSON.stringify(threadData.metadata) : null,
        messages: JSON.stringify(threadData.messages || []), // Default to empty array if null/undefined
      });
      // Return the complete thread object as passed in, assuming successful insertion
      return threadData;
    } catch (error) {
      console.error('Failed to create context thread:', error);
      throw error;
    }
  }

  /**
   * Find a context thread by its ID.
   * @param id The ID of the thread to find
   * @returns The found thread or null if not found
   * @throws MessagesCorruptedError if the messages JSON is corrupted
   */
  findById(id: string): ContextThread | null {
    const sql = `SELECT * FROM context_threads WHERE id = ?`;
    try {
      const stmt = this.db.prepare(sql);
      const row = stmt.get(id);
      return this.toDomain(row);
    } catch (error) {
      // If the error is a MessagesCorruptedError, propagate it
      if (error instanceof MessagesCorruptedError) {
        throw error;
      }
      // Log error but return null, as find operation failure implies not found
      console.error(`Failed to find context thread by id ${id}:`, error);
      return null;
    }
  }

  /**
   * Update an existing context thread.
   * @param thread The thread data to update
   * @returns The updated thread or null if not found
   */
  update(thread: ContextThread): ContextThread | null {
    const sql = `
      UPDATE context_threads
      SET title = @title,
          updated_at = @updatedAt,
          metadata = @metadata,
          messages = @messages
      WHERE id = @id
    `;
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run({
        id: thread.id,
        title: thread.title ?? null,
        updatedAt: thread.updatedAt, // Assumes service layer updated this
        metadata: thread.metadata ? JSON.stringify(thread.metadata) : null,
        messages: JSON.stringify(thread.messages || []),
      });

      if (result.changes === 0) {
        // No rows updated, likely means the ID didn't exist
        return null;
      }
      // Return the updated thread object as passed in
      return thread;
    } catch (error) {
      console.error(`Failed to update context thread ${thread.id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a context thread by its ID.
   * @param id The ID of the thread to delete
   * @returns True if the thread was deleted, false if not found
   */
  delete(id: string): boolean {
    const sql = `DELETE FROM context_threads WHERE id = ?`;
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(id);
      return result.changes > 0; // Return true if a row was deleted
    } catch (error) {
      console.error(`Failed to delete context thread ${id}:`, error);
      throw error;
    }
  }

  /**
   * Close the database connection.
   */
  close(): void {
    if (this.db) {
      this.db.close();
      console.log('Database connection closed.');
    }
  }
}
