# Bun-optimized Dockerfile for ChainCast
# Multi-stage build for smaller final image

# Base image with Bun runtime (using Debian for Prisma compatibility)
FROM oven/bun:1-debian AS base
WORKDIR /app

# Install stage - dependencies only
FROM base AS install

# Copy package files and prisma schema
COPY package.json bun.lockb* ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for prisma generate)
RUN bun install --frozen-lockfile || bun install

# Generate Prisma client
RUN bunx prisma generate

# Release stage - production image
FROM base AS release

# Copy node_modules from install stage
COPY --from=install /app/node_modules ./node_modules

# Copy prisma folder (includes generated client)
COPY --from=install /app/prisma ./prisma

# Copy application source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=55000

# Expose the application port
EXPOSE 55000

# Mount volume for logs
VOLUME /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:55000/api/graphql || exit 1

# Run the application with Bun
CMD ["bun", "src/main.ts"]
