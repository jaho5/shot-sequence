import React from 'react';
import Button from '../ui/Button';

const ShotList = ({ shots, onDeleteShot }) => {
  if (shots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">No shots generated yet</p>
        <p className="text-gray-400 text-sm mt-2">Generate some shots to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-4">Shot Sequence ({shots.length} shots)</h3>
      <div className="space-y-2">
        {shots.map((shot, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </span>
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-1 sm:space-y-0">
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">Horizontal:</span>
                  <span className="font-medium text-blue-700">{shot.horizontal}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">Depth:</span>
                  <span className="font-medium text-green-700">{shot.depth}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">Space:</span>
                  <span className="font-medium text-purple-700">{shot.space}</span>
                </div>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDeleteShot(index)}
              className="ml-2 flex-shrink-0"
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShotList;