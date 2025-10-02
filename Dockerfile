# Multi-stage Dockerfile for Node.js applications
# Optimized for production deployments

# Stage 1: Base image with dependencies
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Stage 3: Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application (customize for your project)
# For Next.js: RUN npm run build
# For other projects: RUN npm run build or similar
RUN echo "Build step - customize for your project type"

# Stage 4: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy built application from builder stage
# Customize these paths for your project structure
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/scripts ./scripts

# For Next.js apps:
# COPY --from=builder --chown=appuser:nodejs /app/.next/standalone ./
# COPY --from=builder --chown=appuser:nodejs /app/.next/static ./.next/static
# COPY --from=builder --chown=appuser:nodejs /app/public ./public

# Switch to non-root user
USER appuser

# Expose the port your app runs on
EXPOSE 3000

# Set the PORT environment variable
ENV PORT=3000

# Start the application
# Customize this command for your project
CMD ["node", "scripts/speckit/orchestrator.js", "status"]

