/**
 * Tests for PkceStorageFactory
 */
import { PkceStorageFactory } from '../PkceStorageFactory';
import { InMemoryPkceStorage } from '../PkceStorage';
import { DatabasePkceStorage } from '../DatabasePkceStorage';
import { Environment } from '../../../../services/core/EnvironmentService';

// Mock the DatabasePkceStorage
jest.mock('../DatabasePkceStorage');

// Mock the logger
jest.mock('../../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

describe('PkceStorageFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create DatabasePkceStorage for production environment', () => {
    // Act
    const storage = PkceStorageFactory.create(Environment.PRODUCTION);
    
    // Assert
    expect(storage).toBeInstanceOf(DatabasePkceStorage);
    expect(DatabasePkceStorage).toHaveBeenCalledWith(Environment.PRODUCTION);
  });

  it('should create DatabasePkceStorage for staging environment', () => {
    // Act
    const storage = PkceStorageFactory.create(Environment.STAGING);
    
    // Assert
    expect(storage).toBeInstanceOf(DatabasePkceStorage);
    expect(DatabasePkceStorage).toHaveBeenCalledWith(Environment.STAGING);
  });

  it('should create InMemoryPkceStorage for development environment', () => {
    // Act
    const storage = PkceStorageFactory.create(Environment.DEVELOPMENT);
    
    // Assert
    expect(storage).toBeInstanceOf(InMemoryPkceStorage);
  });

  it('should create InMemoryPkceStorage for local environment', () => {
    // Act
    const storage = PkceStorageFactory.create(Environment.LOCAL);
    
    // Assert
    expect(storage).toBeInstanceOf(InMemoryPkceStorage);
  });
});