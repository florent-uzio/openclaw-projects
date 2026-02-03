# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source
COPY . .

# Build frontend
RUN npm run build:client

# Build backend
RUN npm run build:server

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy built assets
COPY --from=builder /app/dist ./dist

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3002

# Build args for versioning
ARG APP_VERSION=0.1.0
ARG BUILD_TIME

# Set environment
ENV NODE_ENV=production
ENV PORT=3002
ENV APP_VERSION=${APP_VERSION}
ENV BUILD_TIME=${BUILD_TIME}

# Start server
CMD ["node", "dist/server/main.js"]
