/**
 * DatabaseProvider interface defines common database operations
 * This lightweight provider approach gives us flexibility without overengineering
 */

/**
 * Transaction interface for handling database transactions
 */
export interface Transaction {
  /**
   * Execute a query that returns no rows
   * @param sql - SQL statement to execute
   * @param params - Parameters for the prepared statement
   * @returns Number of rows affected
   */
  exec(sql: string, params?: (string | number | boolean | null)[]): number;
  
  /**
   * Execute a query that returns rows
   * @param sql - SQL statement to execute
   * @param params - Parameters for the prepared statement
   * @returns Array of rows from the query result
   */
  query<T>(sql: string, params?: (string | number | boolean | null)[]): T[];
}

/**
 * DatabaseProvider interface for database operations
 */
export interface DatabaseProvider {
  /**
   * Initialize the database connection and schema
   * @returns Promise resolving when initialization is complete
   */
  initialize(): Promise<void>;
  
  /**
   * Execute a query that returns rows
   * @param sql - SQL statement to execute
   * @param params - Parameters for the prepared statement
   * @returns Promise resolving with array of rows from the query result
   */
  query<T>(sql: string, params?: (string | number | boolean | null)[]): Promise<T[]>;
  
  /**
   * Execute a query that modifies data (INSERT, UPDATE, DELETE)
   * @param sql - SQL statement to execute
   * @param params - Parameters for the prepared statement
   * @returns Promise resolving with the number of rows affected
   */
  exec(sql: string, params?: (string | number | boolean | null)[]): Promise<number>;
  
  /**
   * Execute operations within a transaction
   * @param fn - Function to execute within the transaction
   * @returns Promise resolving with the result of the transaction function
   */
  transaction<T>(fn: (tx: Transaction) => T): Promise<T>;
  
  /**
   * Close the database connection
   * @returns Promise resolving when the connection is closed
   */
  close(): Promise<void>;
  
  /**
   * Check if the database connection is healthy
   * @returns Promise resolving with connection status
   */
  healthCheck(): Promise<boolean>;
}
