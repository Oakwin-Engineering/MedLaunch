# Stage 1: Build the SvelteKit application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the source code and build
COPY . .
RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine

WORKDIR /app

# Default env values (can be overridden at runtime with -e)
ENV PUBLIC_API_URL="https://medlaunch-server-973560072485.us-central1.run.app"
ENV PORT=8080

# Copy only what is needed for runtime
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

EXPOSE 8080

CMD ["node", "./build/index.js"]