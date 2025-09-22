# Stage 1: Build the SvelteKit application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy environment file so build has PUBLIC_ vars
COPY .env.prod .env

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine

WORKDIR /app

# Default env values (runtime override with -e)
ENV PORT=8080

# Copy only what is needed for runtime
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

EXPOSE 8080

CMD ["node", "./build/index.js"]