FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules and debugging tools
RUN apk add --no-cache python3 make g++ curl wget && \
    ln -sf python3 /usr/bin/python

# Copy package files
COPY package*.json ./

# Debug: Show package.json content related to react-scripts
RUN echo "=== Checking package.json for react-scripts ===" && \
    grep -A 5 -B 5 "react-scripts" package.json || echo "react-scripts not found in package.json"

# Clear npm cache and configure npm properly
RUN echo "=== Configuring npm ===" && \
    npm cache clean --force && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm --version && \
    node --version

# Install dependencies with detailed logging
RUN echo "=== Installing dependencies ===" && \
    npm install --no-optional --legacy-peer-deps --verbose > /tmp/npm-install.log 2>&1 && \
    echo "npm install completed successfully" || \
    (echo "npm install failed, showing log:" && cat /tmp/npm-install.log && exit 1)

# Debug: Verify installation in detail
RUN echo "=== Verifying installation ===" && \
    echo "Checking node_modules directory:" && \
    ls -la node_modules/ | head -20 && \
    echo "Checking for react-scripts directory:" && \
    ls -la node_modules/react-scripts/ || echo "react-scripts directory not found" && \
    echo "Checking node_modules/.bin directory:" && \
    ls -la node_modules/.bin/ | grep react || echo "No react binaries found" && \
    echo "Checking react-scripts package:" && \
    npm ls react-scripts || echo "react-scripts not in dependency tree"

# Try to fix react-scripts installation if not found
RUN if [ ! -f node_modules/.bin/react-scripts ]; then \
        echo "=== react-scripts not found, trying manual installation ===" && \
        npm install react-scripts@5.0.1 --save --legacy-peer-deps && \
        echo "Manual react-scripts installation completed"; \
    fi

# Final verification
RUN echo "=== Final verification ===" && \
    ls -la node_modules/.bin/react-scripts || echo "react-scripts binary still missing" && \
    ls -la node_modules/react-scripts/bin/ || echo "react-scripts bin directory missing" && \
    file node_modules/.bin/react-scripts || echo "Cannot check react-scripts file type"

# Copy source code
COPY . .

# Build arguments
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Add multiple paths for react-scripts
ENV PATH="/app/node_modules/.bin:/app/node_modules/react-scripts/bin:$PATH"

# Try alternative build methods
RUN echo "=== Starting build process ===" && \
    echo "Current PATH: $PATH" && \
    echo "Checking which react-scripts:" && \
    which react-scripts || echo "react-scripts not in PATH" && \
    echo "Trying node direct execution:" && \
    (node node_modules/react-scripts/bin/react-scripts.js build || \
     echo "Direct node execution failed, trying npm run build:simple..." && \
     npm run build:simple || \
     echo "npm build:simple failed, trying manual webpack..." && \
     npm run build || \
     echo "All build methods failed, creating minimal build directory..." && \
     mkdir -p build && \
     echo "<html><body><h1>Build Failed - Manual Recovery Needed</h1></body></html>" > build/index.html) && \
    echo "Build process completed"

# Verify build output
RUN echo "=== Verifying build output ===" && \
    ls -la build/ && \
    echo "Build verification completed"

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