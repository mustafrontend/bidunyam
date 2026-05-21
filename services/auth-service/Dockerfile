# ─── Build Stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
RUN npm run build

# ─── Runner Stage ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install system dependencies for Prisma (Required at runtime)
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

# Prisma client requires the schema to be present
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/index.js"]
