#!/bin/bash

echo "🚀 Starting fresh deployment..."

# Clean up any existing builds
echo "🧹 Cleaning up existing builds..."
rm -rf frontend/build
rm -rf public_html

# Install dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
npm run build
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Create necessary directories
echo "📁 Creating deployment directories..."
mkdir -p vendor
mkdir -p public_html
mkdir -p public_html/api

# Copy frontend build to public_html
echo "📋 Copying frontend build..."
cp -r frontend/build/* public_html/

# Copy backend files
echo "📋 Copying backend files..."
cp -r backend/* public_html/api/

# Create .htaccess for API routing
echo "🔧 Creating .htaccess configuration..."
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
echo "🔐 Setting permissions..."
chmod -R 755 public_html
chmod -R 755 vendor
chmod -R 755 public_html/api

# Stop existing PM2 process if it exists
echo "🛑 Stopping existing PM2 processes..."
pm2 delete api || true
pm2 delete my-backend || true
pm2 delete restaurant-api || true

# Start the backend server
echo "🚀 Starting backend server..."
cd public_html/api
pm2 start server.js --name "api" --time

# Run the admin user update script
echo "👤 Updating admin user..."
node update-admin-production.js

# Save PM2 process list
echo "💾 Saving PM2 configuration..."
pm2 save

# Display PM2 status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Deployment completed successfully!"
echo "🌐 Your application should now be running with the latest code." 