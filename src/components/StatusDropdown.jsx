import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

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
    <div className="relative" ref={dropdownRef}>
      <button
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${statusConfig.color}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {statusConfig.label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onStatusChange(option.value);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-1 text-sm ${option.color} hover:opacity-80 ${
                  status === option.value ? 'font-medium' : ''
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

export default StatusDropdown;
