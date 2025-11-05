FROM node:20-alpine

# Install Claude Code CLI (optional - uncomment if using CLI mode)
# RUN npm install -g @anthropic-ai/claude-code

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies and source files
RUN npm prune --production && \
    rm -rf src tsconfig.json

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port (not required for socket mode, but useful for health checks)
EXPOSE 3000

CMD ["node", "dist/index.js"]
