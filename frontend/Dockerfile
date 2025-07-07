FROM node:16-alpine AS builder

WORKDIR /app

# Install build dependencies and debugging tools
RUN apk add --no-cache python3 make g++ curl bash

# Copy package files
COPY package*.json ./

# Clear npm cache and configure
RUN npm cache clean --force && \
    npm config set registry https://registry.npmjs.org/

# Install dependencies with verbose logging
RUN echo "=== Installing dependencies ===" && \
    npm install --legacy-peer-deps --verbose && \
    echo "=== Installation completed ==="

# Debug: Check if react-scripts was installed
RUN echo "=== Checking react-scripts installation ===" && \
    ls -la node_modules/.bin/ | grep react || echo "No react binaries found" && \
    ls -la node_modules/react-scripts/ || echo "react-scripts directory missing" && \
    npm ls react-scripts || echo "react-scripts not in dependency tree"

# Force install react-scripts if not found
RUN if [ ! -f node_modules/.bin/react-scripts ]; then \
        echo "=== Force installing react-scripts ===" && \
        npm install react-scripts@5.0.1 --save --legacy-peer-deps; \
    fi

# Final verification and PATH setup
RUN echo "=== Final verification ===" && \
    ls -la node_modules/.bin/react-scripts && \
    chmod +x node_modules/.bin/react-scripts && \
    echo "react-scripts found and executable"

# Copy source code
COPY . .

# Build arguments
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Add node_modules/.bin to PATH
ENV PATH="/app/node_modules/.bin:$PATH"

# Try multiple build approaches
RUN echo "=== Starting build process ===" && \
    echo "Current PATH: $PATH" && \
    which react-scripts && \
    react-scripts --version && \
    (npm run build:simple || \
     echo "build:simple failed, trying direct react-scripts build..." && \
     react-scripts build || \
     echo "react-scripts build failed, trying node direct execution..." && \
     node node_modules/react-scripts/bin/react-scripts.js build || \
     echo "All build methods failed!") && \
    echo "=== Build process completed ==="

# Copy service worker if exists
RUN if [ -f public/sw.js ] && [ ! -f build/sw.js ]; then \
        echo "Copying service worker..." && \
        cp public/sw.js build/sw.js; \
    fi

# Verify build output
RUN echo "=== Build verification ===" && \
    ls -la build/ && \
    ls -la build/static/ || echo "No static directory found"

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