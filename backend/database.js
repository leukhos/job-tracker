const { DatabaseSync } = require('node:sqlite');
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
let db;
let isInitialized = false;

const initializeDatabase = () => {
  if (isInitialized) {
    return db;
  }
  
  db = new DatabaseSync(dbPath);
  console.log(`Connected to the SQLite database at ${dbPath} (${ENV} environment).`);
  isInitialized = true;
  return db;
};

// Initialize database for non-test environments or if not already initialized
if (ENV !== 'test' || !isInitialized) {
  initializeDatabase();
}

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
      lastUpdated INTEGER
    )
  `,
  CREATE_VERSION_TABLE: `
    CREATE TABLE IF NOT EXISTS db_version (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `,
  GET_DB_VERSION: 'SELECT version FROM db_version WHERE id = 1',
  SET_DB_VERSION: 'INSERT OR REPLACE INTO db_version (id, version, updated_at) VALUES (1, ?, ?)',

  GET_ALL_JOBS: 'SELECT * FROM jobs ORDER BY company COLLATE NOCASE ASC LIMIT ? OFFSET ?',
  COUNT_ALL_JOBS: 'SELECT COUNT(*) as total FROM jobs',
  GET_JOB_BY_ID: 'SELECT * FROM jobs WHERE id = ?',
  CREATE_JOB: `
    INSERT INTO jobs (
      jobTitle, company, location, remoteType, 
      salaryMin, salaryMax, status, jobUrl, 
      notes, lastUpdated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      lastUpdated = ?
    WHERE id = ?
  `,
  DELETE_JOB: 'DELETE FROM jobs WHERE id = ?',
  SEARCH_JOBS: `
    SELECT * FROM jobs 
    WHERE (jobTitle LIKE ? OR company LIKE ? OR notes LIKE ?)
    AND (status = ? OR ? IS NULL)
    ORDER BY company COLLATE NOCASE ASC
    LIMIT ? OFFSET ?
  `,
  COUNT_SEARCH_JOBS: `
    SELECT COUNT(*) as total FROM jobs 
    WHERE (jobTitle LIKE ? OR company LIKE ? OR notes LIKE ?)
    AND (status = ? OR ? IS NULL)
  `
};

// Initialize database tables
const initDb = () => {
  if (!db) {
    initializeDatabase();
  }
  
  try {
    // Create version table if it doesn't exist
    db.exec(SQL.CREATE_VERSION_TABLE);
    
    // Check current version
    let currentVersion = 1;
    try {
      const versionStmt = db.prepare(SQL.GET_DB_VERSION);
      const versionRow = versionStmt.get();
      if (versionRow) {
        currentVersion = versionRow.version;
      } else {
        // Set initial version
        const setVersionStmt = db.prepare(SQL.SET_DB_VERSION);
        setVersionStmt.run(currentVersion, Date.now());
      }
    } catch (err) {
      console.log('Setting up version tracking for the first time');
      const setVersionStmt = db.prepare(SQL.SET_DB_VERSION);
      setVersionStmt.run(currentVersion, Date.now());
    }
    
    // Create jobs table if it doesn't exist
    db.exec(SQL.CREATE_JOBS_TABLE);
    console.log('Jobs table initialized successfully.');
    
    // Perform migrations if needed
    if (currentVersion < 3) {
      if (currentVersion < 2) {
        console.log('Migrating database to version 2: Converting date fields to EPOCH timestamps...');
        
        // Check if we need to migrate by looking for TEXT date fields
        const checkColumnsStmt = db.prepare("PRAGMA table_info(jobs)");
        const columns = checkColumnsStmt.all();
        const lastUpdatedColumn = columns.find(col => col.name === 'lastUpdated');
        
        if (lastUpdatedColumn && lastUpdatedColumn.type === 'TEXT') {
          // Migration needed - convert TEXT dates to EPOCH timestamps
          
          // First, get all existing jobs
          const getAllJobsStmt = db.prepare('SELECT * FROM jobs');
          const existingJobs = getAllJobsStmt.all();
          
          if (existingJobs.length > 0) {
            // Create new table with INTEGER date fields but still with createdAt/updatedAt
            db.exec(`
              CREATE TABLE jobs_v2 (
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
                lastUpdated INTEGER,
                createdAt INTEGER,
                updatedAt INTEGER
              )
            `);
            
            // Convert and insert data
            const insertStmt = db.prepare(`
              INSERT INTO jobs_v2 (
                id, jobTitle, company, location, remoteType, 
                salaryMin, salaryMax, status, jobUrl, notes, 
                lastUpdated, createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            for (const job of existingJobs) {
              const convertToEpoch = (dateStr) => {
                if (!dateStr) return Date.now();
                // Handle both ISO strings and date-only strings
                const date = new Date(dateStr);
                return isNaN(date.getTime()) ? Date.now() : date.getTime();
              };
              
              insertStmt.run(
                job.id,
                job.jobTitle,
                job.company,
                job.location,
                job.remoteType,
                job.salaryMin,
                job.salaryMax,
                job.status,
                job.jobUrl,
                job.notes,
                convertToEpoch(job.lastUpdated),
                convertToEpoch(job.createdAt),
                convertToEpoch(job.updatedAt)
              );
            }
            
            // Drop old table and rename new one
            db.exec('DROP TABLE jobs');
            db.exec('ALTER TABLE jobs_v2 RENAME TO jobs');
            
            console.log(`Migrated ${existingJobs.length} jobs to EPOCH timestamps`);
          }
        }
        
        // Update version to 2
        const setVersionStmt = db.prepare(SQL.SET_DB_VERSION);
        setVersionStmt.run(2, Date.now());
        currentVersion = 2;
        console.log('Migration to version 2 completed');
      }
      
      if (currentVersion < 3) {
        console.log('Migrating database to version 3: Removing unused createdAt and updatedAt columns...');
        
        // Get all existing jobs
        const getAllJobsStmt = db.prepare('SELECT * FROM jobs');
        const existingJobs = getAllJobsStmt.all();
        
        if (existingJobs.length > 0) {
          // Create new table without createdAt/updatedAt
          db.exec(`
            CREATE TABLE jobs_v3 (
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
              lastUpdated INTEGER
            )
          `);
          
          // Copy data without createdAt/updatedAt
          const insertStmt = db.prepare(`
            INSERT INTO jobs_v3 (
              id, jobTitle, company, location, remoteType, 
              salaryMin, salaryMax, status, jobUrl, notes, 
              lastUpdated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          for (const job of existingJobs) {
            insertStmt.run(
              job.id,
              job.jobTitle,
              job.company,
              job.location,
              job.remoteType,
              job.salaryMin,
              job.salaryMax,
              job.status,
              job.jobUrl,
              job.notes,
              job.lastUpdated
            );
          }
          
          // Drop old table and rename new one
          db.exec('DROP TABLE jobs');
          db.exec('ALTER TABLE jobs_v3 RENAME TO jobs');
          
          console.log(`Simplified schema for ${existingJobs.length} jobs (removed createdAt/updatedAt)`);
        }
        
        // Update version to 3
        const setVersionStmt = db.prepare(SQL.SET_DB_VERSION);
        setVersionStmt.run(3, Date.now());
        currentVersion = 3;
        console.log('Migration to version 3 completed');
      }
    }
    
    console.log(`Database is at version ${currentVersion}`);
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Initialize database on module import for non-test environments
if (ENV !== 'test') {
  initDb();
}

// Get all jobs with pagination
const getAllJobs = (limit = 100, offset = 0) => {
  if (!db) initDb();
  try {
    const stmt = db.prepare(SQL.GET_ALL_JOBS);
    return stmt.all(limit, offset);
  } catch (error) {
    console.error('Error getting all jobs:', error);
    throw error;
  }
};

// Get total count of all jobs
const countAllJobs = () => {
  if (!db) initDb();
  try {
    const stmt = db.prepare(SQL.COUNT_ALL_JOBS);
    return stmt.get().total;
  } catch (error) {
    console.error('Error counting all jobs:', error);
    throw error;
  }
};

// Get job by ID
const getJobById = (id) => {
  if (!db) initDb();
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
  if (!db) initDb();
  try {
    // Validate required fields
    if (!jobData.jobTitle || !jobData.company) {
      throw new Error('Job title and company are required fields');
    }
    
    const now = Date.now();
    
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

    // Convert lastUpdated to EPOCH if it's a string
    let lastUpdatedEpoch = lastUpdated;
    if (typeof lastUpdated === 'string') {
      const date = new Date(lastUpdated);
      lastUpdatedEpoch = isNaN(date.getTime()) ? now : date.getTime();
    }

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
      lastUpdatedEpoch || now
    );

    return getJobById(info.lastInsertRowid);
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

// Update an existing job
const updateJob = (id, jobData) => {
  if (!db) initDb();
  try {
    const now = Date.now();
    
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

    // Convert lastUpdated to EPOCH if it's a string
    let lastUpdatedEpoch = lastUpdated;
    if (typeof lastUpdated === 'string') {
      const date = new Date(lastUpdated);
      lastUpdatedEpoch = isNaN(date.getTime()) ? now : date.getTime();
    }

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
      lastUpdatedEpoch || now,
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
  if (!db) initDb();
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
  if (!db) initDb();
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

// Count search results
const countSearchResults = (criteria = {}) => {
  if (!db) initDb();
  try {
    const { searchTerm, status } = criteria;
    const searchPattern = searchTerm ? `%${searchTerm}%` : '%';
    
    const stmt = db.prepare(SQL.COUNT_SEARCH_JOBS);
    const result = stmt.get(
      searchPattern,
      searchPattern,
      searchPattern,
      status || null,
      status || null
    );
    return result ? result.total : 0;
  } catch (error) {
    console.error('Error counting search results:', error);
    throw error;
  }
};

// Close database connection
const closeDatabase = () => {
  if (!db) return true;
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
  closeDatabase,
  countAllJobs,
  countSearchResults,
  initDb,
  initializeDatabase
};
