import React, { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

const SaveSequenceDialog = ({ isOpen, onClose, onSave, initialName = '', isNewSequence = true }) => {
  const [name, setName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a sequence name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSave(name.trim());
      setName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save sequence');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isNewSequence ? 'Save Training Sequence' : 'Save As New Training Sequence'}
        </h3>
        
        <div className="mb-4">
          <Input
            label="Training Sequence Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a descriptive name"
            error={error}
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? 'Saving...' : 'Save Sequence'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SaveSequenceDialog;