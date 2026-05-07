# Compass API - Dockerfile for Fly.io
# Build from repo root: docker build -t compass-api -f Dockerfile .
FROM node:22-alpine

WORKDIR /app

# Copy package files from compass-api subdirectory
COPY compass-api/package*.json ./

# Install ALL dependencies
RUN npm install

# Copy server code
COPY compass-api/server.js ./

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose the API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the server - must listen on 0.0.0.0 for Fly.io
CMD ["node", "server.js"]
