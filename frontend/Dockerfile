FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ && \
    ln -sf python3 /usr/bin/python

# Copy package files
COPY package*.json ./

# Clear npm cache and install dependencies with verbose logging
RUN npm cache clean --force && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --no-optional --legacy-peer-deps --verbose

# Verify react-scripts installation
RUN npm ls react-scripts || echo "Warning: react-scripts check failed"

# Copy source code
COPY . .

# Build arguments
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Add node_modules/.bin to PATH explicitly
ENV PATH="/app/node_modules/.bin:$PATH"

# Debug: Check if react-scripts is available
RUN echo "Checking react-scripts availability..." && \
    which react-scripts || echo "react-scripts not found in PATH" && \
    ls -la node_modules/.bin/react-scripts || echo "react-scripts binary not found" && \
    ls -la node_modules/react-scripts/bin/react-scripts.js || echo "react-scripts js file not found"

# Build application with fallback strategy
RUN echo "Starting build process..." && \
    (npm run build:docker || \
     echo "build:docker failed, trying build:simple..." && npm run build:simple || \
     echo "build:simple failed, trying direct react-scripts..." && npx react-scripts build || \
     echo "All build methods failed!") && \
    echo "Build completed, checking build directory..." && \
    ls -la build/ && \
    echo "Build process finished"

# Copy service worker manually if build:sw failed
RUN if [ ! -f build/sw.js ] && [ -f public/sw.js ]; then \
        echo "Copying service worker manually..." && \
        cp public/sw.js build/sw.js; \
    fi

# Production stage
FROM nginx:alpine AS production

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001

# Change ownership of nginx directories
RUN chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]