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
3. Search for `node` and download the official Node.js image (tag: lts-alpine)

### Step 3: Create Docker Container

1. In Docker app, go to **Image** tab
2. Click on **Build** and provide:
   - **Repository name**: job-tracker-backend
   - **Source**: Browse to your backend folder
   - Click **Build**
3. After the build completes, select the job-tracker-backend image and click **Launch**
4. In the wizard, configure the following:
   - **Container Name**: job-tracker-backend
   - **Advanced Settings**:
     - **Port Settings**: Map local port 8070 to container port 8070
     - **Volume**: Create a new volume or use an existing one, mount it to `/app/data` in container
     - **Environment**:
       - `NODE_ENV=production`
       - `PORT=8070`

4. Apply and launch the container

### Step 4: Test Your Deployment

Open a web browser and navigate to `http://your-nas-ip:8070/api/status`

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

Access `http://your-nas-ip:8070/api/status` in your browser

### Via Docker GUI

1. Open Docker app in DSM
2. Go to "Container" tab
3. Check the status of your job-tracker-backend container

### Via Command Line

If you have SSH access:
```bash
docker ps
# or 
docker logs job-tracker-backend
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
VITE_API_URL=http://your-nas-ip:8070/api
```

Then rebuild your React app and deploy to Web Station.

## Node.js Version Information

### Understanding Docker Image Tags

This deployment uses the `node:lts-alpine` image tag. Here's what this means:

- **lts**: Always points to the current Long Term Support version of Node.js
- **alpine**: Uses the lightweight Alpine Linux as the base OS

### Available Tag Options

You can modify the Dockerfile to use different Node.js versions:

1. **lts-alpine** (recommended): Always uses the latest LTS version, currently Node.js 20.x in 2025
2. **current-alpine**: Always uses the latest current release (may not be LTS)
3. **20-alpine**: Specifically uses Node.js 20.x
4. **18-alpine**: Specifically uses Node.js 18.x
5. **alpine**: Uses the latest release with Alpine Linux

### What Happens With Different Versions?

Using the `lts` tag has both benefits and considerations:

#### Benefits:
- **Automatic updates**: Your container will use the latest LTS when rebuilt
- **Security patches**: New LTS versions include security improvements
- **Future-proof**: You don't need to manually update version numbers

#### Considerations:
- **Potential compatibility issues**: If you rebuild with a newer LTS version, it might introduce breaking changes
- **Consistency**: Different builds might use different Node.js versions if a new LTS is released between builds
- **Testing**: Always test after rebuilding with a new LTS version

If you prefer absolute version stability, use a specific version tag like `20-alpine`.

### Checking Your Node.js Version

To verify which Node.js version is running in your container:

1. Go to `http://your-nas-ip:8070/api/status` - this will show the Node.js version
2. Or use Docker to run: `docker exec job-tracker-backend node -v`

## Port Configuration

### Why Port 8070?

This application uses port 8070 instead of more common ports like 3000 or 3001 for several reasons:

1. **Avoid conflicts**: Popular development frameworks like React, Next.js, and Express commonly use ports 3000-3001, which could cause conflicts
2. **NAS compatibility**: Some Synology NAS systems use common ports for their own services
3. **Security by obscurity**: Using a less common port adds a tiny layer of security through obscurity
4. **Memorable**: 8070 is easy to remember and unlikely to be used by other applications

### Changing the Port

If you need to use a different port:

1. In your Dockerfile or docker-compose.yml, change the port mapping
2. Set the `PORT` environment variable to match
3. Update your frontend .env file with the new port
4. Restart your container

For example, to use port 9090:
```
# In docker-compose.yml
ports:
  - "9090:9090"

# In environment variables
PORT=9090

# In .env file
VITE_API_URL=http://your-nas-ip:9090/api
```
