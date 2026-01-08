# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Compile seed script separately (it's outside src/)
RUN npx tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --skipLibCheck --resolveJsonModule --module commonjs --target ES2022

# Production stage
FROM node:20-alpine

# Build arguments for version info
ARG VERSION=development
ARG BUILD_DATE
ARG VCS_REF

# Labels for OCI compliance
LABEL org.opencontainers.image.title="PulseGen Backend" \
      org.opencontainers.image.description="AI-powered survey platform - Backend API" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Genesis Nexus" \
      org.opencontainers.image.source="https://github.com/genesis-nexus/pulsegen" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm install --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma/migrations ./prisma/migrations

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create directories for uploads and logs
RUN mkdir -p uploads logs

# Set version environment variable
ENV PULSEGEN_VERSION=${VERSION}

# Expose port
EXPOSE 5000

# Start server
ENTRYPOINT ["docker-entrypoint.sh"]
