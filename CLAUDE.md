# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based job application tracking system with a Node.js/Express backend and SQLite database. The application features offline support, optimistic UI updates, and comprehensive error handling.

## Development Commands

### Frontend Development
- `npm start` - Start Vite dev server on port 3000
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build

### Backend Development
- `cd backend && npm run dev` - Start backend dev server with nodemon
- `cd backend && npm start` - Start production server on port 8070
- `cd backend && npm run init-db` - Initialize SQLite database

### Testing
- `cd backend && npm test` - Run Jest test suite
- `cd backend && npm run test:watch` - Run tests in watch mode
- `cd backend && npm run test:coverage` - Generate coverage reports

## Architecture

### Frontend Structure
- **Main Component**: `src/JobTracker.jsx` - Core application logic and UI
- **API Layer**: `src/api/api.js` - RESTful client with retry logic
- **State Management**: `src/api/useJobs.js` - Custom hook with offline support
- **Styling**: Tailwind CSS with responsive mobile design

### Backend Structure  
- **Server**: `backend/server.js` - Express app with middleware
- **Database**: `backend/database.js` - SQLite operations
- **API Routes**: RESTful endpoints for job CRUD operations
- **Data Storage**: `backend/data/` directory for SQLite files

### Key Features
- **Offline-First**: Optimistic updates with pending change queue
- **Error Handling**: React error boundary + comprehensive API error handling
- **Rate Limiting**: Configurable via environment variables
- **Database**: SQLite with automatic initialization and seeding

## Environment Configuration

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (defaults to localhost:8070)

### Backend (.env)
- `PORT` - Server port (default: 8070)
- `DATABASE_PATH` - SQLite database location
- `RATE_LIMIT_WINDOW_MS` - Rate limit window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

## Testing Architecture

Backend uses Jest with:
- **Unit Tests**: `/backend/tests/unit/` - Database, validation, error handling
- **Integration Tests**: `/backend/tests/integration/` - API endpoints, rate limiting
- **Mock Database**: Comprehensive mocking utilities for isolated testing

## Development Patterns

### State Management
The application uses a custom hook (`useJobs`) that handles:
- Optimistic UI updates for immediate feedback
- Offline change queuing and synchronization
- Network status monitoring
- Error state management

### API Communication
- Automatic retry logic for failed requests
- Environment-based URL configuration
- CORS handling for cross-origin requests
- Comprehensive error responses with user-friendly messages

### Database Operations
- SQLite with better-sqlite3 for performance
- Automatic database/directory creation
- Environment-configurable paths
- Transaction support for data integrity