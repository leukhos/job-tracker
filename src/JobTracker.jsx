import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  PoundSterling,
  Monitor,
  Calendar,
  Briefcase,
  ExternalLink,
  X,
  Search,
  Clock,
  ChevronDown,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import useJobs from './api/useJobs';

// Status Dropdown Component
const StatusDropdown = ({ status, onStatusChange, statusOptions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const statusConfig = statusOptions.find(opt => opt.value === status);

  return (
    <div className="relative" ref={dropdownRef}>      <button
      type="button"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${statusConfig.color}`}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
    >
      {statusConfig.label}
      <ChevronDown className="h-3 w-3" />
    </button>
      {isOpen && (
        <div className="absolute right-0 z-[60] mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {statusOptions.map((option) => (              <button
                type="button"
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(option.value);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-1 text-sm ${option.color} hover:opacity-80 ${status === option.value ? 'font-medium' : ''
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const JobTracker = () => {
  // Use our custom hook instead of useState for jobs
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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
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
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const statusOptions = [
    { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
    { value: 'screening', label: 'Screening', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-800' },
    { value: 'followup', label: 'Follow-up', color: 'bg-orange-100 text-orange-800' },
    { value: 'offer', label: 'Offer', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' }
  ];
  const remoteOptions = [
    { value: 'on-site', label: 'On-site' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'remote', label: 'Remote' }
  ];

  const resetForm = () => {
    setFormData({
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
    setErrors({});
    setEditingJob(null);
  };
  const openModal = (job = null) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        jobTitle: job.jobTitle,
        company: job.company,
        location: job.location || '',
        remoteType: job.remoteType,
        salaryMin: job.salaryMin || '',
        salaryMax: job.salaryMax || '',
        status: job.status,
        jobUrl: job.jobUrl || '',
        notes: job.notes || '',
        lastUpdated: job.lastUpdated || new Date().toISOString().split('T')[0]
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    }

    if (formData.salaryMin && formData.salaryMax &&
      Number(formData.salaryMin) > Number(formData.salaryMax)) {
      newErrors.salary = 'Minimum salary cannot be greater than maximum salary';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
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
      setErrors(prev => ({ ...prev, api: 'Failed to save job. Please try again.' }));
    }
  };
  const handleDeleteJob = (jobId) => {
    deleteJob(jobId);
    setShowDeleteConfirm(null);
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const formatValue = (value) => `£${value}k`;
    if (min && max) return `${formatValue(min)} - ${formatValue(max)}`;
    if (min) return `${formatValue(min)}+`;
    if (max) return `Up to ${formatValue(max)}`;
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };
  // Status grouping functions
  const getJobStatusGroup = (status) => {
    if (status === 'applied') return 'applied';
    if (['screening', 'interview', 'followup', 'offer'].includes(status)) return 'active';
    if (['rejected', 'withdrawn'].includes(status)) return 'archived';
    return 'applied'; // fallback
  };

  const isJobArchived = (status) => {
    return ['rejected', 'withdrawn'].includes(status);
  };

  // Filtering and sorting functions
  const isJobOld = (lastUpdated, status) => {
    if (!lastUpdated) return false;
    // Don't apply orange border rule to archived jobs
    if (isJobArchived(status)) return false;
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return new Date(lastUpdated) < twoWeeksAgo;
  };

  const filteredAndSortedJobs = () => {
    let filtered = jobs;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => getJobStatusGroup(job.status) === statusFilter);
    }    // Always sort by company name
    filtered.sort((a, b) => {
      const aValue = a.company.toLowerCase();
      const bValue = b.company.toLowerCase();

      if (aValue < bValue) return -1; // Always ascending order
      if (aValue > bValue) return 1;
      return 0;
    });

    return filtered;
  };
  const handleStatusUpdate = (jobId, newStatus) => {
    updateJobStatus(jobId, newStatus);
  };

  const handleStatClick = (filterType) => {
    setStatusFilter(filterType === 'total' ? 'all' : filterType);
    setSearchTerm('');
  };

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

  // Loading indicator component
  const LoadingIndicator = () => (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Network Status Indicator */}
      <NetworkStatus />
      
      <div className="max-w-7xl mx-auto w-full flex flex-col min-h-screen">
        {/* Top Search Bar */}
        <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-40">
          <div className="flex items-center px-2 py-2">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-8 pr-4 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
            <button
              onClick={() => openModal()}
              className="ml-2 h-8 w-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title="Add New Job"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-2 sm:p-4 pb-16">
          {/* Error Message */}
          {error && <ErrorMessage message={error} />}
          
          {/* Loading State */}
          {isLoading ? (
            <LoadingIndicator />
          ) : (
            /* Job List */
            filteredAndSortedJobs().length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {jobs.length === 0 ? 'No job applications yet' : 'No jobs match your filters'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {jobs.length === 0
                    ? 'Start tracking your job applications by adding your first one.'
                    : 'Try adjusting your search or filters to find what you\'re looking for.'
                  }
                </p>
                {jobs.length === 0 && (
                  <button
                    onClick={() => openModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Job
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredAndSortedJobs().map((job) => (
                  <div
                    key={job.id}
                    className={`${isJobArchived(job.status) ? 'bg-gray-50' : 'bg-white'} rounded-lg shadow-sm hover:shadow-md transition-shadow ${isJobOld(job.lastUpdated, job.status) ? 'border-l-4 border-orange-400' : ''}`}
                  >
                    <div className="p-4 sm:p-6">
                      {/* First line: job title and company */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{job.jobTitle}</h3>
                        </div>
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          <button
                            onClick={() => openModal(job)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(job.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Company name and location on same line */}
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <span className="font-medium truncate">{job.company}</span>
                          {job.location && (
                            <>
                              <span className="text-gray-400">•</span>
                              <div className="flex items-center gap-1 truncate">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{job.location}</span>
                              </div>
                              <span className="text-gray-400">•</span>
                              <span className="capitalize">{job.remoteType}</span>
                            </>
                          )}
                          {!job.location && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="capitalize">{job.remoteType}</span>
                            </>
                          )}
                        </div>

                        {/* Salary and status on same line */}
                        <div className="flex items-center justify-between">
                          {formatSalary(job.salaryMin, job.salaryMax) ? (
                            <div className="flex items-center gap-1 text-gray-600 text-sm">
                              <PoundSterling className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">No salary info</div>
                          )}

                          <StatusDropdown
                            status={job.status}
                            onStatusChange={(newStatus) => handleStatusUpdate(job.id, newStatus)}
                            statusOptions={statusOptions}
                          />
                        </div>
                        
                        {/* Notes */}
                        {job.notes && (
                          <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-600">
                            <div className="max-h-32 overflow-y-auto prose prose-sm max-w-none prose-gray prose-ul:my-2 prose-li:my-0">
                              <ReactMarkdown>{job.notes}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Bottom line: link to job, last update date */}
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                          {job.jobUrl ? (
                            <a
                              href={job.jobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View Job
                            </a>
                          ) : (
                            <span className="text-gray-400">No job link</span>
                          )}

                          <div className={`flex items-center gap-1 ${isJobArchived(job.status) ? 'text-gray-400' : isJobOld(job.lastUpdated, job.status) ? 'text-orange-600' : 'text-gray-500'}`}>
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>Updated: {formatDate(job.lastUpdated)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Status Group Filters Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex w-full">
              <button
                onClick={() => handleStatClick('total')}
                className={`flex-1 h-14 flex flex-col items-center justify-center transition-colors ${statusFilter === 'all' ? 'bg-blue-50 text-blue-600 border-t-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                title="All Applications"
              >
                <Briefcase className="h-5 w-5 mb-1" />
                <span className="text-xs">All</span>
              </button>

              <button
                onClick={() => handleStatClick('applied')}
                className={`flex-1 h-14 flex flex-col items-center justify-center transition-colors ${statusFilter === 'applied' ? 'bg-blue-50 text-blue-600 border-t-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                title="Applied Jobs"
              >
                <Clock className="h-5 w-5 mb-1" />
                <span className="text-xs">Applied</span>
              </button>

              <button
                onClick={() => handleStatClick('active')}
                className={`flex-1 h-14 flex flex-col items-center justify-center transition-colors ${statusFilter === 'active' ? 'bg-green-50 text-green-600 border-t-2 border-green-600' : 'text-gray-600 hover:text-gray-900'}`}
                title="Active Applications (Screening to Offer)"
              >
                <Monitor className="h-5 w-5 mb-1" />
                <span className="text-xs">Active</span>
              </button>

              <button
                onClick={() => handleStatClick('archived')}
                className={`flex-1 h-14 flex flex-col items-center justify-center transition-colors ${statusFilter === 'archived' ? 'bg-gray-50 text-gray-600 border-t-2 border-gray-600' : 'text-gray-600 hover:text-gray-900'}`}
                title="Archived Applications (Rejected/Withdrawn)"
              >
                <X className="h-5 w-5 mb-1" />
                <span className="text-xs">Archived</span>
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Job Application</h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Are you sure you want to delete this job application? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => handleDeleteJob(showDeleteConfirm)}
                  className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors font-medium order-2 sm:order-1"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="w-full sm:flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg transition-colors font-medium order-1 sm:order-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Job Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {editingJob ? 'Edit Job Application' : 'Add New Job Application'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* API Error */}
                  {errors.api && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      <p className="text-sm">{errors.api}</p>
                    </div>
                  )}
                  
                  {/* Job Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      className={`w-full px-3 py-3 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${errors.jobTitle ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="e.g. Senior Software Engineer"
                    />
                    {errors.jobTitle && <p className="mt-1 text-sm text-red-600">{errors.jobTitle}</p>}
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className={`w-full px-3 py-3 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm ${errors.company ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="e.g. Google"
                    />
                    {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company}</p>}
                  </div>

                  {/* Location and Remote Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                        placeholder="e.g. London, UK"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Work Type
                      </label>
                      <select
                        value={formData.remoteType}
                        onChange={(e) => setFormData({ ...formData, remoteType: e.target.value })}
                        className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                      >
                        {remoteOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary Range (in thousands £)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          value={formData.salaryMin}
                          onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                          className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                          placeholder="Min (e.g. 70 for £70k)"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={formData.salaryMax}
                          onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                          className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                          placeholder="Max (e.g. 90 for £90k)"
                        />
                      </div>
                    </div>
                    {errors.salary && <p className="mt-1 text-sm text-red-600">{errors.salary}</p>}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <StatusDropdown
                      status={formData.status}
                      onStatusChange={(newStatus) => setFormData({ ...formData, status: newStatus })}
                      statusOptions={statusOptions}
                    />
                  </div>

                  {/* Job URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job URL
                    </label>
                    <input
                      type="url"
                      value={formData.jobUrl}
                      onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                      placeholder="https://..."
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                      placeholder="Any additional notes about this application..."
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                    <button
                      type="submit"
                      className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors order-2 sm:order-1"
                    >
                      {editingJob ? 'Update Application' : 'Add Application'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full sm:flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors order-1 sm:order-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobTracker;
