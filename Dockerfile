# Use the official Node.js image as the base image
FROM node:21

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code to the container
COPY . .

# Expose the port that your NestJS app runs on
EXPOSE 3000

# Start the NestJS application
CMD ["npm", "run", "start:dev"]
