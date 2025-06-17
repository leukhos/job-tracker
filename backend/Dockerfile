FROM node:lts-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Create volume mount point for the database
VOLUME /app/data

# Expose port
EXPOSE 8070

# Command to run the app
CMD ["node", "server.js"]
