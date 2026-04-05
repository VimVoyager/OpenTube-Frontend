# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Declare build args
ARG PUBLIC_API_URL
ARG PUBLIC_PROXY_URL

# Make API URL available during build
ENV PUBLIC_API_URL=$PUBLIC_API_URL
ENV PUBLIC_PROXY_URL=$PUBLIC_PROXY_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and environment files
COPY . .

# Build the application in production mode
# This will use .env.production
RUN npm run build

# Verify what was built
RUN echo "=== Build output ===" && \
    ls -la .svelte-kit/output && \
    ls -la .svelte-kit/output/server

# Remove dev dependencies
RUN npm prune --omit=dev

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy the entire .svelte-kit output directory (adapter-node uses this)
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3636

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3636', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "build"]
