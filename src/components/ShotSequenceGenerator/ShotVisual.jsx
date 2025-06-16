import React, { useState, useRef } from 'react';
import { getPositionCoordinates, HORIZONTAL_POSITIONS, DEPTH_POSITIONS } from '../../utils/shotGenerators';

const ShotVisual = ({ shots, onDeleteShot, onAddShot, onInsertShot, fogSpace1 = false, fogSpace2 = false }) => {
  const GRID_SIZE = 5;
  const CELL_SIZE = 60;
  const MARGIN = 20;
  const SVG_WIDTH = GRID_SIZE * CELL_SIZE + 2 * MARGIN;
  const SVG_HEIGHT = GRID_SIZE * CELL_SIZE + 2 * MARGIN;

  const space1Shots = shots.filter(shot => shot.space === 1);
  const space2Shots = shots.filter(shot => shot.space === 2);

  const [contextMenu, setContextMenu] = useState(null);
  const [showPositionInput, setShowPositionInput] = useState(false);
  const [positionInput, setPositionInput] = useState('');
  const longPressTimeoutRef = useRef(null);

  const handleGridClick = (x, y, spaceNumber, isFlipped) => {
    if (!onAddShot) return;
    
    const actualY = isFlipped ? GRID_SIZE - 1 - y : y;
    const horizontal = HORIZONTAL_POSITIONS[x];
    const depth = DEPTH_POSITIONS[actualY];
    
    onAddShot({
      horizontal,
      depth,
      space: spaceNumber
    });
  };

  const handleShotClick = (shotIndex, event) => {
    event.stopPropagation();
    
    // Find all shots at this position
    const clickedShot = shots[shotIndex];
    const shotsAtPosition = shots.filter(shot => 
      shot.horizontal === clickedShot.horizontal &&
      shot.depth === clickedShot.depth &&
      shot.space === clickedShot.space
    );
    
    // If only one shot at position, delete it directly
    if (shotsAtPosition.length === 1) {
      onDeleteShot(shotIndex);
    } else {
      // Multiple shots - show delete menu
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        position: clickedShot,
        mode: 'delete',
        shotsAtPosition: shotsAtPosition.map(shot => shots.findIndex(s => s === shot))
      });
    }
  };

  const handleGridRightClick = (event, x, y, spaceNumber, isFlipped) => {
    event.preventDefault();
    event.stopPropagation();
    
    const actualY = isFlipped ? GRID_SIZE - 1 - y : y;
    const horizontal = HORIZONTAL_POSITIONS[x];
    const depth = DEPTH_POSITIONS[actualY];
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      position: { horizontal, depth, space: spaceNumber },
      mode: 'insert',
      gridX: x,
      gridY: y,
      spaceNumber,
      isFlipped
    });
  };

  const handleLongPressStart = (event, x, y, spaceNumber, isFlipped) => {
    const actualY = isFlipped ? GRID_SIZE - 1 - y : y;
    const horizontal = HORIZONTAL_POSITIONS[x];
    const depth = DEPTH_POSITIONS[actualY];
    
    longPressTimeoutRef.current = setTimeout(() => {
      const rect = event.target.getBoundingClientRect();
      setContextMenu({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        position: { horizontal, depth, space: spaceNumber },
        mode: 'insert',
        gridX: x,
        gridY: y,
        spaceNumber,
        isFlipped
      });
    }, 500); // 500ms long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setShowPositionInput(false);
    setPositionInput('');
  };

  const handleInsertAtBeginning = () => {
    if (onInsertShot) {
      onInsertShot(0, contextMenu.position);
    }
    closeContextMenu();
  };

  const handleInsertAtEnd = () => {
    if (onAddShot) {
      onAddShot(contextMenu.position);
    }
    closeContextMenu();
  };

  const togglePositionInput = () => {
    setShowPositionInput(!showPositionInput);
    setPositionInput('');
  };

  const handlePositionSubmit = () => {
    const shotNumber = parseInt(positionInput);
    if (shotNumber >= 1 && shotNumber <= shots.length + 1) {
      if (onInsertShot) {
        onInsertShot(shotNumber - 1, contextMenu.position); // Insert before shot N = insert at index N-1
      }
      closeContextMenu();
    }
  };

  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePositionSubmit();
    } else if (e.key === 'Escape') {
      togglePositionInput();
    }
  };

  const handleInsertAfter = (index) => {
    if (onInsertShot) {
      onInsertShot(index + 1, contextMenu.position);
    }
    closeContextMenu();
  };

  const handleInsertBefore = (index) => {
    if (onInsertShot) {
      onInsertShot(index, contextMenu.position);
    }
    closeContextMenu();
  };

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
            {/* Grid cells for click-to-add */}
            {!isFogged && Array.from({ length: GRID_SIZE }).map((_, y) => 
              Array.from({ length: GRID_SIZE }).map((_, x) => (
                <rect
                  key={`cell-${x}-${y}`}
                  x={MARGIN + x * CELL_SIZE}
                  y={MARGIN + y * CELL_SIZE}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  fill="transparent"
                  className="cursor-pointer hover:fill-blue-100 hover:fill-opacity-50"
                  onClick={() => handleGridClick(x, y, spaceNumber, isFlipped)}
                  onContextMenu={(e) => handleGridRightClick(e, x, y, spaceNumber, isFlipped)}
                  onMouseDown={(e) => {
                    if (e.button === 0) { // Left mouse button
                      handleLongPressStart(e, x, y, spaceNumber, isFlipped);
                    }
                  }}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  onTouchStart={(e) => handleLongPressStart(e.touches[0], x, y, spaceNumber, isFlipped)}
                  onTouchEnd={handleLongPressEnd}
                  onTouchCancel={handleLongPressEnd}
                />
              ))
            ).flat()}

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
                    onClick={(e) => handleShotClick(shots.findIndex(s => s === shot), e)}
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

  const renderContextMenu = () => {
    if (!contextMenu) return null;

    const isDeleteMode = contextMenu.mode === 'delete';
    const isInsertMode = contextMenu.mode === 'insert';

    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-40"
          onClick={closeContextMenu}
        />
        
        {/* Context Menu */}
        <div 
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-2 min-w-48"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 200),
            top: Math.min(contextMenu.y, window.innerHeight - 200)
          }}
        >
          <div className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-gray-200">
            {contextMenu.position.horizontal}, {contextMenu.position.depth}
            <div className="text-xs text-gray-500">Space {contextMenu.position.space}</div>
          </div>
          
          {isDeleteMode ? (
            // Delete mode - show shots to delete
            <>
              <div className="px-3 py-2 text-xs text-gray-600 border-b border-gray-200">
                Select shot to delete:
              </div>
              {contextMenu.shotsAtPosition.map((shotIndex) => (
                <button
                  key={shotIndex}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-700"
                  onClick={() => {
                    onDeleteShot(shotIndex);
                    closeContextMenu();
                  }}
                >
                  Delete shot {shotIndex + 1}
                </button>
              ))}
            </>
          ) : isInsertMode && !showPositionInput ? (
            // Insert mode - main menu
            <>
              {shots.length > 0 && (
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                  onClick={handleInsertAtBeginning}
                >
                  Insert at beginning
                </button>
              )}
              
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                onClick={handleInsertAtEnd}
              >
                Insert at end
              </button>
              
              {shots.length > 1 && (
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                  onClick={togglePositionInput}
                >
                  Insert at position...
                </button>
              )}
            </>
          ) : isInsertMode && showPositionInput ? (
            // Insert mode - position input
            <>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                onClick={togglePositionInput}
              >
                <span className="text-gray-400 mr-2">←</span>
                Back
              </button>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <div className="px-3 py-2">
                <div className="text-xs text-gray-600 mb-2">
                  Insert before shot # (1-{shots.length + 1}):
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max={shots.length + 1}
                    value={positionInput}
                    onChange={(e) => setPositionInput(e.target.value)}
                    onKeyDown={handleInputKeyPress}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="1"
                    autoFocus
                  />
                  <button
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                    onClick={handlePositionSubmit}
                  >
                    Insert
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {shots.length + 1} = insert at end • Press Enter to insert, Esc to cancel
                </div>
              </div>
            </>
          ) : null}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6 relative">
      {renderCourt(space1Shots, 1, false, fogSpace1)}
      {renderCourt(space2Shots, 2, true, fogSpace2)}
      {renderContextMenu()}
    </div>
  );
};

export default ShotVisual;