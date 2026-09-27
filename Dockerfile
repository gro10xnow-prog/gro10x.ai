# ==============================================================================
# Dockerfile: Production Multi-Stage Container for GRO10X Multi-Engine Platform
# Base: Node.js 20 LTS Alpine (Minimal, Security-Hardened)
# ==============================================================================

# ── Stage 1: Build & Dependencies ──
FROM node:20-alpine AS dependencies
WORKDIR /app

# Install build essentials if needed for native modules
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# ── Stage 2: Production Final Runtime ──
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for healthcheck probe
RUN apk add --no-cache curl

# Copy production node_modules and application sources
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./
COPY vercel.json ./
COPY src ./src
COPY public ./public
COPY data ./data
COPY supabase ./supabase
COPY scripts ./scripts

# Secure: run as non-root built-in node user
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Native Container Healthcheck pointing to liveness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/healthz || exit 1

CMD ["node", "server.js"]
