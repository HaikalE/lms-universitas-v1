# Stage 1: Build the React application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build-time dependencies for native modules.
RUN apk add --no-cache python3 make g++

# Copy package.json
COPY package.json ./

# Install dependencies
# This will use yarn.lock if it exists, otherwise it will create one.
RUN if [ -f "yarn.lock" ]; then yarn install --frozen-lockfile; else yarn install; fi

# Copy the rest of the application source code.
COPY . .

# Set build-time environment variables
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false

# Run the most robust build script directly.
RUN npm run build:force

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built application from the 'builder' stage
COPY --from=builder /app/build /usr/share/nginx/html

# Set correct permissions for the Nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && chmod -R 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
