import React from 'react';
import useJobs from '../api/useJobs';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

// This is an example of how to update your existing JobTracker component
// You can use this as a reference to modify your actual component

const ExampleJobTrackerUpdate = () => {
  // Replace useState with the custom hook
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

  // Your existing state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingJob, setEditingJob] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [formData, setFormData] = React.useState({
    jobTitle: '',
    company: '',
    location: '',
    remoteType: 'on-site',
    salaryMin: '',
    salaryMax: '',
    status: 'applied',
    jobUrl: '',
    notes: '',
    lastUpdated: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = React.useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(null);

  // Status options and other constants remain the same
  const statusOptions = [
    { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
    { value: 'screening', label: 'Screening', color: 'bg-yellow-100 text-yellow-800' },
    // ... rest of your status options
  ];

  // Example of how to modify your existing functions
  
  // Modified handleSubmit to use the API
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const jobData = {
      ...formData,
      salaryMin: formData.salaryMin ? Number(formData.salaryMin) : null,
      salaryMax: formData.salaryMax ? Number(formData.salaryMax) : null,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    try {
      if (editingJob) {
        await updateJob(editingJob.id, jobData);
      } else {
        await addJob(jobData);
      }
      closeModal();
    } catch (err) {
      console.error('Error saving job:', err);
      // Display error to user if needed
    }
  };

  // Modified deleteJob function
  const handleDeleteJob = async (jobId) => {
    await deleteJob(jobId);
    setShowDeleteConfirm(null);
  };

  // Modified handleStatusUpdate function
  const handleStatusUpdate = async (jobId, newStatus) => {
    await updateJobStatus(jobId, newStatus);
  };

  // Add a loading indicator component
  const LoadingIndicator = () => (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  // Network status indicator component
  const NetworkStatus = () => (
    <div className={`fixed bottom-20 right-4 p-2 rounded-full shadow-lg ${
      isOnline ? 'bg-green-100' : 'bg-red-100'
    }`}>
      <button 
        onClick={refreshJobs}
        className="flex items-center gap-1 text-xs p-1" 
        title={isOnline ? 'Online - Click to refresh' : 'Offline'}
      >
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600" />
        )}
        {pendingChanges > 0 && (
          <span className="bg-yellow-500 text-white rounded-full px-2 py-0.5 text-xs">
            {pendingChanges}
          </span>
        )}
      </button>
    </div>
  );

  // Error message component
  const ErrorMessage = ({ message }) => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>{message}</span>
      </div>
    </div>
  );

  // Rest of your component rendering
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Network Status Indicator */}
      <NetworkStatus />
      
      {/* Error Message */}
      {error && <ErrorMessage message={error} />}
      
      {/* Rest of your UI... */}
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        // Your existing UI code with jobs from the hook
        <div className="max-w-7xl mx-auto w-full flex flex-col min-h-screen">
          {/* Your existing code using the jobs from the hook */}
          {/* Remember to use the API functions for all job operations */}
        </div>
      )}
    </div>
  );
};

export default ExampleJobTrackerUpdate;
