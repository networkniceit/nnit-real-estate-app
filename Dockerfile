# Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Install backend dependencies
COPY package.json package-lock.json ./
RUN npm ci --no-audit

# Install frontend dependencies and build the frontend app
COPY frontend/package.json frontend/
COPY frontend/package-lock.json frontend/
RUN cd frontend && npm ci --include=optional --no-audit
COPY frontend ./frontend
RUN cd frontend && npm run build

# Runtime stage
FROM node:20-slim AS runtime
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production --no-audit
COPY backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist
EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "backend/server.js"]
