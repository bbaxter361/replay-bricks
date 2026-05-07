# Compass API - Dockerfile for Fly.io
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY compass-api/package*.json ./

# Install dependencies
RUN npm install

# Copy server code
COPY compass-api/server.js ./

# Create uploads directory
RUN mkdir -p uploads

# Expose the API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --spider http://localhost:3001/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
