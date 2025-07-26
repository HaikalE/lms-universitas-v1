# Multi-stage build untuk React App
FROM node:16-alpine AS builder

WORKDIR /app

# Install dependencies yang diperlukan
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies dengan optimasi
RUN npm ci --only=production --silent

# Copy semua source files
COPY . .

# Set environment variables untuk production build
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV CI=false
ENV SKIP_PREFLIGHT_CHECK=true
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build aplikasi React
RUN npm run build

# Production stage dengan nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app dari builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Ensure proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check untuk memastikan nginx berjalan
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
