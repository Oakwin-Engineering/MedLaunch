# Use the official Go image as a builder
FROM --platform=linux/amd64 golang:1.25.1 AS builder

# Set the working directory
WORKDIR /app

# Copy go.mod and go.sum first to leverage Docker cache
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server

# Use a minimal base image for the final stage
FROM --platform=linux/amd64 alpine:latest

# Install ca-certificates + Chromium + dependencies for headless Chrome
RUN apk add --no-cache \
    ca-certificates \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    bash \
    fontconfig

# Set the working directory
WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/server .

# Set environment variables
ENV PORT=8080
ENV CHROME_PATH=/usr/bin/chromium-browser

# Expose the port
EXPOSE 8080

# Run the server
CMD ["./server"]