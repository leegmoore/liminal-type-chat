import * as securityModule from '../index';
import * as encryptionService from '../encryption-service';
import * as secureStorage from '../secure-storage';
import * as errors from '../errors';

describe('Security module exports', () => {
  it('should export all items from encryption-service', () => {
    const encryptionExports = Object.keys(encryptionService);
    encryptionExports.forEach(exportName => {
      expect(securityModule).toHaveProperty(exportName);
    });
  });

  it('should export all items from secure-storage', () => {
    const secureStorageExports = Object.keys(secureStorage);
    secureStorageExports.forEach(exportName => {
      expect(securityModule).toHaveProperty(exportName);
    });
  });

  it('should export all items from errors', () => {
    const errorExports = Object.keys(errors);
    errorExports.forEach(exportName => {
      expect(securityModule).toHaveProperty(exportName);
    });
  });

  it('should have the correct number of exports', () => {
    const expectedExportCount = 
      Object.keys(encryptionService).length +
      Object.keys(secureStorage).length +
      Object.keys(errors).length;
    
    const actualExportCount = Object.keys(securityModule).length;
    
    expect(actualExportCount).toBe(expectedExportCount);
  });
});