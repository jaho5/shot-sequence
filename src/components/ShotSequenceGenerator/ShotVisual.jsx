import React from 'react';
import { getPositionCoordinates, HORIZONTAL_POSITIONS, DEPTH_POSITIONS } from '../../utils/shotGenerators';

const ShotVisual = ({ shots, onDeleteShot, fogSpace1 = false, fogSpace2 = false }) => {
  const GRID_SIZE = 5;
  const CELL_SIZE = 60;
  const MARGIN = 20;
  const SVG_WIDTH = GRID_SIZE * CELL_SIZE + 2 * MARGIN;
  const SVG_HEIGHT = GRID_SIZE * CELL_SIZE + 2 * MARGIN;

  const space1Shots = shots.filter(shot => shot.space === 1);
  const space2Shots = shots.filter(shot => shot.space === 2);

  const renderCourt = (spaceShots, spaceNumber, isFlipped = false, isFogged = false) => {
    // Group shots by position
    const shotsByPosition = {};
    spaceShots.forEach((shot) => {
      const positionKey = `${shot.horizontal}-${shot.depth}`;
      if (!shotsByPosition[positionKey]) {
        shotsByPosition[positionKey] = [];
      }
      shotsByPosition[positionKey].push(shot);
    });

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-center">
          Space {spaceNumber} {isFogged && <span className="text-gray-400">(Hidden)</span>}
        </h3>
        <div className="flex justify-center">
          <svg width={SVG_WIDTH} height={SVG_HEIGHT} className={`border border-gray-300 ${isFogged ? 'bg-gray-400' : 'bg-green-50'}`}>
            {/* Grid lines */}
            {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
              <g key={i}>
                <line
                  x1={MARGIN + i * CELL_SIZE}
                  y1={MARGIN}
                  x2={MARGIN + i * CELL_SIZE}
                  y2={SVG_HEIGHT - MARGIN}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <line
                  x1={MARGIN}
                  y1={MARGIN + i * CELL_SIZE}
                  x2={SVG_WIDTH - MARGIN}
                  y2={MARGIN + i * CELL_SIZE}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              </g>
            ))}

            {/* Position labels */}
            {HORIZONTAL_POSITIONS.map((pos, i) => (
              <text
                key={`h-${i}`}
                x={MARGIN + i * CELL_SIZE + CELL_SIZE / 2}
                y={MARGIN - 5}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {pos.slice(0, 1)}
              </text>
            ))}

            {DEPTH_POSITIONS.map((pos, i) => {
              const displayIndex = isFlipped ? DEPTH_POSITIONS.length - 1 - i : i;
              const displayPos = DEPTH_POSITIONS[displayIndex];
              return (
                <text
                  key={`d-${i}`}
                  x={MARGIN - 10}
                  y={MARGIN + i * CELL_SIZE + CELL_SIZE / 2}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                  dominantBaseline="middle"
                >
                  {displayPos.slice(0, 1)}
                </text>
              );
            })}

            {/* Shot circles with sequence numbers */}
            {!isFogged && Object.entries(shotsByPosition).map(([positionKey, positionShots], index) => {
              const shot = positionShots[0]; // Use first shot for positioning
              const coords = getPositionCoordinates(shot.horizontal, shot.depth);
              const displayY = isFlipped ? GRID_SIZE - 1 - coords.y : coords.y;
              const cx = MARGIN + coords.x * CELL_SIZE + CELL_SIZE / 2;
              const cy = MARGIN + displayY * CELL_SIZE + CELL_SIZE / 2;
              const shotNumbers = positionShots.map(s => shots.findIndex(shot => shot === s) + 1).sort((a, b) => a - b);
              const displayText = shotNumbers.length > 1 ? shotNumbers.join(',') : shotNumbers[0].toString();
              
              // Dynamic circle size based on text length
              const baseRadius = 15;
              const textLength = displayText.length;
              const radius = Math.max(baseRadius, baseRadius + (textLength - 2) * 2);

              return (
                <g key={index}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="#3b82f6"
                    stroke="#1e40af"
                    strokeWidth="2"
                    className="cursor-pointer hover:fill-blue-700"
                    onClick={() => onDeleteShot(shots.findIndex(s => s === shot))}
                  />
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-bold fill-white pointer-events-none"
                  >
                    {displayText}
                  </text>
                </g>
              );
            })}

            {/* Fog overlay */}
            {isFogged && (
              <rect
                x={MARGIN}
                y={MARGIN}
                width={GRID_SIZE * CELL_SIZE}
                height={GRID_SIZE * CELL_SIZE}
                fill="rgba(107, 114, 128, 0.8)"
                className="pointer-events-none"
              />
            )}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderCourt(space1Shots, 1, false, fogSpace1)}
      {renderCourt(space2Shots, 2, true, fogSpace2)}
    </div>
  );
};

export default ShotVisual;