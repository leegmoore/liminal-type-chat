import { DatabaseProvider } from '../../../../src/providers/db/database-provider';
import { SQLiteProvider } from '../../../../src/providers/db/sqlite-provider';
import * as fs from 'fs';
import * as path from 'path';

describe('SQLiteProvider', () => {
  const testDbPath = path.join(__dirname, 'test.db');
  let dbProvider: DatabaseProvider;
  
  beforeEach(async () => {
    // Remove test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Create a new provider instance for each test
    dbProvider = new SQLiteProvider(testDbPath);
    await dbProvider.initialize();
  });
  
  afterEach(async () => {
    // Clean up after each test
    await dbProvider.close();
    
    // Remove test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });
  
  describe('initialize()', () => {
    it('should create a new database file if it does not exist', async () => {
      // This is implicitly tested in beforeEach
      expect(fs.existsSync(testDbPath)).toBe(true);
    });
    
    it('should create health_checks table during initialization', async () => {
      // Query to check if health_checks table exists
      const result = await dbProvider.query<{ name: string }>(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='health_checks';
      `);
      
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('health_checks');
    });
  });
  
  describe('query()', () => {
    it('should execute a query and return results', async () => {
      // Insert test data
      await dbProvider.exec(
        'INSERT INTO health_checks (check_type, status, timestamp) VALUES (?, ?, ?)',
        ['test', 'ok', new Date().toISOString()]
      );
      
      // Query the data
      const results = await dbProvider.query<{ check_type: string, status: string }>(
        'SELECT check_type, status FROM health_checks WHERE check_type = ?',
        ['test']
      );
      
      expect(results.length).toBe(1);
      expect(results[0].check_type).toBe('test');
      expect(results[0].status).toBe('ok');
    });
    
    it('should return empty array for query with no results', async () => {
      const results = await dbProvider.query<{ id: number }>(
        'SELECT id FROM health_checks WHERE check_type = ?', 
        ['nonexistent']
      );
      
      expect(results).toEqual([]);
    });
    
    it('should throw an error for invalid SQL', async () => {
      await expect(
        dbProvider.query('INVALID SQL')
      ).rejects.toThrow();
    });
  });
  
  describe('exec()', () => {
    it('should execute statements that modify the database', async () => {
      // Insert a record
      await dbProvider.exec(
        'INSERT INTO health_checks (check_type, status, timestamp) VALUES (?, ?, ?)',
        ['test', 'ok', new Date().toISOString()]
      );
      
      // Verify it was inserted
      const results = await dbProvider.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM health_checks WHERE check_type = ?',
        ['test']
      );
      
      expect(results[0].count).toBe(1);
    });
    
    it('should throw an error for invalid SQL', async () => {
      await expect(
        dbProvider.exec('INVALID SQL')
      ).rejects.toThrow();
    });
  });
  
  describe('transaction()', () => {
    it('should commit changes when transaction function completes successfully', async () => {
      await dbProvider.transaction(tx => {
        tx.exec(
          'INSERT INTO health_checks (check_type, status, timestamp) VALUES (?, ?, ?)',
          ['tx-test', 'ok', new Date().toISOString()]
        );
        
        return 'success';
      });
      
      // Verify changes were committed
      const results = await dbProvider.query<{ check_type: string }>(
        'SELECT check_type FROM health_checks WHERE check_type = ?',
        ['tx-test']
      );
      
      expect(results.length).toBe(1);
      expect(results[0].check_type).toBe('tx-test');
    });
    
    it('should roll back changes when transaction function throws an error', async () => {
      // This transaction should roll back
      await expect(
        dbProvider.transaction(tx => {
          tx.exec(
            'INSERT INTO health_checks (check_type, status, timestamp) VALUES (?, ?, ?)',
            ['rollback-test', 'ok', new Date().toISOString()]
          );
          
          throw new Error('Intentional error to trigger rollback');
        })
      ).rejects.toThrow('Intentional error to trigger rollback');
      
      // Verify changes were rolled back
      const results = await dbProvider.query<{ check_type: string }>(
        'SELECT check_type FROM health_checks WHERE check_type = ?',
        ['rollback-test']
      );
      
      expect(results.length).toBe(0);
    });
  });
  
  describe('healthCheck()', () => {
    it('should return true when database is healthy', async () => {
      const healthy = await dbProvider.healthCheck();
      expect(healthy).toBe(true);
    });
    
    it('should return false when database connection fails', async () => {
      // Close the connection first to simulate a failure
      await dbProvider.close();
      
      // Create a new provider with a non-existent path that would fail to open
      const badProvider = new SQLiteProvider('/nonexistent/path/db.sqlite');
      
      // Don't initialize - we want to test a connection failure
      const healthy = await badProvider.healthCheck();
      expect(healthy).toBe(false);
    });
  });
});
