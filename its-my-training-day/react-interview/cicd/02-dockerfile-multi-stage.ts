/**
 * Multi-stage Dockerfile for React Application
 * 
 * Optimized Docker build with multi-stage approach for minimal image size
 * and production-ready deployment.
 */

// Dockerfile
export const dockerfile = `
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Build arguments
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# Build application
RUN npm run build

# Stage 3: Runner
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Labels for metadata
LABEL org.opencontainers.image.created="\${BUILD_DATE}" \\
      org.opencontainers.image.version="\${VERSION}" \\
      org.opencontainers.image.revision="\${VCS_REF}" \\
      org.opencontainers.image.vendor="Semiconductor Manufacturing" \\
      org.opencontainers.image.title="Equipment Monitoring Dashboard"

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

// Nginx configuration
export const nginxConfig = `
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Cache static assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
`;

// Docker Compose for local development
export const dockerCompose = `
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        BUILD_DATE: \${BUILD_DATE:-$(date -u +'%Y-%m-%dT%H:%M:%SZ')}
        VCS_REF: \${VCS_REF:-$(git rev-parse --short HEAD)}
        VERSION: \${VERSION:-dev}
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
      - REACT_APP_API_URL=\${REACT_APP_API_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./dist:/usr/share/nginx/html
    ports:
      - "8080:80"
    depends_on:
      - app
`;

// Build script
export const buildScript = `
#!/bin/bash
# build.sh - Build and tag Docker image

set -e

IMAGE_NAME="equipment-monitoring-dashboard"
VERSION=${1:-latest}
REGISTRY="ghcr.io/goldenfamilyfarms"

echo "Building Docker image..."
docker build \\
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \\
  --build-arg VCS_REF=$(git rev-parse --short HEAD) \\
  --build-arg VERSION=${VERSION} \\
  -t ${IMAGE_NAME}:${VERSION} \\
  -t ${IMAGE_NAME}:latest \\
  -t ${REGISTRY}/${IMAGE_NAME}:${VERSION} \\
  -t ${REGISTRY}/${IMAGE_NAME}:latest \\
  .

echo "Build complete!"
echo "Image: ${IMAGE_NAME}:${VERSION}"
echo "To push: docker push ${REGISTRY}/${IMAGE_NAME}:${VERSION}"
`;

