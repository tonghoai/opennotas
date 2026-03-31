# Stage 1: Base
FROM node:20-alpine AS base
WORKDIR /app

# Stage 2: Install dependencies and build
FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production
FROM base AS production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.output /app/.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
