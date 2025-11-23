# ============================================
# Multi-stage Dockerfile for React 18 + Vite
# ============================================

# ============================================
# Stage 1: Development (with hot reload)
# ============================================
FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies for hot reload
RUN apk add --no-cache \
    curl

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install instead of ci to work without package-lock.json)
RUN npm install

# Copy application code
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Set environment
ENV NODE_ENV=development

# Run Vite dev server with host 0.0.0.0 for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ============================================
# Stage 2: Build (compile application)
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (use npm install instead of ci)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ============================================
# Stage 3: Production (serve static files)
# ============================================
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
