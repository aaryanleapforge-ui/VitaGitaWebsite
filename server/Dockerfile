# Dockerfile - Node 22, production
FROM node:22-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files first (leverages layer cache)
COPY package*.json ./

# Install dependencies (production)
RUN npm ci --only=production

# Copy app source
COPY . .

# Create a non-root user
RUN groupadd -r app && useradd -r -g app app || true
RUN chown -R app:app /usr/src/app
USER app

# Expose port (Render/Railway will map)
EXPOSE 5000

# Health check (Render will use the port)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD curl -f http://localhost:5000/api/analytics || exit 1

# Start
CMD ["node", "index.js"]
