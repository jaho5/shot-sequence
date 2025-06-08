# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` - Start development server (runs on localhost:3000)
- `npm run build` - Build production bundle
- `npm test` - Run test suite
- `npm test -- --watch` - Run tests in watch mode

### Linting & Quality
- Tests use Jest/React Testing Library (via react-scripts)
- ESLint configuration is included via react-app preset

## Architecture

This is a React application for generating sports shot sequences that alternate between two spaces. The app generates random shot positions within a 5x5 grid system with advanced features like distance constraints and fog of war.

### Core Components
- **ShotSequenceGenerator** (`src/components/ShotSequenceGenerator/index.jsx`) - Main container component managing state for shot generation, distance constraints, and fog controls
- **ShotVisual** (`src/components/ShotSequenceGenerator/ShotVisual.jsx`) - SVG-based grid visualization with dynamic circle sizing for overlapping shots and fog overlay support
- **ShotList** - Text-based list of generated shots
- **UI Components** (`src/components/ui/`) - Reusable Button and Input components

### Shot Generation Logic
The core algorithm in `src/utils/shotGenerators.js` provides two generation modes:

1. **Basic Generation** (`generateShotSequence`): Alternates between spaces with random positioning
2. **Distance-Constrained Generation** (`generateShotSequenceWithDistance`): Enforces min/max distance between consecutive shots

#### Distance Calculation
- Treats both spaces as a continuous 5x10 field connected at the front
- Space 1: coordinates (0-4, 0-4) where y=4 is front
- Space 2: coordinates (0-4, 5-9) where y=5 is front (flipped layout)
- Uses Euclidean distance calculation across the continuous field

#### Shot Positioning
- 5 horizontal positions: Left, Center Left, Center, Center Right, Right
- 5 depth positions: Back, Mid Back, Mid, Mid Front, Front
- Dynamic circle sizing in visualization based on overlapping shot counts

### Key Features
- **Distance Constraints**: Optional min/max distance between consecutive shots with retry logic
- **Fog of War**: Individual space hiding for competitive play
- **Collision Handling**: Multiple shots at same position show comma-separated sequence numbers
- **Continuous Field Model**: Both spaces treated as connected playing area

### State Management
- React useState for local component state
- Shot sequences limited to 1-100 shots with validation
- Distance constraint validation with user feedback