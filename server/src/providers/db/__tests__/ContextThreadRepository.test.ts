import { ContextThreadRepository } from '../ContextThreadRepository';
import { MessagesCorruptedError } from '../errors';
import { ContextThread } from '../../../types/domain';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Mock better-sqlite3
jest.mock('better-sqlite3');
jest.mock('fs');
jest.mock('path');

describe('ContextThreadRepository', () => {
  let repository: ContextThreadRepository;
  let mockDb: jest.Mocked<Database.Database>;
  let mockPrepare: jest.Mock;
  let mockGet: jest.Mock;
  let mockRun: jest.Mock;
  
  const sampleThread: ContextThread = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Sample Thread',
    createdAt: 1620000000000,
    updatedAt: 1620000000000,
    messages: [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        threadId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'user',
        content: 'Hello, world!',
        createdAt: 1620000000000,
      },
    ],
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock database and statement functions
    mockGet = jest.fn();
    mockRun = jest.fn().mockReturnValue({ changes: 1 });
    mockPrepare = jest.fn().mockReturnValue({
      get: mockGet,
      run: mockRun,
    });
    
    mockDb = {
      prepare: mockPrepare,
      exec: jest.fn(),
      pragma: jest.fn(),
      close: jest.fn(),
      // Add other required properties as needed
    } as unknown as jest.Mocked<Database.Database>;
    
    // Mock Database constructor to return our mockDb
    (Database as unknown as jest.Mock).mockReturnValue(mockDb);
    
    // Mock fs.existsSync to return true
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Mock path.join to return a simple string
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // Mock fs.readFileSync to return a mock schema
    (fs.readFileSync as jest.Mock).mockReturnValue(
      `CREATE TABLE context_threads (
        id TEXT PRIMARY KEY, 
        title TEXT, 
        created_at INTEGER, 
        updated_at INTEGER, 
        messages TEXT
      );`
    );
    
    // Create repository instance
    repository = new ContextThreadRepository('test.db');
  });
  
  describe('initialization', () => {
    it('should create directory if it does not exist', () => {
      // Reset mocks
      jest.clearAllMocks();
      
      // Mock fs.existsSync to return false, simulating non-existent directory
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      // Mock fs.mkdirSync
      const mockMkdirSync = jest.fn();
      (fs.mkdirSync as jest.Mock) = mockMkdirSync;
      
      // Create new instance to trigger initialization logic
      new ContextThreadRepository('test.db');
      
      // Assert directory was created
      expect(mockMkdirSync).toHaveBeenCalled();
    });
    
    it('should handle error when applying schema fails', () => {
      // Reset mocks
      jest.clearAllMocks();
      
      // Mock fs.readFileSync to throw an error
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Mock schema read error');
      });
      
      // Assert that creating a new repository throws
      expect(() => new ContextThreadRepository('test.db'))
        .toThrow('Failed to initialize database schema');
    });
  });
  
  describe('create', () => {
    it('should successfully create a thread', () => {
      // Act
      const result = repository.create(sampleThread);
      
      // Assert
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO context_threads'));
      expect(mockRun).toHaveBeenCalledWith({
        id: sampleThread.id,
        title: sampleThread.title,
        createdAt: sampleThread.createdAt,
        updatedAt: sampleThread.updatedAt,
        metadata: null,
        messages: JSON.stringify(sampleThread.messages),
      });
      expect(result).toEqual(sampleThread);
    });
    
    it('should handle thread with null title', () => {
      // Arrange
      const threadWithNullTitle = {
        ...sampleThread,
        title: undefined,
      };
      
      // Act
      repository.create(threadWithNullTitle);
      
      // Assert
      expect(mockRun).toHaveBeenCalledWith(expect.objectContaining({
        title: null,
      }));
    });
    
    it('should throw when create fails', () => {
      // Arrange
      mockRun.mockImplementation(() => {
        throw new Error('Mock DB error');
      });
      
      // Act & Assert
      expect(() => repository.create(sampleThread)).toThrow();
    });
  });
  
  describe('findById', () => {
    it('should return thread when found', () => {
      // Arrange
      const dbRow = {
        id: sampleThread.id,
        title: sampleThread.title,
        created_at: sampleThread.createdAt,
        updated_at: sampleThread.updatedAt,
        metadata: null,
        messages: JSON.stringify(sampleThread.messages),
      };
      mockGet.mockReturnValue(dbRow);
      
      // Act
      const result = repository.findById(sampleThread.id);
      
      // Assert
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM context_threads'));
      expect(mockGet).toHaveBeenCalledWith(sampleThread.id);
      expect(result).toEqual(sampleThread);
    });
    
    it('should return null when thread not found', () => {
      // Arrange
      mockGet.mockReturnValue(null);
      
      // Act
      const result = repository.findById('non-existent-id');
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should handle corrupted messages JSON', () => {
      // Arrange
      const corruptedRow = {
        id: sampleThread.id,
        title: sampleThread.title,
        created_at: sampleThread.createdAt,
        updated_at: sampleThread.updatedAt,
        metadata: null,
        messages: '{not valid json',
      };
      mockGet.mockReturnValue(corruptedRow);
      
      // Act & Assert
      expect(() => repository.findById(sampleThread.id)).toThrow(MessagesCorruptedError);
    });
  });
  
  describe('update', () => {
    it('should successfully update a thread', () => {
      // Arrange
      const updatedThread = {
        ...sampleThread,
        title: 'Updated Title',
        updatedAt: 1620100000000,
      };
      
      // Act
      const result = repository.update(updatedThread);
      
      // Assert
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE context_threads'));
      expect(mockRun).toHaveBeenCalledWith(expect.objectContaining({
        id: updatedThread.id,
        title: updatedThread.title,
        updatedAt: updatedThread.updatedAt,
      }));
      expect(result).toEqual(updatedThread);
    });
    
    it('should return null when thread not found', () => {
      // Arrange
      mockRun.mockReturnValue({ changes: 0 });
      
      // Act
      const result = repository.update(sampleThread);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should throw when update fails', () => {
      // Arrange
      mockRun.mockImplementation(() => {
        throw new Error('Mock DB error');
      });
      
      // Act & Assert
      expect(() => repository.update(sampleThread)).toThrow();
    });
  });
  
  describe('delete', () => {
    it('should successfully delete a thread', () => {
      // Act
      const result = repository.delete(sampleThread.id);
      
      // Assert
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM context_threads'));
      expect(mockRun).toHaveBeenCalledWith(sampleThread.id);
      expect(result).toBe(true);
    });
    
    it('should return false when thread not found', () => {
      // Arrange
      mockRun.mockReturnValue({ changes: 0 });
      
      // Act
      const result = repository.delete('non-existent-id');
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should throw when delete fails', () => {
      // Arrange
      mockRun.mockImplementation(() => {
        throw new Error('Mock DB error');
      });
      
      // Act & Assert
      expect(() => repository.delete(sampleThread.id)).toThrow();
    });
  });
  
  describe('parseMetadata', () => {
    it('should return undefined for null metadata', () => {
      // Use private method through a public method that calls it
      const thread = {
        id: 'test-id',
        title: 'Test Thread',
        created_at: 1620000000000,
        updated_at: 1620000000000,
        metadata: null,
        messages: JSON.stringify([]),
      };
      
      mockGet.mockReturnValue(thread);
      const result = repository.findById('test-id');
      
      expect(result?.metadata).toBeUndefined();
    });
    
    it('should return undefined for invalid metadata JSON', () => {
      // Use private method through a public method that calls it
      const thread = {
        id: 'test-id',
        title: 'Test Thread',
        created_at: 1620000000000,
        updated_at: 1620000000000,
        metadata: '{invalid json',
        messages: JSON.stringify([]),
      };
      
      mockGet.mockReturnValue(thread);
      const result = repository.findById('test-id');
      
      expect(result?.metadata).toBeUndefined();
    });
    
    it('should return undefined for non-object metadata', () => {
      // Use private method through a public method that calls it
      const thread = {
        id: 'test-id',
        title: 'Test Thread',
        created_at: 1620000000000,
        updated_at: 1620000000000,
        metadata: '"string value"', // JSON string, not object
        messages: JSON.stringify([]),
      };
      
      mockGet.mockReturnValue(thread);
      const result = repository.findById('test-id');
      
      expect(result?.metadata).toBeUndefined();
    });
  });
  
  describe('close', () => {
    it('should close the database connection', () => {
      // Act
      repository.close();
      
      // Assert
      expect(mockDb.close).toHaveBeenCalled();
    });
  });
});
