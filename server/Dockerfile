# Use official lightweight Node.js image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Compile TypeScript code (creates dist folder)
RUN npm run build

# Manually copy public folder (with GeoJSON) into the build
RUN cp -r src/public dist/src/

# Copy seed photos from seed-data and place them in uploads/reports
# This allows us to not have uploads/ in the local project but only in the container
# The folder structure is preserved: seed-data/photos/1/ -> uploads/reports/1/
RUN mkdir -p uploads/reports
COPY seed-data/photos/ uploads/reports/

# Ensure the uploads directory has correct permissions for new uploads
RUN chmod -R 755 uploads

# Expose the port the server runs on (as per .env)
EXPOSE 3001

# Command to start the compiled application
CMD ["npm", "start"]