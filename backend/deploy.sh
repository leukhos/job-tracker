#!/bin/bash
# Deployment script for Synology NAS

# Exit on error
set -e

# Configuration
APP_NAME="job-tracker"
APP_PORT=3001
PM2_ENABLED=true

echo "========================================"
echo "  Job Tracker Deployment Script"
echo "  for Synology NAS"
echo "========================================"

# Check if running on Synology
if [ ! -f /etc/synoinfo.conf ]; then
  echo "WARNING: This doesn't appear to be a Synology device."
  echo "Script may not work as expected."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js is not installed."
  echo "Please install Node.js from the Synology Package Center first."
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "ERROR: npm is not installed."
  echo "Please install Node.js from the Synology Package Center first."
  exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_VERSION_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$NODE_VERSION_MAJOR" -lt "12" ]; then
  echo "ERROR: Node.js version 12 or higher is required."
  echo "Current version: $NODE_VERSION"
  exit 1
fi

echo "Node.js version: $NODE_VERSION (OK)"

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
echo "Backend dependencies installed."

# Initialize database
echo "Initializing database..."
npm run init-db
echo "Database initialized."

# Install PM2 if enabled
if [ "$PM2_ENABLED" = true ]; then
  echo "Setting up PM2 process manager..."
  
  # Check if PM2 is already installed
  if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    npm install -g pm2
  else
    echo "PM2 is already installed."
  fi
  
  # Start the application with PM2
  echo "Starting the application with PM2..."
  pm2 start server.js --name "$APP_NAME-api"
  pm2 save
  
  # Setup PM2 to start on boot
  echo "Setting up PM2 to start on system boot..."
  pm2 startup
  echo "You may need to run the command above manually if it requires sudo privileges."
else
  # Start the application directly
  echo "Starting the application..."
  nohup npm start > app.log 2>&1 &
  echo "Application started on port $APP_PORT."
fi

# Get the IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}')

echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo "API is running at: http://$IP_ADDRESS:$APP_PORT"
echo ""
echo "To access the API from your React app,"
echo "create a .env file in your React project with:"
echo "REACT_APP_API_URL=http://$IP_ADDRESS:$APP_PORT/api"
echo ""
echo "Don't forget to rebuild your React app after"
echo "updating the .env file."
echo "========================================"
