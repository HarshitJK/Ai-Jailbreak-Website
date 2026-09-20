# ── Frontend Dockerfile — multi-stage build ───────────────────────────────────

# ── Stage 1: Build the Vite/React app ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (cached layer unless package.json changes)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .

# When running inside Docker, the Vite build must bake in /api as a relative
# path so nginx can proxy it. We set VITE_API_BASE_URL to empty string so
# apiClient.ts falls back to a relative URL (it uses window.location.origin).
# Alternatively, set it to "" so fetch calls go to the same origin and nginx
# picks them up via the /api/ location block.
ENV VITE_API_BASE_URL=""

RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
