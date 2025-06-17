const database = require('./database');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory at:', dataDir);
}

// Function to initialize the database
const initializeDatabase = () => {
  console.log('Initializing database...');
  
  // Create the jobs table
  // Drop the table if it exists (for clean initialization)
  database.db.exec('DROP TABLE IF EXISTS jobs');
  
  // Create the jobs table
  database.db.exec(`
    CREATE TABLE jobs (
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
  
  console.log('Jobs table created successfully');  
  // Optional: Insert some sample data
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  
  const sampleJobs = [
    {
      jobTitle: 'Senior Frontend Developer',
      company: 'Tech Innovations',
      location: 'London, UK',
      remoteType: 'hybrid',
      salaryMin: 70,
      salaryMax: 90,
      status: 'applied',
      jobUrl: 'https://example.com/job1',
      notes: 'Applied through company website. Need to follow up next week.',
      lastUpdated: today,
      createdAt: now,
      updatedAt: now
    },
    {
      jobTitle: 'Full Stack Developer',
      company: 'Digital Solutions',
      location: 'Manchester, UK',
      remoteType: 'remote',
      salaryMin: 65,
      salaryMax: 80,
      status: 'interview',
      jobUrl: 'https://example.com/job2',
      notes: 'First interview scheduled for next Monday at 2pm.',
      lastUpdated: today,
      createdAt: now,
      updatedAt: now
    }
  ];
  
  // Insert sample jobs
  const insertStmt = database.db.prepare(`
    INSERT INTO jobs (
      jobTitle, company, location, remoteType, 
      salaryMin, salaryMax, status, jobUrl, 
      notes, lastUpdated, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Create a transaction for inserting multiple records
  const insertMany = database.db.transaction((jobs) => {
    for (const job of jobs) {
      insertStmt.run(
        job.jobTitle,
        job.company,
        job.location,
        job.remoteType,
        job.salaryMin,
        job.salaryMax,
        job.status,
        job.jobUrl,
        job.notes,
        job.lastUpdated,
        job.createdAt,
        job.updatedAt
      );
    }
  });
  
  insertMany(sampleJobs);
  
  console.log('Sample jobs inserted successfully');
};

// Run the initialization
initializeDatabase();

// Close the database connection when done
setTimeout(() => {
  database.db.close();
  console.log('Database initialization complete and connection closed');
  process.exit(0);
}, 1000); // Small delay to ensure queries complete
