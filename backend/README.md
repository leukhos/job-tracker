# Job Tracker Backend

This is the backend API for the Job Tracker application. It provides a REST API for managing job applications with persistent storage using SQLite.

## Features

- RESTful API for managing job applications
- SQLite database for simple but persistent storage
- CORS support for frontend integration
- Easy deployment on Synology NAS

## Installation

1. Install dependencies:

```bash
cd backend
npm install
```

2. Initialize the database (includes sample data):

```bash
npm run init-db
```

3. Start the server:

```bash
npm start
```

The server will start on port 3000 by default.

## API Endpoints

- `GET /api/jobs` - Get all job applications
- `GET /api/jobs/:id` - Get a job application by ID
- `POST /api/jobs` - Create a new job application
- `PUT /api/jobs/:id` - Update an existing job application
- `DELETE /api/jobs/:id` - Delete a job application

## Synology NAS Deployment

### Option 1: Docker Deployment (Recommended)

The easiest way to deploy on Synology NAS is using Docker:

1. Install Docker from Synology Package Center
2. Upload the backend directory to your NAS
3. Use the Docker GUI to create and run the container

For detailed instructions, see [DOCKER_GUIDE.md](DOCKER_GUIDE.md).

### Option 2: Traditional Deployment

If you prefer a traditional setup:

1. Upload the entire project folder to your Synology NAS
2. Install Node.js from Package Center on your Synology NAS
3. SSH into your NAS and navigate to the project folder
4. Install dependencies and initialize the database:

```bash
cd backend
npm install
npm run init-db
```

5. Set up the Node.js application in Synology DSM:
   - Go to Control Panel > Task Scheduler
   - Create a new scheduled task > User-defined script
   - Set it to run at boot-up
   - Set the user to a user with appropriate permissions
   - Add the following script (adjust paths as needed):

```bash
cd /volume1/your/path/to/job-tracker/backend && npm start
```

6. For better reliability, consider using PM2 for process management:

```bash
npm install -g pm2
pm2 start server.js --name "job-tracker-backend"
pm2 save
pm2 startup
```

7. Configure your frontend to connect to the NAS IP and port 3000

## Configuration

You can configure the application by setting these environment variables:

- `PORT` - The port to run the server on (default: 3000)
- `NODE_ENV` - Set to 'production' for production mode

## License

This project is licensed under the MIT License.
