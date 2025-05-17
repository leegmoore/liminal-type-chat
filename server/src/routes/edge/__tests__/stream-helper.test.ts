/**
 * Tests for Server-Sent Events (SSE) streaming helper utilities
 */
import { setupSseHeaders, sendSseData, sendSseError } from '../stream-helper';

describe('SSE Stream Helpers', () => {
  // Mock Express response
  const mockResponse = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = {};
    res.setHeader = jest.fn().mockReturnValue(res);
    res.write = jest.fn().mockReturnValue(res);
    res.flush = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('setupSseHeaders', () => {
    it('should set the correct SSE headers with CORS configuration', () => {
      // Arrange
      const res = mockResponse();
      
      // Act
      setupSseHeaders(res);
      
      // Assert
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-transform');
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, OPTIONS');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      expect(res.setHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no');
    });
  });

  describe('sendSseData', () => {
    it('should send data in the correct SSE format', () => {
      // Arrange
      const res = mockResponse();
      const data = { message: 'Hello, world!', status: 'ok' };
      
      // Act
      sendSseData(res, data);
      
      // Assert
      expect(res.write).toHaveBeenCalledWith(`data: ${JSON.stringify(data)}\n\n`);
    });
    
    it('should call flush if available', () => {
      // Arrange
      const res = mockResponse();
      const data = { message: 'Test data' };
      
      // Act
      sendSseData(res, data);
      
      // Assert
      expect(res.flush).toHaveBeenCalled();
    });
    
    it('should handle undefined or null data gracefully', () => {
      // Arrange
      const res = mockResponse();
      
      // Act
      sendSseData(res, null);
      
      // Assert
      expect(res.write).toHaveBeenCalledWith('data: null\n\n');
    });
  });

  describe('sendSseError', () => {
    it('should send an error with the correct format', () => {
      // Arrange
      const res = mockResponse();
      const message = 'An error occurred';
      const details = 'Something went wrong';
      
      // Act
      sendSseError(res, message, details);
      
      // Assert
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"error":true'));
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"message":"An error occurred"'));
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"details":"Something went wrong"'));
    });
    
    it('should use default details when not provided', () => {
      // Arrange
      const res = mockResponse();
      const message = 'An error occurred';
      
      // Act
      sendSseError(res, message);
      
      // Assert
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"details":"Unknown error"'));
    });
  });
});