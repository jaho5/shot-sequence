import React, { useState, useEffect } from 'react';
import { generateShotSequence, generateShotSequenceWithDistance, createCustomShot, validateShotWithDistance, generateRandomShot, getValidShotsWithinDistance } from '../../utils/shotGenerators';
import ShotVisual from './ShotVisual';
import ShotList from './ShotList';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SaveSequenceDialog from '../SaveSequenceDialog';
import SavedSequencesList from '../SavedSequencesList';
import { sequenceApi } from '../../utils/api';

const ShotSequenceGenerator = () => {
  const [shots, setShots] = useState([]);
  const [numShots, setNumShots] = useState(10);
  const [error, setError] = useState('');
  const [fogSpace1, setFogSpace1] = useState(false);
  const [fogSpace2, setFogSpace2] = useState(false);
  const [minDistance, setMinDistance] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [currentSpace, setCurrentSpace] = useState(1);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSavedSequences, setShowSavedSequences] = useState(false);
  const [currentSequenceId, setCurrentSequenceId] = useState(null);
  const [currentSequenceName, setCurrentSequenceName] = useState('');
  const [backendAvailable, setBackendAvailable] = useState(null); // null = unknown, true/false = checked

  // Check backend availability on component mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const available = await sequenceApi.isBackendAvailable();
        setBackendAvailable(available);
      } catch {
        setBackendAvailable(false);
      }
    };
    checkBackend();
  }, []);

  const handleGenerateShots = () => {
    setError('');
    
    if (!numShots || numShots < 1) {
      setError('Please enter a valid number of shots (minimum 1)');
      return;
    }
    
    if (numShots > 100) {
      setError('Maximum 100 shots allowed');
      return;
    }

    const hasDistanceConstraints = minDistance !== '' || maxDistance !== '';
    
    // Determine starting space based on existing shots
    const startingSpace = shots.length === 0 ? 1 : (shots[shots.length - 1].space === 1 ? 2 : 1);
    
    if (hasDistanceConstraints) {
      const min = minDistance === '' ? 0 : parseFloat(minDistance);
      const max = maxDistance === '' ? Infinity : parseFloat(maxDistance);
      
      if (min < 0 || max < 0) {
        setError('Distance values must be non-negative');
        return;
      }
      
      if (min > max) {
        setError('Minimum distance cannot be greater than maximum distance');
        return;
      }
      
      // Generate shots starting from the appropriate space
      const generatedShots = [];
      const previousShot = shots.length > 0 ? shots[shots.length - 1] : null;
      
      for (let i = 0; i < parseInt(numShots); i++) {
        const space = i === 0 ? startingSpace : (generatedShots[i - 1].space === 1 ? 2 : 1);
        const prevShot = i === 0 ? previousShot : generatedShots[i - 1];
        
        if (prevShot && hasDistanceConstraints) {
          const validShots = getValidShotsWithinDistance(prevShot, space, min, max);
          if (validShots.length === 0) {
            setError('Unable to generate sequence with given distance constraints. Try relaxing the constraints.');
            return;
          }
          const randomIndex = Math.floor(Math.random() * validShots.length);
          generatedShots.push(validShots[randomIndex]);
        } else {
          generatedShots.push(generateRandomShot(space));
        }
      }
      
      setShots([...shots, ...generatedShots]);
    } else {
      // Generate shots starting from the appropriate space
      const generatedShots = [];
      for (let i = 0; i < parseInt(numShots); i++) {
        const space = i === 0 ? startingSpace : (generatedShots[i - 1].space === 1 ? 2 : 1);
        generatedShots.push(generateRandomShot(space));
      }
      setShots([...shots, ...generatedShots]);
    }
  };

  const handleDeleteShot = (index) => {
    setShots(shots.filter((_, i) => i !== index));
  };

  const handleNumShotsChange = (e) => {
    const value = e.target.value;
    setNumShots(value === '' ? '' : parseInt(value));
    setError('');
  };

  const handleAddManualShot = (shot) => {
    setError('');
    
    const hasDistanceConstraints = minDistance !== '' || maxDistance !== '';
    const previousShot = shots.length > 0 ? shots[shots.length - 1] : null;
    
    if (hasDistanceConstraints && previousShot) {
      const min = minDistance === '' ? 0 : parseFloat(minDistance);
      const max = maxDistance === '' ? Infinity : parseFloat(maxDistance);
      
      if (!validateShotWithDistance(shot, previousShot, min, max)) {
        setError('Shot violates distance constraints with previous shot');
        return;
      }
    }
    
    setShots([...shots, shot]);
    
    // Auto-alternate space for next shot
    setCurrentSpace(shot.space === 1 ? 2 : 1);
  };

  const handleClearShots = () => {
    setShots([]);
    setCurrentSpace(1);
    setError('');
  };

  const handleInsertShot = (index, shot) => {
    setError('');
    
    const hasDistanceConstraints = minDistance !== '' || maxDistance !== '';
    
    if (hasDistanceConstraints) {
      const min = minDistance === '' ? 0 : parseFloat(minDistance);
      const max = maxDistance === '' ? Infinity : parseFloat(maxDistance);
      
      // Check distance constraints with adjacent shots
      const prevShot = index > 0 ? shots[index - 1] : null;
      const nextShot = index < shots.length ? shots[index] : null;
      
      if (prevShot && !validateShotWithDistance(shot, prevShot, min, max)) {
        setError('Shot violates distance constraints with previous shot');
        return;
      }
      
      if (nextShot && !validateShotWithDistance(nextShot, shot, min, max)) {
        setError('Shot violates distance constraints with next shot');
        return;
      }
    }
    
    const newShots = [...shots];
    newShots.splice(index, 0, shot);
    setShots(newShots);
  };

  const handleSaveSequence = async (name) => {
    if (shots.length === 0) {
      throw new Error('No shots to save');
    }

    const sequenceData = {
      name,
      shots,
      settings: {
        minDistance: minDistance === '' ? null : parseFloat(minDistance),
        maxDistance: maxDistance === '' ? null : parseFloat(maxDistance)
      }
    };

    // Always create new sequence when using save dialog
    const savedSequence = await sequenceApi.createSequence(sequenceData);
    setCurrentSequenceId(savedSequence.id);
    setCurrentSequenceName(name);
  };

  const handleUpdateSequence = async () => {
    if (shots.length === 0) {
      throw new Error('No shots to update');
    }

    if (!currentSequenceId) {
      throw new Error('No sequence to update');
    }

    const sequenceData = {
      name: currentSequenceName,
      shots,
      settings: {
        minDistance: minDistance === '' ? null : parseFloat(minDistance),
        maxDistance: maxDistance === '' ? null : parseFloat(maxDistance)
      }
    };

    await sequenceApi.updateSequence(currentSequenceId, sequenceData);
  };

  const handleLoadSequence = (sequence) => {
    setShots(sequence.shots);
    setCurrentSequenceId(sequence.id);
    setCurrentSequenceName(sequence.name);
    
    // Load settings if available
    if (sequence.settings) {
      setMinDistance(sequence.settings.minDistance || '');
      setMaxDistance(sequence.settings.maxDistance || '');
    }
    
    setError('');
  };

  const handleNewSequence = () => {
    setShots([]);
    setCurrentSequenceId(null);
    setCurrentSequenceName('');
    setMinDistance('');
    setMaxDistance('');
    setCurrentSpace(1);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shot Sequence Generator</h1>
          <p className="text-gray-600">Create training sequences across two alternating playing spaces with advanced constraints</p>
          {currentSequenceName && (
            <p className="text-sm text-blue-600 mt-2">
              Current: {currentSequenceName}
            </p>
          )}
        </div>

        {/* Backend Status */}
        {backendAvailable === false && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-3">⚠️</div>
              <div>
                <p className="text-yellow-800 font-medium">Limited functionality</p>
                <p className="text-yellow-700 text-sm">Backend service unavailable. Save/load features are disabled.</p>
              </div>
            </div>
          </div>
        )}

        {/* Sequence Management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handleNewSequence} variant="outline">
              New Sequence
            </Button>
            <Button 
              onClick={() => setShowSavedSequences(true)} 
              variant="outline"
              disabled={backendAvailable === false}
            >
              Load Sequence
            </Button>
            
            {/* Show different buttons based on current sequence state */}
            {currentSequenceId ? (
              <>
                <Button 
                  onClick={async () => {
                    try {
                      await handleUpdateSequence();
                      // Could add a success message here if needed
                    } catch (err) {
                      setError(err.message || 'Failed to update sequence');
                    }
                  }}
                  disabled={shots.length === 0 || backendAvailable === false}
                >
                  Update "{currentSequenceName}"
                </Button>
                <Button 
                  onClick={() => setShowSaveDialog(true)}
                  disabled={shots.length === 0 || backendAvailable === false}
                  variant="outline"
                >
                  Save As New
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setShowSaveDialog(true)}
                disabled={shots.length === 0 || backendAvailable === false}
              >
                Save Sequence
              </Button>
            )}
          </div>
        </div>


        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <Input
                  label="Shots to generate"
                  type="number"
                  min="1"
                  max="100"
                  value={numShots}
                  onChange={handleNumShotsChange}
                  error={error}
                  placeholder="1-100 shots"
                />
              </div>
              <div>
                <Input
                  label="Minimum distance"
                  type="number"
                  min="0"
                  step="0.1"
                  value={minDistance}
                  onChange={(e) => setMinDistance(e.target.value)}
                  placeholder="Units (optional)"
                />
              </div>
              <div>
                <Input
                  label="Maximum distance"
                  type="number"
                  min="0"
                  step="0.1"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  placeholder="Units (optional)"
                />
              </div>
              <Button
                onClick={handleGenerateShots}
                size="lg"
                className="w-full"
              >
                Generate Shots
              </Button>
            </div>
            
            
            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Click grid: add shot • Right-click: insert at position
              </div>
              <Button onClick={handleClearShots} variant="outline" size="md">
                Clear Sequence
              </Button>
            </div>
          </div>
        </div>



        {/* Global Fog Controls */}
        {shots.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <label className="text-sm font-medium text-gray-700 mb-2">Visibility Controls:</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={fogSpace1}
                    onChange={(e) => setFogSpace1(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Hide Space 1</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={fogSpace2}
                    onChange={(e) => setFogSpace2(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Hide Space 2</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Shot Visualization */}
        {shots.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <ShotVisual 
              shots={shots} 
              onDeleteShot={handleDeleteShot}
              onAddShot={handleAddManualShot}
              onInsertShot={handleInsertShot}
              fogSpace1={fogSpace1}
              fogSpace2={fogSpace2}
            />
          </div>
        )}

        {/* Shot List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <ShotList 
            shots={shots} 
            onDeleteShot={handleDeleteShot}
          />
        </div>

        {/* Dialogs */}
        <SaveSequenceDialog
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onSave={handleSaveSequence}
          initialName={currentSequenceId ? '' : currentSequenceName}
          isNewSequence={!currentSequenceId}
        />

        <SavedSequencesList
          isOpen={showSavedSequences}
          onClose={() => setShowSavedSequences(false)}
          onLoadSequence={handleLoadSequence}
        />
      </div>
    </div>
  );
};

export default ShotSequenceGenerator;
