# --- 1. BUILD STAGE ---
# We build in a separate stage to keep the production image smaller.
FROM node:18-alpine AS builder 
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the rest of the code
COPY . .

# Compile TypeScript code to JavaScript
RUN npm run build 

# --- 2. PRODUCTION STAGE ---
# Clean and small image containing only necessary files.
FROM node:18-alpine 
WORKDIR /app

# Install only production dependencies (for a smaller image)
COPY package*.json ./
RUN npm install --only=production

# Copy compiled JS files and .env file
COPY --from=builder /app/dist ./dist 
COPY .env ./

EXPOSE 3000

# Define application port (Best practice in Dockerfile)
ENV PORT 3000 
ENV NODE_ENV production

# Start the application
CMD ["npm", "start"]