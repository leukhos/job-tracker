// This file runs before all tests and sets up the test environment
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:'; // Use in-memory SQLite database for tests

// Global test timeout (if needed)
jest.setTimeout(10000);

// Global afterAll to clean up resources
afterAll(async () => {
  // Any global cleanup needed
});
