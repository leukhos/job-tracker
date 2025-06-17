// Mock database module for testing
const path = require('path');
const Database = require('better-sqlite3');

// Create in-memory database for testing
const db = new Database(':memory:');

// Initialize the database with tables
const initTestDb = () => {
  // Create jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobTitle TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT,
      remoteType TEXT DEFAULT 'on-site',
      salaryMin INTEGER,
      salaryMax INTEGER,
      status TEXT DEFAULT 'applied',
      jobUrl TEXT,
      notes TEXT,
      lastUpdated TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  // Create version table
  db.exec(`
    CREATE TABLE IF NOT EXISTS db_version (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL,
      updated TEXT NOT NULL
    )
  `);
  
  // Insert version record
  db.exec(`
    INSERT OR IGNORE INTO db_version (id, version, updated)
    VALUES (1, 1, '${new Date().toISOString()}')
  `);
};

// Clear all data from tables (for cleanup between tests)
const clearTestDb = () => {
  db.exec('DELETE FROM jobs');
  
  // Check if SQLITE_SEQUENCE exists before trying to reset it
  const sequenceExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='SQLITE_SEQUENCE'
  `).get();
  
  if (sequenceExists) {
    db.exec('UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME="jobs"');
  }
};

// Seed test data
const seedTestData = () => {
  const sampleJobs = [
    {
      jobTitle: 'Software Engineer',
      company: 'Tech Co',
      location: 'New York, NY',
      remoteType: 'hybrid',
      salaryMin: 90000,
      salaryMax: 120000,
      status: 'applied',
      jobUrl: 'https://example.com/job1',
      notes: 'Applied through website',
      createdAt: '2025-06-01T10:00:00.000Z',
      updatedAt: '2025-06-01T10:00:00.000Z'
    },
    {
      jobTitle: 'Senior Developer',
      company: 'Digital Inc',
      location: 'Remote',
      remoteType: 'remote',
      salaryMin: 110000,
      salaryMax: 150000,
      status: 'interviewing',
      jobUrl: 'https://example.com/job2',
      notes: 'Phone screen scheduled',
      createdAt: '2025-06-05T14:30:00.000Z',
      updatedAt: '2025-06-10T09:15:00.000Z'
    },
    {
      jobTitle: 'Frontend Developer',
      company: 'WebDev Solutions',
      location: 'Chicago, IL',
      remoteType: 'on-site',
      salaryMin: 85000,
      salaryMax: 105000,
      status: 'rejected',
      jobUrl: 'https://example.com/job3',
      notes: 'Rejected after interview',
      createdAt: '2025-05-20T11:45:00.000Z',
      updatedAt: '2025-06-15T16:20:00.000Z'
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO jobs (
      jobTitle, company, location, remoteType, salaryMin, salaryMax,
      status, jobUrl, notes, createdAt, updatedAt
    ) VALUES (
      @jobTitle, @company, @location, @remoteType, @salaryMin, @salaryMax,
      @status, @jobUrl, @notes, @createdAt, @updatedAt
    )
  `);

  for (const job of sampleJobs) {
    stmt.run(job);
  }
};

// Additional functions for pagination tests
const countAllJobs = async () => {
  const result = db.prepare('SELECT COUNT(*) as total FROM jobs').get();
  return result.total;
};

const countSearchResults = async (criteria) => {
  const { searchTerm, status } = criteria;
  const searchPattern = searchTerm ? `%${searchTerm}%` : '%';
  
  const stmt = db.prepare(`
    SELECT COUNT(*) as total FROM jobs 
    WHERE (jobTitle LIKE ? OR company LIKE ? OR notes LIKE ?)
    AND (status = ? OR ? IS NULL)
  `);
  
  const result = stmt.get(searchPattern, searchPattern, searchPattern, status, status);
  return result.total;
};

// Export mock database functions that mirror the real ones
module.exports = {
  db,
  initTestDb,
  clearTestDb,
  seedTestData,
  
  // Mock versions of the real database functions
  getAllJobs: (limit = 100, offset = 0) => {
    return db.prepare('SELECT * FROM jobs LIMIT ? OFFSET ?').all(limit, offset);
  },
  
  getJobById: (id) => {
    return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  },
    createJob: (jobData) => {
    const now = new Date().toISOString();
    const data = {
      jobTitle: jobData.jobTitle || '',
      company: jobData.company || '',
      location: jobData.location || '',
      remoteType: jobData.remoteType || 'on-site',
      salaryMin: jobData.salaryMin || null,
      salaryMax: jobData.salaryMax || null,
      status: jobData.status || 'applied',
      jobUrl: jobData.jobUrl || '',
      notes: jobData.notes || '',
      createdAt: jobData.createdAt || now,
      updatedAt: jobData.updatedAt || now
    };
    
    const stmt = db.prepare(`
      INSERT INTO jobs (
        jobTitle, company, location, remoteType, salaryMin, salaryMax,
        status, jobUrl, notes, createdAt, updatedAt
      ) VALUES (
        @jobTitle, @company, @location, @remoteType, @salaryMin, @salaryMax,
        @status, @jobUrl, @notes, @createdAt, @updatedAt
      )
    `);
    
    const info = stmt.run(data);
    return { ...data, id: info.lastInsertRowid };
  },
  
  updateJob: (id, jobData) => {
    // First check if the job exists
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
    if (!job) {
      return false; // Job not found, return false
    }
    
    jobData.updatedAt = new Date().toISOString();
    
    const keys = Object.keys(jobData)
      .filter(key => key !== 'id')
      .map(key => `${key} = @${key}`)
      .join(', ');
    
    const stmt = db.prepare(`
      UPDATE jobs SET ${keys} WHERE id = @id
    `);
    
    const info = stmt.run({ ...jobData, id });
    return info.changes > 0;
  },
  
  deleteJob: (id) => {
    // First check if the job exists
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
    if (!job) {
      return { id, deleted: false }; // Job not found, but still return a success response
    }
    
    const info = db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
    return { id, deleted: true };
  },
  
  searchJobs: (searchParams) => {
    // Build WHERE clause based on search parameters
    const conditions = [];
    const params = {};
    
    if (searchParams.query) {
      conditions.push('(jobTitle LIKE @query OR company LIKE @query OR notes LIKE @query)');
      params.query = `%${searchParams.query}%`;
    }
    
    if (searchParams.status) {
      conditions.push('status = @status');
      params.status = searchParams.status;
    }
    
    if (searchParams.remoteType) {
      conditions.push('remoteType = @remoteType');
      params.remoteType = searchParams.remoteType;
    }
    
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    
    // Execute search query with parameters
    return db.prepare(`
      SELECT * FROM jobs ${whereClause}
      LIMIT @limit OFFSET @offset
    `).all({
      ...params,
      limit: searchParams.limit || 100,
      offset: searchParams.offset || 0
    });
  },
  
  // Add pagination functions
  countAllJobs: async () => {
    const result = db.prepare('SELECT COUNT(*) as total FROM jobs').get();
    return result.total;
  },
  
  countSearchResults: async (criteria) => {
    const { searchTerm, status } = criteria;
    const searchPattern = searchTerm ? `%${searchTerm}%` : '%';
    
    const stmt = db.prepare(`
      SELECT COUNT(*) as total FROM jobs 
      WHERE (jobTitle LIKE ? OR company LIKE ? OR notes LIKE ?)
      AND (status = ? OR ? IS NULL)
    `);
    
    const result = stmt.get(searchPattern, searchPattern, searchPattern, status, status);
    return result.total;
  },
  
  closeDatabase: () => {
    // Close the in-memory database
    if (db) {
      db.close();
    }
  }
};
