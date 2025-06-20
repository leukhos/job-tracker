#!/bin/bash
# Docker build and run script for Synology NAS

# Exit on error
set -e

echo "========================================"
echo "  Job Tracker Docker Deployment Script"
echo "  for Synology NAS"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker is not installed."
  echo "Please install Docker from the Synology Package Center first."
  exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
  echo "WARNING: Docker Compose not found, using docker commands directly."
  
  # Build the Docker image
  echo "Building Docker image..."
  docker build -t job-tracker-backend .
  
  # Create data volume if it doesn't exist
  if ! docker volume ls | grep -q job-tracker-data; then
    echo "Creating data volume..."
    docker volume create job-tracker-data
  fi
  
  # Stop and remove existing container if it exists
  if docker ps -a | grep -q job-tracker-backend; then
    echo "Stopping and removing existing container..."
    docker stop job-tracker-backend || true
    docker rm job-tracker-backend || true
  fi
  
  # Run the container
  echo "Starting container..."
  docker run -d \
    --name job-tracker-backend \
    -p 8070:8070 \
    -v job-tracker-data:/app/data \
    -e NODE_ENV=production \
    -e PORT=8070 \
    -e DB_DIR=data \
    -e DB_PATH=data/job_tracker.db \
    -e RATE_LIMIT_WINDOW_MS=60000 \
    -e RATE_LIMIT_MAX_REQUESTS=50 \
    -e DEBUG_DB=false \
    --restart unless-stopped \
    job-tracker-backend
else
  # Using Docker Compose
  echo "Using Docker Compose..."
  docker-compose up -d
fi

# Get the IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}')

echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo "API is running at: http://$IP_ADDRESS:8070"
echo "Status endpoint: http://$IP_ADDRESS:8070/api/status"
echo ""
echo "To access the API from your React app,"
echo "create a .env file in your React project with:"
echo "VITE_API_URL=http://$IP_ADDRESS:8070/api"
echo ""
echo "Don't forget to rebuild your React app after"
echo "updating the .env file."
echo "========================================"
