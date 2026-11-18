# syntax=docker/dockerfile:1
# Multi-stage Dockerfile for React 19 + Vite Frontend

# Stage 1: Build production assets
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build static distribution
COPY . .
RUN npm run build

# Stage 2: Lightweight Nginx server to serve SPA and proxy /api
FROM nginx:1.25-alpine AS runner

# Copy built artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check probing static asset server
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --spider -q http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
