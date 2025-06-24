# Dependencies stage
FROM node:23.11.0 AS dependencies

# Reduce npm spam when installing within Docker
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Copy package files for installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY ./src ./src
COPY ./tests/.htpasswd ./tests/.htpasswd

########################################################

# Production stage
FROM node:23.11.0-alpine AS production

LABEL maintainer="Kage Gamis <kjgamis@gmail.com>"
LABEL description="Fragments node.js microservice"

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --production

# Copy built files from dependencies stage
COPY --from=dependencies /app/src ./src
COPY --from=dependencies /app/tests/.htpasswd ./tests/.htpasswd

# Start the container by running our server
CMD npm start

# We run our service on port 8080
EXPOSE 8080
