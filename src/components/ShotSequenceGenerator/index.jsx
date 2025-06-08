import React, { useState } from 'react';
import { generateShotSequence, generateShotSequenceWithDistance } from '../../utils/shotGenerators';
import ShotVisual from './ShotVisual';
import ShotList from './ShotList';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ShotSequenceGenerator = () => {
  const [shots, setShots] = useState([]);
  const [numShots, setNumShots] = useState(10);
  const [error, setError] = useState('');
  const [fogSpace1, setFogSpace1] = useState(false);
  const [fogSpace2, setFogSpace2] = useState(false);
  const [minDistance, setMinDistance] = useState('');
  const [maxDistance, setMaxDistance] = useState('');

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
      
      const newShots = generateShotSequenceWithDistance(parseInt(numShots), min, max);
      if (!newShots) {
        setError('Unable to generate sequence with given distance constraints. Try relaxing the constraints.');
        return;
      }
      setShots(newShots);
    } else {
      const newShots = generateShotSequence(parseInt(numShots));
      setShots(newShots);
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

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shot Sequence Generator</h1>
          <p className="text-gray-600">Generate random shot sequences across two alternating spaces</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <Input
                  label="Number of shots"
                  type="number"
                  min="1"
                  max="100"
                  value={numShots}
                  onChange={handleNumShotsChange}
                  error={error}
                  placeholder="Enter shots"
                />
              </div>
              <div>
                <Input
                  label="Min distance"
                  type="number"
                  min="0"
                  step="0.1"
                  value={minDistance}
                  onChange={(e) => setMinDistance(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Input
                  label="Max distance"
                  type="number"
                  min="0"
                  step="0.1"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  placeholder="Optional"
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
            
            {/* Fog Controls */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700 mb-2">Fog of War:</label>
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
        </div>

        {/* Shot Visualization */}
        {shots.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <ShotVisual 
              shots={shots} 
              onDeleteShot={handleDeleteShot} 
              fogSpace1={fogSpace1}
              fogSpace2={fogSpace2}
            />
          </div>
        )}

        {/* Shot List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <ShotList shots={shots} onDeleteShot={handleDeleteShot} />
        </div>
      </div>
    </div>
  );
};

export default ShotSequenceGenerator;