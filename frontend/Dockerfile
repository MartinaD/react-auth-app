# Build arguments (can be overridden during build)
ARG NODE_IMAGE=node:18-alpine
ARG VITE_API_URL=http://localhost:3001

# Build stage - compile React/TypeScript application
# Pull a pre-built image from Docker Hub
# Name the build stage builder
FROM ${NODE_IMAGE} AS builder

RUN echo "Starting builder stage"

# Create a working directory `/app` - all commands run from here
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies
# Using --legacy-peer-deps to handle peer dependency conflicts
RUN echo "Installing dependencies..." && \
    npm install --legacy-peer-deps

# Copy TypeScript config files
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./

# Copy source files
COPY src/ ./src/
COPY index.html ./

# Build argument for API URL (used during Vite build)
# This gets baked into the compiled JavaScript
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

# Build the application
# Vite compiles TypeScript/React and creates optimized production build
RUN echo "Building application..." && \
    npm run build && \
    echo "Build complete"

# Production stage - only serve static files with Nginx
# Starts a new stage from Nginx base image
FROM nginx:alpine

RUN echo "Starting production stage"

# Copy built files from builder stage
# Only the compiled/distributed files, not source code
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
# Handles React Router and static file serving
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script that prints port information
COPY docker-entrypoint.sh /docker-entrypoint-custom.sh
RUN chmod +x /docker-entrypoint-custom.sh

# Expose port
# Nginx serves on port 80 by default
EXPOSE 80

# Use custom entrypoint that prints port info, then starts nginx
ENTRYPOINT ["/docker-entrypoint-custom.sh"]
CMD ["nginx", "-g", "daemon off;"]

