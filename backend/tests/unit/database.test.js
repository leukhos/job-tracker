const {
  db,
  initTestDb,
  clearTestDb,
  seedTestData,
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  searchJobs
} = require('../mock-database');

describe('Database Operations', () => {
  beforeAll(() => {
    // Initialize test database before all tests
    initTestDb();
  });

  beforeEach(() => {
    // Clear and seed the database before each test
    clearTestDb();
    seedTestData();
  });

  afterAll(() => {
    // Close database connection after all tests
    db.close();
  });

  describe('getAllJobs', () => {
    it('should return all jobs with default pagination', () => {
      const jobs = getAllJobs();
      expect(jobs).toHaveLength(3);
      expect(jobs[0].company).toBe('Tech Co');
    });

    it('should respect limit parameter', () => {
      const jobs = getAllJobs(2);
      expect(jobs).toHaveLength(2);
    });

    it('should respect offset parameter', () => {
      const jobs = getAllJobs(100, 1);
      expect(jobs).toHaveLength(2);
      expect(jobs[0].company).toBe('Digital Inc');
    });
  });
  describe('getJobById', () => {
    it('should return a job by ID', () => {
      // Get a job that exists in the seeded data
      const jobs = getAllJobs();
      const firstJob = jobs[0];
      const job = getJobById(firstJob.id);
      
      expect(job).toBeTruthy();
      expect(job.jobTitle).toBe('Software Engineer');
      expect(job.company).toBe('Tech Co');
    });

    it('should return undefined for non-existent ID', () => {
      const job = getJobById(999);
      expect(job).toBeUndefined();
    });
  });
  describe('createJob', () => {
    it('should create a new job', () => {
      const newJob = {
        jobTitle: 'QA Engineer',
        company: 'Testing Inc',
        location: 'Austin, TX',
        remoteType: 'hybrid',
        salaryMin: 80000,
        salaryMax: 100000,
        status: 'applied',
        jobUrl: 'https://example.com/job4',
        notes: 'New testing position'
      };

      const createdJob = createJob(newJob);
      expect(createdJob.id).toBeTruthy();
      expect(createdJob.jobTitle).toBe('QA Engineer');
      expect(createdJob.createdAt).toBeTruthy();
      expect(createdJob.updatedAt).toBeTruthy();

      // Verify the job was actually saved
      const retrievedJob = getJobById(createdJob.id);
      expect(retrievedJob).toBeTruthy();
      expect(retrievedJob.company).toBe('Testing Inc');
    });

    it('should use provided timestamps if available', () => {
      const customDate = '2025-01-01T00:00:00.000Z';
      const newJob = {
        jobTitle: 'Product Manager',
        company: 'PM Co',
        createdAt: customDate,
        updatedAt: customDate
      };

      const createdJob = createJob(newJob);
      expect(createdJob.createdAt).toBe(customDate);
      expect(createdJob.updatedAt).toBe(customDate);
    });
  });
  describe('updateJob', () => {
    it('should update an existing job', () => {
      // Get a job that exists in the seeded data
      const jobs = getAllJobs();
      const jobToUpdate = jobs[0];
      
      const updates = {
        jobTitle: 'Updated Job Title',
        notes: 'Updated notes'
      };

      const result = updateJob(jobToUpdate.id, updates);
      expect(result).toBe(true);

      // Verify the job was actually updated
      const updatedJob = getJobById(jobToUpdate.id);
      expect(updatedJob.jobTitle).toBe('Updated Job Title');
      expect(updatedJob.notes).toBe('Updated notes');
      expect(updatedJob.company).toBe('Tech Co'); // Unchanged field
    });

    it('should return false for non-existent ID', () => {
      const result = updateJob(999, { jobTitle: 'This will not update' });
      expect(result).toBe(false);
    });
  });  describe('deleteJob', () => {
    it('should delete an existing job', () => {
      // Get a job that exists in the seeded data
      const jobs = getAllJobs();
      const jobToDelete = jobs[0];
      
      const result = deleteJob(jobToDelete.id);
      expect(result).toHaveProperty('id', jobToDelete.id);
      expect(result).toHaveProperty('deleted', true);

      // Verify the job was actually deleted
      const deletedJob = getJobById(jobToDelete.id);
      expect(deletedJob).toBeUndefined();

      // Verify other jobs remain
      const remainingJobs = getAllJobs();
      expect(remainingJobs.length).toBe(jobs.length - 1);
    });

    it('should return object with deleted:false for non-existent ID', () => {
      const result = deleteJob(999);
      expect(result).toHaveProperty('id', 999);
      expect(result).toHaveProperty('deleted', false);
    });
  });
  describe('searchJobs', () => {
    it('should search jobs by query string', () => {
      const results = searchJobs({ query: 'senior' });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].jobTitle).toBe('Senior Developer');
    });

    it('should filter by status', () => {
      const results = searchJobs({ status: 'rejected' });
      expect(results).toHaveLength(1);
      expect(results[0].company).toBe('WebDev Solutions');
    });

    it('should filter by remote type', () => {
      const results = searchJobs({ remoteType: 'remote' });
      expect(results).toHaveLength(1);
      expect(results[0].company).toBe('Digital Inc');
    });

    it('should combine multiple filters', () => {
      const results = searchJobs({ 
        query: 'dev', 
        remoteType: 'remote' 
      });
      expect(results).toHaveLength(1);
      expect(results[0].jobTitle).toBe('Senior Developer');
    });

    it('should respect pagination parameters', () => {
      // Add more test jobs for this test
      createJob({
        jobTitle: 'Developer 1',
        company: 'Pagination Test',
      });
      createJob({
        jobTitle: 'Developer 2',
        company: 'Pagination Test',
      });
      
      const results = searchJobs({ 
        query: 'dev', 
        limit: 2,
        offset: 1
      });
      
      expect(results).toHaveLength(2);
      // The first 'dev' job is skipped due to offset
    });
  });
});
