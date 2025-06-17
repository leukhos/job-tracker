const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Create data directory if it doesn't exist
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database path
const dbPath = path.resolve(dataDir, 'job_tracker.db');

// Create database connection
const db = new Database(dbPath, { 
  verbose: console.log 
});

console.log('Connected to the SQLite database.');

// Initialize database tables
const initDb = () => {
  // Create jobs table if it doesn't exist
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
  console.log('Jobs table initialized successfully.');
};

// Initialize database on module import
initDb();

// Get all jobs
const getAllJobs = () => {
  const stmt = db.prepare('SELECT * FROM jobs ORDER BY company COLLATE NOCASE ASC');
  return stmt.all();
};

// Get job by ID
const getJobById = (id) => {
  const stmt = db.prepare('SELECT * FROM jobs WHERE id = ?');
  return stmt.get(id);
};

// Create a new job
const createJob = (jobData) => {
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

  const sql = `
    INSERT INTO jobs (
      jobTitle, company, location, remoteType, 
      salaryMin, salaryMax, status, jobUrl, 
      notes, lastUpdated, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const stmt = db.prepare(sql);
  
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
    lastUpdated || now.split('T')[0],
    now,
    now
  );

  return getJobById(info.lastInsertRowid);
};

// Update an existing job
const updateJob = (id, jobData) => {
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

  const sql = `
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
  `;

  const stmt = db.prepare(sql);
  
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
    lastUpdated || now.split('T')[0],
    now,
    id
  );

  return getJobById(id);
};

// Delete a job
const deleteJob = (id) => {
  // Check if job exists
  const job = getJobById(id);
  if (!job) {
    throw new Error(`Job with ID ${id} not found`);
  }

  const stmt = db.prepare('DELETE FROM jobs WHERE id = ?');
  stmt.run(id);
  
  return { id, deleted: true };
};

// Close database connection when the application is shutting down
process.on('SIGINT', () => {
  db.close();
  console.log('Database connection closed.');
  process.exit(0);
});

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  db
};
