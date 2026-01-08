# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build arguments
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Build arguments for version info
ARG VERSION=development
ARG BUILD_DATE
ARG VCS_REF

# Labels for OCI compliance
LABEL org.opencontainers.image.title="PulseGen Frontend" \
      org.opencontainers.image.description="AI-powered survey platform - React Frontend" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Genesis Nexus" \
      org.opencontainers.image.source="https://github.com/genesis-nexus/pulsegen" \
      org.opencontainers.image.licenses="MIT"

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
