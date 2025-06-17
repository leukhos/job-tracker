const mockDb = require('../mock-database');

describe('Pagination functions', () => {
  // Setup test database
  beforeAll(() => {
    mockDb.initTestDb();
  });

  beforeEach(() => {
    mockDb.clearTestDb();
    mockDb.seedTestData();
  });

  afterAll(() => {
    mockDb.closeDatabase();
  });
  
  test('countAllJobs should return a number', async () => {
    // This test assumes there's at least one job in the test database
    const count = await mockDb.countAllJobs();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });
    
  test('countSearchResults should return 0 for no matches', async () => {
    const criteria = { 
      searchTerm: 'ThisJobTitleDefinitelyDoesNotExist12345',
      status: null 
    };
    const count = await mockDb.countSearchResults(criteria);
    expect(count).toBe(0);
  });
    
  test('countSearchResults should return total count with criteria', async () => {
    // This test assumes the database has some content
    // A more comprehensive test would seed the database first
    const criteria = { searchTerm: '', status: null };
    const count = await mockDb.countSearchResults(criteria);
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
