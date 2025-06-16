const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { 
  getAllJobs, 
  getJobById, 
  createJob, 
  updateJob, 
  deleteJob 
} = require('./database');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8070;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

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
// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await getAllJobs();
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs', details: error.message });
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
app.post('/api/jobs', async (req, res) => {
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
app.put('/api/jobs/:id', async (req, res) => {
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
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
