import Database from 'better-sqlite3';
import { DatabaseProvider, Transaction } from './database-provider';
import { DatabaseError } from '../../utils/errors';

/**
 * Implementation of the DatabaseProvider interface for SQLite
 */
export class SQLiteProvider implements DatabaseProvider {
  private db: Database.Database | null = null;
  private dbPath: string;
  
  /**
   * Create a new SQLiteProvider
   * @param dbPath - Path to the SQLite database file
   */
  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }
  
  /**
   * Initialize the database connection and schema
   */
  async initialize(): Promise<void> {
    try {
      // Open database connection
      this.db = new Database(this.dbPath);
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Create tables if they don't exist
      this.createTables();
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(this.handleError(error, 'Database initialization failed'));
    }
  }
  
  /**
   * Execute a query that returns rows
   * @param sql - SQL statement to execute
   * @param params - Parameters for the prepared statement
   * @returns Promise resolving with array of rows from the query result
   */
  async query<T>(sql: string, params: (string | number | boolean | null)[] = []): Promise<T[]> {
    try {
      if (!this.db) {
        throw new Error('Database connection not initialized');
      }
      
      const statement = this.db.prepare(sql);
      
      // For SELECT statements
      const isSelect = sql.trim().toLowerCase().startsWith('select');
      if (isSelect) {
        const rows = statement.all(...params) as T[];
        return Promise.resolve(rows);
      } else {
        statement.run(...params);
        return Promise.resolve([]);
      }
    } catch (error) {
      return Promise.reject(this.handleError(error, 'Query execution failed'));
    }
  }
  
  /**
   * Execute a query that returns no rows
   * @param sql - SQL statement to execute
   * @param params - Parameters for the prepared statement
   * @returns Promise resolving with number of rows affected
   */
  async exec(sql: string, params: (string | number | boolean | null)[] = []): Promise<number> {
    try {
      if (!this.db) {
        throw new Error('Database connection not initialized');
      }
      
      const statement = this.db.prepare(sql);
      const info = statement.run(...params);
      
      return Promise.resolve(info.changes);
    } catch (error) {
      return Promise.reject(this.handleError(error, 'Statement execution failed'));
    }
  }
  
  /**
   * Execute operations within a transaction
   * @param fn - Function to execute within the transaction
   * @returns Promise resolving with the result of the transaction function
   */
  async transaction<T>(fn: (tx: Transaction) => T): Promise<T> {
    try {
      if (!this.db) {
        throw new Error('Database connection not initialized');
      }
      
      // Create a transaction interface
      const txInterface: Transaction = {
        query: <U>(sql: string, params: (string | number | boolean | null)[] = []): U[] => {
          const statement = this.db!.prepare(sql);
          return statement.all(...(params || [])) as U[];
        },
        exec: (sql: string, params: (string | number | boolean | null)[] = []): number => {
          const statement = this.db!.prepare(sql);
          const info = statement.run(...(params || []));
          return info.changes;
        }
      };
      
      // Execute the transaction
      const result = this.db.transaction(() => {
        return fn(txInterface);
      })();
      
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(this.handleError(error, 'Transaction failed'));
    }
  }
  
  /**
   * Close the database connection
   * @returns Promise resolving when the connection is closed
   */
  async close(): Promise<void> {
    try {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(this.handleError(error, 'Error closing database connection'));
    }
  }
  
  /**
   * Check if the database connection is healthy
   * @returns Promise resolving with connection status
   */
  async healthCheck(): Promise<boolean> {
    try {
      // If we don't have a connection, try to initialize
      if (!this.db) {
        try {
          this.db = new Database(this.dbPath);
        } catch (error) {
          return false;
        }
      }
      
      // Try to run a simple query
      const result = this.db.prepare('SELECT 1 AS test').get() as { test: number } | undefined;
      return !!result && result.test === 1;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Create database tables
   * @private
   */
  private createTables(): void {
    // Create health_checks table
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS health_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        check_type TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        timestamp TEXT NOT NULL
      )
    `);

    // Create users table
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        display_name TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        auth_providers TEXT,
        api_keys TEXT,
        preferences TEXT
      )
    `);
  }
  
  /**
   * Handle database errors and convert to application errors
   * @param error - The original error
   * @param message - Error message prefix
   * @returns DatabaseError with appropriate error code
   * @private
   */
  private handleError(error: Error | unknown, message: string): DatabaseError {
    // Extract error message safely from unknown error type
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Database error: ${errorMessage}`);
    const originalError = error instanceof Error ? error : undefined;
    return new DatabaseError(`${message}: ${errorMessage}`, undefined, originalError);
  }
}
