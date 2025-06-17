const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { 
  getAllJobs, 
  getJobById, 
  createJob, 
  updateJob, 
  deleteJob,
  searchJobs,
  closeDatabase
} = require('./database');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8070;

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
    res.json({
      data: jobs,
      pagination: {
        limit,
        offset,
        total: jobs.length // Note: For accurate count we'd need a separate count query
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
    
    const jobs = await searchJobs({ searchTerm, status }, limit, offset);
    res.json({
      data: jobs,
      pagination: {
        limit,
        offset,
        total: jobs.length
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

// Search jobs - Must be before the ID route to avoid conflict
app.get('/api/jobs/search', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const searchTerm = req.query.q || '';
    const status = req.query.status || null;
    
    const jobs = await searchJobs({ searchTerm, status }, limit, offset);
    res.json({
      data: jobs,
      pagination: {
        limit,
        offset,
        total: jobs.length
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

// Handle production
// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../build')));

  // Any route that's not the API will be directed to the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

// Start the server
let server;
if (process.env.NODE_ENV !== 'test') {
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
module.exports = { app, errorHandler, validateJobInput, server };
