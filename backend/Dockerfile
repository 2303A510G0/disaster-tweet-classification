# syntax=docker/dockerfile:1
FROM node:20-alpine

# Install curl for Docker health check
RUN apk add --no-cache curl

ENV NODE_ENV=production \
    PORT=5000

WORKDIR /app

# Ensure standard storage directories exist for dataset and model artifacts
RUN mkdir -p /app/data/raw /app/artifacts/models

# Install backend production dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy shared NLP algorithms and backend application source
COPY backend/ ./backend/
COPY nlp/ ./nlp/

# Set file ownership to non-root user
RUN chown -R node:node /app

# Non-root security
USER node

# Expose backend REST API port
EXPOSE 5000

# Health check probing /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the Express server
CMD ["node", "backend/src/server.js"]
