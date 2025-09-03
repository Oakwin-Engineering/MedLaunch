# Stage 1: Build the SvelteKit application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install 

COPY . .
RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine

WORKDIR /app

ENV VITE_API_URL="https://medlaunch-112161079039.us-central1.run.app"
ENV PORT=8080

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/build ./build

# Expose the port
EXPOSE 8080

CMD ["node", "./build/index.js"]