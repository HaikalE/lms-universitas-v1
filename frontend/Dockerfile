# Emergency working Dockerfile with dependency fixes
FROM node:16-alpine AS builder

WORKDIR /app

# Install essential build tools
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Fix for ajv dependency conflicts - use resolutions
RUN echo '{"resolutions":{"ajv":"^6.12.6","ajv-keywords":"^3.5.2"}}' > resolutions.json && \
    if [ -f package.json ]; then \
      node -e " \
        const pkg = require('./package.json'); \
        const res = require('./resolutions.json'); \
        pkg.resolutions = res.resolutions; \
        require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2)); \
      "; \
    fi

# Install dependencies with legacy peer deps to avoid conflicts
RUN npm install --legacy-peer-deps --force || \
    (rm -rf node_modules && npm cache clean --force && npm install --legacy-peer-deps --force)

# Copy source code
COPY . .

# Set environment for build
ARG REACT_APP_API_URL=http://localhost:3000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV SKIP_PREFLIGHT_CHECK=true

# Build with error handling and bypass service worker
RUN npm run build || \
    (echo "Build failed, trying without service worker..." && \
     sed -i 's/npm run build:sw/echo "Skipping service worker build"/g' package.json && \
     npm run build)

# Production stage
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Create a simple index.html fallback
RUN echo '<!DOCTYPE html><html><head><title>LMS Loading...</title></head><body><h1>LMS is starting...</h1><script>setTimeout(() => window.location.reload(), 3000);</script></body></html>' > /usr/share/nginx/html/loading.html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
