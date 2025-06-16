#!/bin/bash

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Create .env file for backend
cat > backend/.env << EOL
MONGODB_URI=mongodb+srv://Karyanastore:Karyanastore123@cluster0.izvxlqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
PORT=5050
NODE_ENV=production
JWT_SECRET=mySuperSecretKey123!
EOL

# Install dependencies
npm install

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Install backend dependencies
cd backend
npm install
cd ..

# Create necessary directories if they don't exist
mkdir -p vendor
mkdir -p public_html
mkdir -p public_html/api

# Copy frontend build to public_html
cp -r frontend/build/* public_html/

# Copy backend files
cp -r backend/* public_html/api/

# Create .htaccess for API routing
cat > public_html/.htaccess << EOL
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-l
RewriteRule . /index.html [L]

# API routing
RewriteRule ^api/(.*)$ /api/$1 [L]
EOL

# Set permissions
chmod -R 755 public_html
chmod -R 755 vendor
chmod -R 755 public_html/api

# Stop existing PM2 process if it exists
pm2 delete restaurant-api || true

# Start the backend server
cd public_html/api
pm2 start server.js --name "restaurant-api" --time

# Save PM2 process list
pm2 save

# Display PM2 status
pm2 status 