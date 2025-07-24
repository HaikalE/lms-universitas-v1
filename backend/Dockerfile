FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN echo "=== Installing dependencies ===" && \
    npm install && \
    npm cache clean --force

# Copy source code
COPY . .

# Debug: Show what files we have
RUN echo "=== Source files ===" && \
    ls -la src/ && \
    echo "=== TypeScript config ===" && \
    cat tsconfig.json && \
    echo "=== NestJS CLI config ===" && \
    cat nest-cli.json

# Build application with debugging
RUN echo "=== Building application ===" && \
    npm run build && \
    echo "=== Build completed. Checking dist folder ===" && \
    ls -la dist/ && \
    echo "=== Checking for main.js ===" && \
    find dist/ -name "*.js" -type f && \
    echo "=== Main file location ===" && \
    ls -la dist/main.js || (echo "ERROR: main.js not found, showing all JS files:" && find . -name "*.js" -type f | head -20) && \
    echo "=== Verifying main.js exists ===" && \
    test -f dist/main.js && echo "✅ main.js found!" || (echo "❌ main.js missing!" && exit 1)

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN echo "=== Installing production dependencies ===" && \
    npm install --omit=dev && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database ./src/database
COPY --from=builder /app/scripts ./scripts

# Debug: Verify files are copied correctly  
RUN echo "=== Verifying copied files in production stage ===" && \
    ls -la dist/ && \
    echo "=== Checking main.js in production ===" && \
    ls -la dist/main.js && \
    echo "=== File permissions ===" && \
    ls -la dist/main.js && \
    echo "=== Database migration files ===" && \
    ls -la src/database/ && \
    echo "=== Scripts ===" && \
    ls -la scripts/

# Create uploads directory with proper permissions
RUN mkdir -p uploads && \
    chown -R nestjs:nodejs uploads && \
    chown -R nestjs:nodejs dist/ && \
    chown -R nestjs:nodejs src/ && \
    chown -R nestjs:nodejs scripts/

# Change to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Improved health check that actually tests the app
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application with better error handling and verification
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "echo 'Starting LMS Backend...' && echo 'Verifying main.js exists...' && ls -la dist/main.js && echo 'Starting Node.js application...' && node dist/main.js"]
