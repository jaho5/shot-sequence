const HORIZONTAL_POSITIONS = ['Left', 'Center Left', 'Center', 'Center Right', 'Right'];
const DEPTH_POSITIONS = ['Back', 'Mid Back', 'Mid', 'Mid Front', 'Front'];

export const generateRandomShot = (space) => {
  const randomHorizontal = HORIZONTAL_POSITIONS[Math.floor(Math.random() * HORIZONTAL_POSITIONS.length)];
  const randomDepth = DEPTH_POSITIONS[Math.floor(Math.random() * DEPTH_POSITIONS.length)];
  
  return {
    horizontal: randomHorizontal,
    depth: randomDepth,
    space: space
  };
};

export const generateShotSequence = (numShots) => {
  const shots = [];
  
  for (let i = 0; i < numShots; i++) {
    const space = (i % 2) + 1; // Alternates between 1 and 2
    shots.push(generateRandomShot(space));
  }
  
  return shots;
};

export const getPositionCoordinates = (horizontal, depth) => {
  const horizontalIndex = HORIZONTAL_POSITIONS.indexOf(horizontal);
  const depthIndex = DEPTH_POSITIONS.indexOf(depth);
  
  // Convert to grid coordinates (0-4 for both x and y)
  return {
    x: horizontalIndex,
    y: depthIndex
  };
};

const getContinuousCoordinates = (shot) => {
  const baseCoords = getPositionCoordinates(shot.horizontal, shot.depth);
  
  if (shot.space === 1) {
    // Space 1: x=0-4, y=0-4 (Back=0, Front=4)
    return {
      x: baseCoords.x,
      y: baseCoords.y
    };
  } else {
    // Space 2: x=0-4, y=5-9 (Front=5, Back=9)
    // Front of Space 2 connects to Front of Space 1
    return {
      x: baseCoords.x,
      y: 9 - baseCoords.y  // Flip and offset: Back(0)→9, Front(4)→5
    };
  }
};

const calculateDistance = (shot1, shot2) => {
  const coords1 = getContinuousCoordinates(shot1);
  const coords2 = getContinuousCoordinates(shot2);
  
  // Euclidean distance in continuous field
  const dx = coords1.x - coords2.x;
  const dy = coords1.y - coords2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const isValidDistance = (shot1, shot2, minDistance, maxDistance) => {
  const distance = calculateDistance(shot1, shot2);
  return distance >= minDistance && distance <= maxDistance;
};

const getValidShotsWithinDistance = (previousShot, targetSpace, minDistance, maxDistance) => {
  const validShots = [];
  
  // Check all possible positions in the target space
  for (const horizontal of HORIZONTAL_POSITIONS) {
    for (const depth of DEPTH_POSITIONS) {
      const candidateShot = { horizontal, depth, space: targetSpace };
      const distance = calculateDistance(previousShot, candidateShot);
      
      if (distance >= minDistance && distance <= maxDistance) {
        validShots.push(candidateShot);
      }
    }
  }
  
  return validShots;
};

export const generateShotSequenceWithDistance = (numShots, minDistance = 0, maxDistance = Infinity) => {
  const maxRetries = 10; // Try multiple times with different starting positions
  
  for (let retry = 0; retry < maxRetries; retry++) {
    const shots = [];
    let success = true;
    
    for (let i = 0; i < numShots; i++) {
      const space = (i % 2) + 1;
      
      // For the first shot, no distance constraint needed
      if (i === 0) {
        shots.push(generateRandomShot(space));
      } else {
        // Get all valid shots within distance constraints
        const validShots = getValidShotsWithinDistance(shots[i - 1], space, minDistance, maxDistance);
        
        // If no valid shots exist, this attempt failed
        if (validShots.length === 0) {
          success = false;
          break;
        }
        
        // Randomly select from valid shots
        const randomIndex = Math.floor(Math.random() * validShots.length);
        shots.push(validShots[randomIndex]);
      }
    }
    
    // If we successfully generated all shots, return them
    if (success) {
      return shots;
    }
  }
  
  // If all retries failed, return null
  return null;
};

export { HORIZONTAL_POSITIONS, DEPTH_POSITIONS, calculateDistance, getContinuousCoordinates };