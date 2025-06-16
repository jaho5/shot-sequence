import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { sequenceApi } from '../utils/api';

const SavedSequencesList = ({ isOpen, onLoadSequence, onClose }) => {
  const [sequences, setSequences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSequences();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const loadSequences = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await sequenceApi.getAllSequences();
      setSequences(data);
    } catch (err) {
      setError(err.message || 'Failed to load sequences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSequence = async (sequenceId) => {
    try {
      const sequence = await sequenceApi.getSequence(sequenceId);
      onLoadSequence(sequence);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to load sequence');
    }
  };

  const handleDeleteSequence = async (sequenceId, sequenceName) => {
    if (!window.confirm(`Are you sure you want to delete "${sequenceName}"?`)) {
      return;
    }

    try {
      await sequenceApi.deleteSequence(sequenceId);
      await loadSequences(); // Refresh the list
    } catch (err) {
      setError(err.message || 'Failed to delete sequence');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Saved Training Sequences
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading training sequences...
            </div>
          ) : sequences.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No saved training sequences found
            </div>
          ) : (
            <div className="space-y-3">
              {sequences.map((sequence) => (
                <div
                  key={sequence.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {sequence.name}
                      </h4>
                      <div className="text-sm text-gray-600">
                        <span>{sequence.totalShots} shots</span>
                        <span className="mx-2">•</span>
                        <span>Created {formatDate(sequence.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleLoadSequence(sequence.id)}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSequence(sequence.id, sequence.name)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SavedSequencesList;