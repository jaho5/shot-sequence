# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` - Start frontend development server (localhost:3000)
- `npm run start:backend` - Start backend API server (localhost:8000)
- `npm run dev` - Start both frontend and backend concurrently
- `npm run build` - Build production bundle
- `npm test` - Run test suite
- `npm test -- --watch` - Run tests in watch mode
- `npm run deploy` - Deploy to GitHub Pages

### Backend Setup
- `cd backend && python -m venv .venv` - Create virtual environment
- `source .venv/bin/activate` (Linux/Mac) or `.venv\Scripts\activate` (Windows) - Activate venv
- `pip install -r requirements.txt` - Install backend dependencies

### Linting & Quality
- Tests use Jest/React Testing Library (via react-scripts)
- ESLint configuration is included via react-app preset

## Architecture

This is a full-stack React application for generating sports shot sequences that alternate between two playing spaces. The frontend provides interactive shot generation and visualization, while the FastAPI backend handles sequence persistence.

### Frontend Architecture
- **ShotSequenceGenerator** (`src/components/ShotSequenceGenerator/index.jsx`) - Main container managing shot generation, distance constraints, fog controls, and sequence management
- **ShotVisual** (`src/components/ShotSequenceGenerator/ShotVisual.jsx`) - SVG-based grid visualization with dynamic circle sizing and fog overlay support
- **SaveSequenceDialog** / **SavedSequencesList** - Dialogs for sequence persistence operations
- **UI Components** (`src/components/ui/`) - Reusable Button and Input components

### Backend Architecture
- **FastAPI** backend (`backend/app/`) with SQLite database for sequence persistence
- **CORS** configured for localhost:3000 (dev) and GitHub Pages (prod)
- **REST API** endpoints: GET/POST/PUT/DELETE for sequence management
- **Database models** for shot sequences with metadata and settings

### Shot Generation Logic
The core algorithm in `src/utils/shotGenerators.js` provides two generation modes:

1. **Basic Generation** (`generateShotSequence`): Alternates between spaces with random positioning
2. **Distance-Constrained Generation** (`generateShotSequenceWithDistance`): Enforces min/max distance between consecutive shots with retry logic

#### Distance Calculation Model
- Treats both spaces as a continuous 5x10 field connected at the front
- Space 1: coordinates (0-4, 0-4) where y=4 is front
- Space 2: coordinates (0-4, 5-9) where y=5 is front (flipped layout for connection)
- Uses Euclidean distance calculation across the continuous field
- Distance constraints applied between consecutive shots only

#### Shot Positioning System
- 5 horizontal positions: Left, Center Left, Center, Center Right, Right
- 5 depth positions: Back, Mid Back, Mid, Mid Front, Front
- Shots alternate between Space 1 and Space 2
- Multiple shots at same position show comma-separated sequence numbers in visualization

### Key Features
- **Sequence Persistence**: Save/load sequences with names and settings via backend API
- **Distance Constraints**: Optional min/max distance between consecutive shots
- **Fog of War**: Individual space hiding for competitive play scenarios
- **Interactive Grid**: Click to add shots, right-click to insert at specific positions
- **Collision Handling**: Visual representation of overlapping shots with dynamic circle sizing

### State Management
- React useState for local component state
- Shot sequences limited to 1-100 shots with validation
- Distance constraint validation with user feedback
- Current sequence tracking for save/update operations

### API Integration
- Frontend communicates with backend via `src/utils/api.js`
- API base URL configurable via REACT_APP_API_URL environment variable
- Error handling with custom ApiError class
- Automatic CORS handling for development and production environments