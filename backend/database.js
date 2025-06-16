const sqlite3 = require('sqlite3').verbose();
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
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
});

// Initialize database tables
const initDb = () => {
  db.serialize(() => {
    // Create jobs table if it doesn't exist
    db.run(`
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
    `, (err) => {
      if (err) {
        console.error('Error creating jobs table:', err.message);
      } else {
        console.log('Jobs table initialized successfully.');
      }
    });
  });
};

// Initialize database on module import
initDb();

// Get all jobs
const getAllJobs = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM jobs ORDER BY company COLLATE NOCASE ASC', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Get job by ID
const getJobById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM jobs WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Create a new job
const createJob = (jobData) => {
  return new Promise((resolve, reject) => {
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

    db.run(
      sql,
      [
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
      ],
      function(err) {
        if (err) {
          reject(err);
        } else {
          getJobById(this.lastID)
            .then(job => resolve(job))
            .catch(err => reject(err));
        }
      }
    );
  });
};

// Update an existing job
const updateJob = (id, jobData) => {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    
    // Check if job exists
    getJobById(id)
      .then(job => {
        if (!job) {
          reject(new Error(`Job with ID ${id} not found`));
          return;
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

        db.run(
          sql,
          [
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
          ],
          function(err) {
            if (err) {
              reject(err);
            } else {
              getJobById(id)
                .then(updatedJob => resolve(updatedJob))
                .catch(err => reject(err));
            }
          }
        );
      })
      .catch(err => reject(err));
  });
};

// Delete a job
const deleteJob = (id) => {
  return new Promise((resolve, reject) => {
    // Check if job exists
    getJobById(id)
      .then(job => {
        if (!job) {
          reject(new Error(`Job with ID ${id} not found`));
          return;
        }

        db.run('DELETE FROM jobs WHERE id = ?', [id], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, deleted: true });
          }
        });
      })
      .catch(err => reject(err));
  });
};

// Close database connection when the application is shutting down
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  db
};
