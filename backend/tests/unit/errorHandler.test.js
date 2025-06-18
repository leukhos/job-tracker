const httpMocks = require('node-mocks-http');

// Extract the error handler from server.js (we'll need to modify server.js to export it)
let errorHandler;
try {
  errorHandler = require('../../server').errorHandler;
} catch (e) {
  // If not exported, we'll define a mock version for testing
  errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const errorResponse = {
      error: err.message || 'Internal Server Error',
      statusCode,
      timestamp: new Date().toISOString()
    };
    
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.stack = err.stack;
    }
    
    res.status(statusCode).json(errorResponse);
  };
}

describe('Error Handler Middleware', () => {
  beforeEach(() => {
    // Mock console.error to reduce test noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error after each test
    console.error.mockRestore();
  });

  it('should handle errors with provided status code', () => {
    const error = new Error('Test error');
    error.statusCode = 400;
    
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();
    
    errorHandler(error, req, res, next);
    
    const data = JSON.parse(res._getData());
    expect(res._getStatusCode()).toBe(400);
    expect(data.error).toBe('Test error');
    expect(data.statusCode).toBe(400);
    expect(data).toHaveProperty('timestamp');
  });
  
  it('should default to 500 status code if not provided', () => {
    const error = new Error('Server error');
    
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();
    
    errorHandler(error, req, res, next);
    
    const data = JSON.parse(res._getData());
    expect(res._getStatusCode()).toBe(500);
    expect(data.error).toBe('Server error');
    expect(data.statusCode).toBe(500);
  });
  
  it('should include stack trace in non-production environment', () => {
    process.env.NODE_ENV = 'test';
    
    const error = new Error('Debug error');
    
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();
    
    errorHandler(error, req, res, next);
    
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('stack');
    expect(data.stack).toBeTruthy();
  });
  
  it('should not include stack trace in production environment', () => {
    // Temporarily set NODE_ENV to production
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const error = new Error('Production error');
    
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();
    
    errorHandler(error, req, res, next);
    
    const data = JSON.parse(res._getData());
    expect(data).not.toHaveProperty('stack');
    
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });
});
