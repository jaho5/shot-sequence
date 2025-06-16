# Shot Sequence Generator

An interactive React application for generating sports shot sequences that alternate between two playing spaces. Designed for sports training with advanced features like distance constraints and fog of war.

## Features

- **Shot Generation**: Generate 1-100 shot sequences alternating between two 5x5 grid spaces
- **Distance Constraints**: Optional minimum and maximum distance enforcement between consecutive shots
- **Fog of War**: Hide individual spaces for competitive play scenarios
- **Visual Grid**: SVG-based visualization with dynamic circle sizing for overlapping shots
- **Sequence Management**: Save and load shot sequences with backend persistence
- **Continuous Field Model**: Both spaces treated as connected playing area for distance calculations

## Architecture

### Core Components

- **ShotSequenceGenerator** - Main container managing shot generation, distance constraints, and fog controls
- **ShotVisual** - SVG grid visualization with fog overlay support
- **ShotList** - Text-based list of generated shots
- **SaveSequenceDialog** - Dialog for saving sequences with names
- **SavedSequencesList** - List view of saved sequences with load/delete functionality

### Shot Generation Logic

The application provides two generation modes:

1. **Basic Generation**: Random positioning alternating between spaces
2. **Distance-Constrained Generation**: Enforces min/max distance between consecutive shots

#### Distance Calculation

- Treats both spaces as a continuous 5x10 field connected at the front
- Space 1: coordinates (0-4, 0-4) where y=4 is front
- Space 2: coordinates (0-4, 5-9) where y=5 is front (flipped layout)
- Uses Euclidean distance calculation across the continuous field

#### Shot Positioning

- **Horizontal**: Left, Center Left, Center, Center Right, Right
- **Depth**: Back, Mid Back, Mid, Mid Front, Front
- **Collision Handling**: Multiple shots at same position show comma-separated sequence numbers

## Tech Stack

- **Frontend**: React 18, Tailwind CSS
- **Backend**: FastAPI, SQLite
- **Build**: Create React App
- **Testing**: Jest, React Testing Library

## Development

### Prerequisites

- Node.js 16+
- Python 3.8+ (for backend)

### Setup

1. **Install frontend dependencies**:
   ```bash
   npm install
   ```

2. **Setup backend**:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

### Running the Application

**Development mode (both frontend and backend)**:
```bash
npm run dev
```

**Frontend only**:
```bash
npm start
```

**Backend only**:
```bash
npm run start:backend
```

### Available Scripts

- `npm start` - Start development server (localhost:3000)
- `npm run build` - Build production bundle
- `npm test` - Run test suite
- `npm test -- --watch` - Run tests in watch mode
- `npm run deploy` - Deploy to GitHub Pages

### Testing

Tests use Jest and React Testing Library via react-scripts. ESLint configuration is included via react-app preset.

## Deployment

### Frontend (GitHub Pages)

The frontend is configured for GitHub Pages deployment:

```bash
npm run deploy
```

### Backend Deployment

The backend needs to be deployed separately to a cloud service that supports Python:

1. **Deploy to a cloud service** (Railway, Render, Heroku, etc.)
2. **Set environment variable** for production builds:
   ```bash
   REACT_APP_API_URL=https://your-backend-url.com npm run build
   ```
3. **Update CORS configuration** in `backend/app/main.py` to include your GitHub Pages URL
4. **Configure database** for production (consider PostgreSQL for persistent storage)

### Environment Configuration

Create a `.env.local` file for local development:
```bash
REACT_APP_API_URL=http://localhost:8000
```

For production deployment, set the `REACT_APP_API_URL` environment variable to your deployed backend URL.

## API Endpoints

- `GET /sequences` - Get all saved sequences
- `POST /sequences` - Save a new sequence
- `DELETE /sequences/{id}` - Delete a sequence

## License

This project is private and not licensed for public use.