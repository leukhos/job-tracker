const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Environment configuration
const ENV = process.env.NODE_ENV || 'development';
const DEBUG = process.env.DEBUG_DB === 'true' || ENV === 'development';

// Create data directory if it doesn't exist
const dataDir = path.resolve(__dirname, process.env.DB_DIR || 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database path
const dbPath = process.env.DB_PATH 
  ? path.resolve(process.env.DB_PATH) 
  : path.resolve(dataDir, 'job_tracker.db');

// Custom logger that only logs in debug mode
const logger = DEBUG ? console.log : () => {};

// Create database connection
const db = new Database(dbPath, { 
  verbose: logger 
});

console.log(`Connected to the SQLite database at ${dbPath} (${ENV} environment).`);

// SQL Query Constants
const SQL = {
  CREATE_JOBS_TABLE: `
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
  `,
  CREATE_VERSION_TABLE: `
    CREATE TABLE IF NOT EXISTS db_version (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  GET_DB_VERSION: 'SELECT version FROM db_version WHERE id = 1',
  SET_DB_VERSION: 'INSERT OR REPLACE INTO db_version (id, version, updated_at) VALUES (1, ?, ?)',

  GET_ALL_JOBS: 'SELECT * FROM jobs ORDER BY company COLLATE NOCASE ASC LIMIT ? OFFSET ?',
  GET_JOB_BY_ID: 'SELECT * FROM jobs WHERE id = ?',
  CREATE_JOB: `
    INSERT INTO jobs (
      jobTitle, company, location, remoteType, 
      salaryMin, salaryMax, status, jobUrl, 
      notes, lastUpdated, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  UPDATE_JOB: `
    UPDATE jobs SET
      jobTitle = ?,
      company = ?,
      location = ?,
      remoteType = ?,
      salaryMin = ?,
      salaryMax = ?,
      status = ?,
      jobUrl = ?,
      notes = ?,
      lastUpdated = ?,
      updatedAt = ?
    WHERE id = ?
  `,
  DELETE_JOB: 'DELETE FROM jobs WHERE id = ?',
  SEARCH_JOBS: `
    SELECT * FROM jobs 
    WHERE (jobTitle LIKE ? OR company LIKE ? OR notes LIKE ?)
    AND (status = ? OR ? IS NULL)
    ORDER BY company COLLATE NOCASE ASC
    LIMIT ? OFFSET ?
  `
};

// Initialize database tables
const initDb = () => {
  try {
    // Create version table if it doesn't exist
    db.exec(SQL.CREATE_VERSION_TABLE);
    
    // Check current version
    let currentVersion = 1;
    try {
      const versionRow = db.prepare(SQL.GET_DB_VERSION).get();
      if (versionRow) {
        currentVersion = versionRow.version;
      } else {
        // Set initial version
        db.prepare(SQL.SET_DB_VERSION).run(currentVersion, new Date().toISOString());
      }
    } catch (err) {
      console.log('Setting up version tracking for the first time');
      db.prepare(SQL.SET_DB_VERSION).run(currentVersion, new Date().toISOString());
    }
    
    // Create jobs table if it doesn't exist
    db.exec(SQL.CREATE_JOBS_TABLE);
    console.log('Jobs table initialized successfully.');
    
    // Perform migrations if needed
    // if (currentVersion < 2) {
    //   // Example migration: db.exec('ALTER TABLE jobs ADD COLUMN new_column TEXT');
    //   // Update version: db.prepare(SQL.SET_DB_VERSION).run(2, new Date().toISOString());
    //   // currentVersion = 2;
    // }
    
    console.log(`Database is at version ${currentVersion}`);
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Initialize database on module import
initDb();

// Get all jobs with pagination
const getAllJobs = (limit = 100, offset = 0) => {
  try {
    const stmt = db.prepare(SQL.GET_ALL_JOBS);
    return stmt.all(limit, offset);
  } catch (error) {
    console.error('Error getting all jobs:', error);
    throw error;
  }
};

// Get job by ID
const getJobById = (id) => {
  try {
    const stmt = db.prepare(SQL.GET_JOB_BY_ID);
    return stmt.get(id);
  } catch (error) {
    console.error(`Error getting job with ID ${id}:`, error);
    throw error;
  }
};

// Create a new job
const createJob = (jobData) => {
  try {
    // Validate required fields
    if (!jobData.jobTitle || !jobData.company) {
      throw new Error('Job title and company are required fields');
    }
    
    const now = new Date().toISOString();
    
    const {
      jobTitle,
      company,
      location,
      remoteType,
      salaryMin,
      salaryMax,
      status,
      jobUrl,
      notes,
      lastUpdated
    } = jobData;

    const stmt = db.prepare(SQL.CREATE_JOB);
    
    const info = stmt.run(
      jobTitle,
      company,
      location || null,
      remoteType || 'on-site',
      salaryMin || null,
      salaryMax || null,
      status || 'applied',
      jobUrl || null,
      notes || null,
      lastUpdated || now,
      now,
      now
    );

    return getJobById(info.lastInsertRowid);
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

// Update an existing job
const updateJob = (id, jobData) => {
  try {
    const now = new Date().toISOString();
    
    // Check if job exists
    const job = getJobById(id);
    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }

    const {
      jobTitle,
      company,
      location,
      remoteType,
      salaryMin,
      salaryMax,
      status,
      jobUrl,
      notes,
      lastUpdated
    } = jobData;

    const stmt = db.prepare(SQL.UPDATE_JOB);
    
    stmt.run(
      jobTitle,
      company,
      location || null,
      remoteType || 'on-site',
      salaryMin || null,
      salaryMax || null,
      status || 'applied',
      jobUrl || null,
      notes || null,
      lastUpdated || now,
      now,
      id
    );

    return getJobById(id);
  } catch (error) {
    console.error(`Error updating job with ID ${id}:`, error);
    throw error;
  }
};

// Delete a job
const deleteJob = (id) => {
  try {
    // Check if job exists
    const job = getJobById(id);
    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }

    const stmt = db.prepare(SQL.DELETE_JOB);
    stmt.run(id);
    
    return { id, deleted: true };
  } catch (error) {
    console.error(`Error deleting job with ID ${id}:`, error);
    throw error;
  }
};

// Search for jobs with various criteria
const searchJobs = (criteria = {}, limit = 100, offset = 0) => {
  try {
    const { searchTerm, status } = criteria;
    const searchPattern = searchTerm ? `%${searchTerm}%` : '%';
    
    const stmt = db.prepare(SQL.SEARCH_JOBS);
    return stmt.all(
      searchPattern,
      searchPattern,
      searchPattern,
      status || null,
      status || null,
      limit,
      offset
    );
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
};

// Close database connection
const closeDatabase = () => {
  try {
    db.close();
    console.log('Database connection closed.');
    return true;
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
};

// Close database connection when the application is shutting down
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  db,
  searchJobs,
  closeDatabase
};
