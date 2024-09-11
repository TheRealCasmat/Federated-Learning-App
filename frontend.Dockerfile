FROM node:latest AS build

# Set the working directory
WORKDIR /frontend

# Install Vite globally
RUN npm install -g create-vite

# Create a new Vite project
RUN npx create-vite@latest . --template react

# Install project dependencies
RUN npm install

# Install additional dependencies
RUN npm install axios tailwindcss postcss autoprefixer daisyui @tensorflow/tfjs dexie  react-filepond filepond filepond-plugin-image-preview filepond-plugin-image-exif-orientation filepond-plugin-image-preview filepond-plugin-file-validate-type --save

# Initialize Tailwind CSS
RUN npx tailwindcss init -p

# Copy Tailwind CSS configuration
RUN echo '@tailwind base;\n@tailwind components;\n@tailwind utilities;' > ./src/index.css

# Update tailwind.config.js to include DaisyUI
RUN echo "module.exports = { content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'], theme: { extend: {}, }, plugins: [require('daisyui')], };" > tailwind.config.js

# Expose port 5173 for development server
EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]