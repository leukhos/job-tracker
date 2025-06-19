// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { 
  getAllJobs, 
  getJobById, 
  createJob, 
  updateJob, 
  deleteJob,
  searchJobs,
  closeDatabase,
  countAllJobs,
  countSearchResults
} = require('./database');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8070;

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes by default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests, please try again later.',
    statusCode: 429,
    timestamp: new Date().toISOString()
  }
});

// Apply rate limiting to all API routes
app.use('/api', limiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // Better logging

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[ERROR] ${req.method} ${req.url}: ${err.message}`);
  
  // Don't expose stack traces in production
  const errorResponse = {
    error: err.message || 'Internal Server Error',
    statusCode,
    timestamp: new Date().toISOString()
  };
  
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

// Validation middleware
const validateJobInput = (req, res, next) => {
  const { jobTitle, company } = req.body;
  const errors = {};

  if (!jobTitle) errors.jobTitle = 'Job title is required';
  if (!company) errors.company = 'Company is required';

  // Optional validations
  if (req.body.salaryMin && !Number.isInteger(parseInt(req.body.salaryMin))) {
    errors.salaryMin = 'Salary minimum must be a number';
  }
  
  if (req.body.salaryMax && !Number.isInteger(parseInt(req.body.salaryMax))) {
    errors.salaryMax = 'Salary maximum must be a number';
  }
  
  if (req.body.salaryMin && req.body.salaryMax && 
      parseInt(req.body.salaryMin) > parseInt(req.body.salaryMax)) {
    errors.salary = 'Minimum salary cannot be greater than maximum salary';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  
  next();
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Job Tracker API is running' });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime() + ' seconds',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || require('./package.json').version,
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  });
});

// API Routes
// Get all jobs with pagination
app.get('/api/jobs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const jobs = await getAllJobs(limit, offset);
    
    // Get total count if the function exists, otherwise use jobs.length
    let totalCount = jobs.length;
    try {
      if (typeof countAllJobs === 'function') {
        totalCount = await countAllJobs();
      }
    } catch (countError) {
      console.warn('Count function not available, using page length');
    }
    
    res.json({
      data: jobs,
      pagination: {
        limit,
        offset,
        total: totalCount,
        currentPageCount: jobs.length
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs', details: error.message });
  }
});

// Search jobs - Must be before the ID route to avoid conflict
app.get('/api/jobs/search', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const searchTerm = req.query.q || '';
    const status = req.query.status || null;
    
    const criteria = { searchTerm, status };
    const jobs = await searchJobs(criteria, limit, offset);
    
    // Get total count if the function exists, otherwise use jobs.length
    let totalCount = jobs.length;
    try {
      if (typeof countSearchResults === 'function') {
        totalCount = await countSearchResults(criteria);
      }
    } catch (countError) {
      console.warn('Count function not available, using page length');
    }
    
    res.json({
      data: jobs,
      pagination: {
        limit,
        offset,
        total: totalCount,
        currentPageCount: jobs.length
      },
      filters: {
        searchTerm,
        status
      }
    });
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({ error: 'Failed to search jobs', details: error.message });
  }
});

// Get job by ID
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job', details: error.message });
  }
});

// Create new job
app.post('/api/jobs', validateJobInput, async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.jobTitle || !req.body.company) {
      return res.status(400).json({ error: 'Job title and company are required' });
    }
    
    const newJob = await createJob(req.body);
    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job', details: error.message });
  }
});

// Update job
app.put('/api/jobs/:id', validateJobInput, async (req, res) => {
  try {
    // If it's only a status update, we should get the existing job data
    if (req.body.status && Object.keys(req.body).length <= 3 && !req.body.jobTitle && !req.body.company) {
      // This might be just a status update
      const existingJob = await getJobById(req.params.id);
      if (!existingJob) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      // Only updating specific fields, so merge with existing data
      const updatedJob = await updateJob(req.params.id, {
        ...existingJob,
        ...req.body
      });
      return res.json(updatedJob);
    }
    
    // For full updates, validate required fields
    if (!req.body.jobTitle || !req.body.company) {
      return res.status(400).json({ error: 'Job title and company are required' });
    }
    
    const updatedJob = await updateJob(req.params.id, req.body);
    res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update job', details: error.message });
  }
});

// Delete job
app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const result = await deleteJob(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting job:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete job', details: error.message });
  }
});

// Production mode - API only (frontend served separately)

// Error handling middleware
app.use(errorHandler);

// Export for testing
module.exports = {
  app,
  errorHandler,
  validateJobInput
};

// If this file is being run directly (not imported), start the server
let server;
if (require.main === module) {
  // Start the server
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Gracefully shutting down the server...');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      closeDatabase(); // Close database connections
      process.exit(0);
    });
  } else {
    closeDatabase(); // Close database connections
    process.exit(0);
  }
};

// Handle termination signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Export app for testing
module.exports = { app, errorHandler, validateJobInput };
