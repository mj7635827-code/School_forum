import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const Upload = () => {
  const { user } = useAuth();
  const [schoolIdNumber, setSchoolIdNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load existing school ID number if available
    if (user?.schoolIdNumber) {
      setSchoolIdNumber(user.schoolIdNumber);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Validate format (YYYY-NNNN-XX)
    const schoolIdPattern = /^\d{4}-\d{4}-\d{2}$/;
    if (!schoolIdPattern.test(schoolIdNumber)) {
      setMessage('Invalid format. Please use format: YYYY-NNNN-XX (e.g., 2025-0100-53)');
      setIsSuccess(false);
      setIsLoading(false);
      return;
    }

    // Validate year (must be 2025 or 2026)
    const year = parseInt(schoolIdNumber.substring(0, 4));
    if (year !== 2025 && year !== 2026) {
      setMessage('Invalid year. School ID must start with 2025 or 2026');
      setIsSuccess(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/upload/school-id-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ schoolIdNumber })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('School ID number saved successfully!');
        setIsSuccess(true);
      } else {
        setMessage(data.error || 'Failed to save School ID number');
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage('Error saving School ID number. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload ID Number</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter your school ID number for verification. This is required for account approval.
        </p>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Format:</strong> YYYY-NNNN-XX<br/>
            <strong>Example:</strong> 2025-0100-53<br/>
            <strong>Note:</strong> Year must be 2025 or 2026
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-2">
              School ID Number
            </label>
            <input
              type="text"
              id="schoolId"
              value={schoolIdNumber}
              onChange={(e) => setSchoolIdNumber(e.target.value)}
              placeholder="2025-0100-53"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: YYYY-NNNN-XX (Year-StudentNumber-Code)
            </p>
          </div>

          {message && (
            <div className={`flex items-center space-x-2 p-3 rounded-md ${
              isSuccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {isSuccess ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <XCircleIcon className="h-5 w-5" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Submitting...' : 'Submit ID Number'}
          </button>
        </form>

        {user?.status === 'pending' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Status:</strong> Your account is pending approval. Once you submit your School ID number, an admin will review your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;  