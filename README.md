# Job Tracker

> **⚠️ Disclaimer**: This project has been entirely developed using GitHub Copilot (Claude AI) as a coding assistant. The code and documentation have not been reviewed by a developer with experience in Node.js or React. This is a personal use project and there is significant room for improvement in terms of code quality, security practices, and overall architecture. Use at your own discretion and consider having the code reviewed by experienced developers before using in any production environment.

A React application for tracking and managing job applications during your job search process. Now with data persistence through a Node.js/Express backend and SQLite database!

## Features

- Track job applications with detailed information
- Manage applications by status (Applied, Screening, Interview, etc.)
- Record job details including salary range, location, and remote work options
- Add personal notes for each application
- Filter and search through your job applications
- Persistent storage with SQLite database
- Offline support with automatic synchronization
- Mobile-friendly responsive design

## Tech Stack

- React.js
- Tailwind CSS
- Lucide React (for icons)
- Node.js/Express (backend)
- SQLite (database)

## Project Structure

```
job-tracker/
├── backend/             # Backend API server
│   ├── server.js        # Express server
│   ├── database.js      # SQLite database integration
│   ├── initDb.js        # Database initialization script
│   └── package.json     # Backend dependencies
│
└── src/                 # Frontend React application
    ├── api/             # API integration
    │   ├── api.js       # API client
    │   └── useJobs.js   # React hook for job data
    ├── JobTracker.js    # Main application component
    └── index.js         # Application entry point
```

## Getting Started

### Frontend Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with:
   ```
   VITE_API_URL=http://localhost:8070/api
   ```
4. Start the development server:
   ```
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Install the dependencies:
   ```
   npm install
   ```
3. Initialize the database:
   ```
   npm run init-db
   ```
4. Start the backend server:
   ```
   npm start
   ```
   The backend server will run on http://localhost:8070 by default.

## Deployment on Synology NAS

### Backend Deployment

#### Option 1: Docker Deployment (Recommended)

The easiest way to deploy on Synology NAS is using Docker:

1. Install Docker from Synology Package Center
2. Upload the backend directory to your NAS
3. Use the Docker GUI to create and run the container

For detailed instructions, see [backend/DOCKER_GUIDE.md](backend/DOCKER_GUIDE.md).

#### Option 2: Traditional Deployment

If you prefer a traditional setup:

1. Upload the project files to your Synology NAS
2. Install Node.js from the Synology Package Center
3. SSH into your NAS and navigate to the project directory
4. Run the deployment script:

```bash
cd backend
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Install backend dependencies
- Initialize the database
- Set up PM2 for process management (optional)
- Start the backend server

### Frontend Deployment

1. Update the `.env` file with your NAS IP address:

```
VITE_API_URL=http://your-nas-ip:8070/api
```

2. Build the production version of the frontend:

```bash
npm run build
```

3. Upload the contents of the `build` directory to your web server or Synology Web Station

## Available Scripts

### Frontend

- `npm start` - Starts the frontend development server
- `npm build` - Builds the frontend app for production
- `npm test` - Runs frontend tests

### Backend

- `npm start` - Starts the backend server
- `npm run dev` - Starts the backend server with nodemon for development
- `npm run init-db` - Initializes the SQLite database with schema and sample data

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## About

Job Tracker helps you stay organized during your job search by providing a centralized location to track all your job applications, interviews, and follow-ups. With the addition of a backend API and database, your data is now securely stored and accessible from anywhere, while still supporting offline usage.

## API Endpoints

- `GET /api/jobs` - Get all job applications
- `GET /api/jobs/:id` - Get a job application by ID
- `POST /api/jobs` - Create a new job application
- `PUT /api/jobs/:id` - Update an existing job application
- `DELETE /api/jobs/:id` - Delete a job application

## Continuous Integration

This project uses GitHub Actions for automated testing and CI/CD. The workflows automatically run when pull requests are created against the `main` branch.

### GitHub Actions Workflows

#### Backend Tests (`backend-tests.yml`)
- Runs backend tests on Node.js LTS
- Initializes test database
- Generates code coverage reports
- Only triggers when backend files are modified

#### Full CI/CD Pipeline (`ci-cd.yml`)
- Comprehensive testing for both frontend and backend
- Integration tests included

### Running Tests Locally

Before pushing changes, run tests locally:

```bash
# Backend tests
cd backend
npm install
npm run init-db
npm test
npm run test:coverage

# Frontend tests (if applicable)
npm install
npm test
npm run build
```

### Monitoring CI/CD

View workflow runs in the **Actions** tab of the GitHub repository to monitor:
- Test results
- Code coverage reports
- Build status and any failures
