import { useState, useEffect, useCallback } from 'react';
import api from './api';

// Custom hook for managing job data with API integration
const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState([]);

  // Network status detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Try to process pending changes when we're back online
      processPendingChanges();
    };
    
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process any pending changes when connection is restored
  const processPendingChanges = useCallback(async () => {
    if (!isOnline || pendingChanges.length === 0) return;
    
    // Clone and clear the pending changes
    const changes = [...pendingChanges];
    setPendingChanges([]);
    
    // Process each pending change
    for (const change of changes) {
      try {
        switch (change.type) {
          case 'add':
            await api.createJob(change.data);
            break;
          case 'update':
            await api.updateJob(change.data.id, change.data);
            break;
          case 'delete':
            await api.deleteJob(change.data.id);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Failed to process pending change:', error);
        // Add it back to pending changes
        setPendingChanges(prev => [...prev, change]);
      }
    }
    
    // Refresh the job list after processing changes
    fetchJobs();
  }, [isOnline, pendingChanges]);
  // Initial data fetch
  const fetchJobs = useCallback(async () => {
    if (!isOnline) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching jobs from API...');
      const data = await api.getAllJobs();
        if (data.error) {
        console.error('Error returned from API:', data.error);
        setError(data.error);
      } else {
        console.log('Successfully fetched jobs:', data);
        // Check if the response has a data property (which indicates the paginated response format)
        const jobsArray = data.data || data;
        setJobs(Array.isArray(jobsArray) ? jobsArray : []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to fetch jobs. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [isOnline]);

  // Load jobs on mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Add a new job
  const addJob = async (jobData) => {
    // Create a temporary ID for optimistic UI updates
    const tempId = Date.now();
    const newJob = { 
      ...jobData,
      id: tempId,
      lastUpdated: new Date().toISOString().split('T')[0] 
    };
    
    // Optimistic update
    setJobs(prevJobs => [...prevJobs, newJob]);
    
    if (!isOnline) {
      // Store for syncing later
      setPendingChanges(prev => [...prev, { type: 'add', data: newJob }]);
      return { id: tempId };
    }
    
    try {
      const response = await api.createJob(jobData);
      
      if (response.error) {
        setError(response.error);
        // Revert optimistic update
        setJobs(prevJobs => prevJobs.filter(job => job.id !== tempId));
        return null;
      }
      
      // Replace the temporary job with the real one from the server
      setJobs(prevJobs => 
        prevJobs.map(job => job.id === tempId ? response : job)
      );
      
      return response;
    } catch (err) {
      setError('Failed to add job. Please try again.');
      console.error('Error adding job:', err);
      
      // Revert optimistic update
      setJobs(prevJobs => prevJobs.filter(job => job.id !== tempId));
      return null;
    }
  };

  // Update an existing job
  const updateJob = async (id, jobData) => {
    // Store the original job for reverting if needed
    const originalJob = jobs.find(job => job.id === id);
    
    if (!originalJob) {
      setError(`Job with ID ${id} not found`);
      return null;
    }
    
    // Create the updated job
    const updatedJob = { 
      ...originalJob, 
      ...jobData,
      lastUpdated: new Date().toISOString().split('T')[0] 
    };
    
    // Optimistic update
    setJobs(prevJobs => 
      prevJobs.map(job => job.id === id ? updatedJob : job)
    );
    
    if (!isOnline) {
      // Store for syncing later
      setPendingChanges(prev => [...prev, { type: 'update', data: updatedJob }]);
      return updatedJob;
    }
    
    try {
      const response = await api.updateJob(id, jobData);
      
      if (response.error) {
        setError(response.error);
        // Revert optimistic update
        setJobs(prevJobs => 
          prevJobs.map(job => job.id === id ? originalJob : job)
        );
        return null;
      }
      
      return response;
    } catch (err) {
      setError('Failed to update job. Please try again.');
      console.error('Error updating job:', err);
      
      // Revert optimistic update
      setJobs(prevJobs => 
        prevJobs.map(job => job.id === id ? originalJob : job)
      );
      return null;
    }
  };

  // Delete a job
  const deleteJob = async (id) => {
    // Store the original job for reverting if needed
    const originalJob = jobs.find(job => job.id === id);
    
    if (!originalJob) {
      setError(`Job with ID ${id} not found`);
      return false;
    }
    
    // Optimistic update
    setJobs(prevJobs => prevJobs.filter(job => job.id !== id));
    
    if (!isOnline) {
      // Store for syncing later
      setPendingChanges(prev => [...prev, { type: 'delete', data: { id } }]);
      return true;
    }
    
    try {
      const response = await api.deleteJob(id);
      
      if (response.error) {
        setError(response.error);
        // Revert optimistic update
        setJobs(prevJobs => [...prevJobs, originalJob]);
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Failed to delete job. Please try again.');
      console.error('Error deleting job:', err);
      
      // Revert optimistic update
      setJobs(prevJobs => [...prevJobs, originalJob]);
      return false;
    }
  };
  // Update job status (convenience method)
  const updateJobStatus = async (id, newStatus) => {
    // Find the current job data to preserve required fields
    const currentJob = jobs.find(job => job.id === id);
    if (!currentJob) {
      setError(`Job with ID ${id} not found`);
      return null;
    }
    
    return updateJob(id, { 
      // Include required fields to satisfy server validation
      jobTitle: currentJob.jobTitle,
      company: currentJob.company,
      status: newStatus,
      lastUpdated: new Date().toISOString().split('T')[0]
    });
  };

  // Manual refresh method
  const refreshJobs = () => {
    fetchJobs();
  };

  return {
    jobs,
    isLoading,
    error,
    isOnline,
    pendingChanges: pendingChanges.length,
    addJob,
    updateJob,
    deleteJob,
    updateJobStatus,
    refreshJobs
  };
};

export default useJobs;
