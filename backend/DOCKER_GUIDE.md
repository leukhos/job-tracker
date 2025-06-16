# Docker Deployment Guide for Synology NAS

This guide explains how to deploy the Job Tracker backend on Synology NAS using Docker.

## Prerequisites

1. Docker package installed on your Synology NAS
2. SSH access to your Synology NAS (optional, for advanced setup)

## Option 1: Using Synology Docker GUI (Recommended)

### Step 1: Upload Files to NAS

Upload the entire backend directory to your Synology NAS. You can use File Station or any file transfer method.

### Step 2: Set Up Docker Image

1. Open **Docker** app from Synology DSM
2. Go to **Registry** tab
3. Search for `node` and download the official Node.js image (tag: 20-alpine)

### Step 3: Create Docker Container

1. In Docker app, go to **Image** tab
2. Select the Node.js image and click **Launch**
3. In the wizard, configure the following:
   - **Container Name**: job-tracker-api
   - **Advanced Settings**:
     - **Port Settings**: Map local port 3001 to container port 3001
     - **Volume**: Create a new volume or use an existing one, mount it to `/app/data` in container
     - **Environment**:
       - `NODE_ENV=production`
       - `PORT=3001`

4. Apply and launch the container

### Step 4: Test Your Deployment

Open a web browser and navigate to `http://your-nas-ip:3001/api/status`

You should see a JSON response with status information if the server is running correctly.

## Option 2: Using Docker Compose (More Advanced)

If you're familiar with command line and Docker Compose:

1. SSH into your Synology NAS
2. Navigate to your backend directory
3. Run:
   ```bash
   docker-compose up -d
   ```

This will build and start the container based on the `docker-compose.yml` file.

## Checking Status

### Via API

Access `http://your-nas-ip:3001/api/status` in your browser

### Via Docker GUI

1. Open Docker app in DSM
2. Go to "Container" tab
3. Check the status of your job-tracker-api container

### Via Command Line

If you have SSH access:
```bash
docker ps
# or 
docker logs job-tracker-api
```

## Managing Your Container

### Restarting

If you need to restart your container:
1. In Docker app, go to "Container" tab
2. Select your container
3. Click "Action" → "Restart"

### Updating

To update after code changes:
1. In Docker app, go to "Container" tab
2. Stop and remove your container
3. Go to "Image" tab
4. Rebuild your container (or follow the steps in "Option 1" again)

## Connecting Your Frontend

Update your React app's `.env.production` file with:
```
REACT_APP_API_URL=http://your-nas-ip:3001/api
```

Then rebuild your React app and deploy to Web Station.
