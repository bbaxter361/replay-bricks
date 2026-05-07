# Compass API - Dockerfile for Fly.io
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server code
COPY server.js ./

# Create uploads directory
RUN mkdir -p uploads

# Expose the API port
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
