# ----------- Build stage -----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Compile TypeScript
RUN npm run build

# ----------- Runtime stage -----------
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only what is needed
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

# Expose port if needed (not mandatory for Telegram bot)
# EXPOSE 3000

