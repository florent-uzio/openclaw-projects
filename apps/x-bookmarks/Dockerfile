# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

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
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built assets
COPY --from=builder /app/dist ./dist

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3002

# Set environment
ENV NODE_ENV=production
ENV PORT=3002

# Start server
CMD ["node", "dist/server/main.js"]
