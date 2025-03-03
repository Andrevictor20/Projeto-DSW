FROM node:20-alpine

WORKDIR /app

# Copy package files first to leverage Docker caching
COPY package.json package-lock.json ./

# Install dependencies including TypeScript globally
RUN npm ci && npm install -g typescript

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application using the global TypeScript installation
RUN tsc && mkdir -p dist/uploads && cp -r prisma dist/

# Expose the port
EXPOSE 5700

# Set host binding to 0.0.0.0 to make it accessible from outside the container
ENV HOST=0.0.0.0

# Run database migrations and start the application
CMD npx prisma migrate deploy && npm start