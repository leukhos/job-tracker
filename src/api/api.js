// Base API URL - change this to your actual backend URL when deployed
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('API_BASE_URL:', API_BASE_URL);

// For handling network errors
const handleNetworkError = (error) => {
  console.error('Network error:', error);
  if (error.message === 'Failed to fetch' || !navigator.onLine) {
    return { error: 'Network error. Please check your internet connection.' };
  }
  return { error: error.message || 'An unexpected error occurred' };
};

// For handling API response errors
const handleApiResponse = async (response) => {
  // Check if the response is ok (status in the range 200-299)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `Error: ${response.status} ${response.statusText}`;
    console.error('API error:', errorMessage);
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  console.log('API response:', data);
  return data;
};

// API request with retry functionality
const fetchWithRetry = async (url, options = {}, retries = 3, delay = 1000) => {
  try {
    const response = await fetch(url, options);
    return await handleApiResponse(response);
  } catch (error) {
    if (retries > 0 && (error.message === 'Failed to fetch' || !navigator.onLine)) {
      console.log(`Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw error;
  }
};

// API Methods
const api = {
  // Get all jobs
  getAllJobs: async () => {
    try {
      return await fetchWithRetry(`${API_BASE_URL}/jobs`);
    } catch (error) {
      return handleNetworkError(error);
    }
  },
  
  // Get job by ID
  getJobById: async (id) => {
    try {
      return await fetchWithRetry(`${API_BASE_URL}/jobs/${id}`);
    } catch (error) {
      return handleNetworkError(error);
    }
  },
  
  // Create a new job
  createJob: async (jobData) => {
    try {
      return await fetchWithRetry(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });
    } catch (error) {
      return handleNetworkError(error);
    }
  },
  
  // Update an existing job
  updateJob: async (id, jobData) => {
    try {
      return await fetchWithRetry(`${API_BASE_URL}/jobs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });
    } catch (error) {
      return handleNetworkError(error);
    }
  },
  
  // Delete a job
  deleteJob: async (id) => {
    try {
      return await fetchWithRetry(`${API_BASE_URL}/jobs/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      return handleNetworkError(error);
    }
  }
};

export default api;
