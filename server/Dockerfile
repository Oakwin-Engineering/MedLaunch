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

# Install only ca-certificates and bash (optional)
RUN apk add --no-cache \
    ca-certificates \
    bash

# Set the working directory
WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/server .

# Set environment variables
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Run the server
CMD ["./server"]