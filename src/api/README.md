# Frontend API Integration

This folder contains the code needed to integrate the frontend React application with the backend API.

## Files

- `api.js` - API client with functions for calling the backend
- `useJobs.js` - Custom React hook that manages job data with API integration
- `example-component-update.js` - Example of how to update an existing component

## How to Use

1. Import the `useJobs` hook in your component:

```jsx
import useJobs from './api/useJobs';
```

2. Replace your local state with the hook:

```jsx
// Before:
const [jobs, setJobs] = useState([]);

// After:
const {
  jobs,
  isLoading,
  error,
  isOnline,
  pendingChanges,
  addJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  refreshJobs
} = useJobs();
```

3. Update your form submission handlers to use the API methods:

```jsx
// Before:
const handleSubmit = (e) => {
  e.preventDefault();
  const jobData = { /* ... */ };
  setJobs([...jobs, jobData]);
};

// After:
const handleSubmit = async (e) => {
  e.preventDefault();
  const jobData = { /* ... */ };
  await addJob(jobData);
};
```

4. Add loading and error states to your UI:

```jsx
{isLoading && <LoadingIndicator />}
{error && <ErrorMessage message={error} />}
```

## Features

- Automatic data loading from the API
- Optimistic UI updates
- Offline support with pending changes queue
- Error handling
- Network status detection
- Automatic retry on failed requests

## Configuration

By default, the API client connects to `http://localhost:8070/api`. You can change this by setting the `VITE_API_URL` environment variable in your `.env` file:

```
VITE_API_URL=http://your-nas-ip:8070/api
```
