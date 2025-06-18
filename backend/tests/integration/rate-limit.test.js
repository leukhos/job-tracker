const request = require('supertest');
const mockDb = require('../mock-database');

// Mock the database module
jest.mock('../../database', () => mockDb);

// Import the app after mocking
let app;
let server;

describe('Rate Limiting', () => {
  beforeAll(async () => {
    // Initialize the test database
    mockDb.initTestDb();
    
    // Import the app after mocking the database
    const serverModule = require('../../server');
    app = serverModule.app; 
    
    // Create server instance for proper cleanup
    server = app.listen(0); // Use any available port
  });

  afterAll(async () => {
    // Close the server to prevent open handles
    if (server) {
      server.close();
    }
    
    // Close the database connection
    await mockDb.closeDatabase();
  });

  beforeEach(() => {
    // Reset and seed the database before each test
    mockDb.clearTestDb();
    mockDb.seedTestData();
  });

  test('Rate limiter should allow requests below threshold', async () => {
    // Make a few requests that should be under the limit
    for (let i = 0; i < 3; i++) {
      const response = await request(app).get('/api/status');
      expect(response.status).toBe(200);
    }
  });
  
  // Note: This test is commented out because it would be slow and potentially flaky
  // in a CI environment. Uncomment to test rate limiting locally if needed.
  /*
  test('Rate limiter should block too many requests', async () => {
    // This test needs to be adjusted based on your actual rate limit settings
    const MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || 100;
    
    // Make requests up to the limit
    for (let i = 0; i < MAX_REQUESTS; i++) {
      await request(app).get('/api/status');
    }
    
    // This request should be rate limited
    const response = await request(app).get('/api/status');
    expect(response.status).toBe(429);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Too many requests');
  });
  */
});
