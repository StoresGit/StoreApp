#!/bin/bash

echo "🔧 Fixing DigitalOcean Deployment..."

# Create necessary directories
sudo mkdir -p /var/www/html
sudo mkdir -p /root/gnr/backend

# Set proper permissions
sudo chown -R $USER:$USER /var/www/html
sudo chmod -R 755 /var/www/html

# Check if nginx is installed and configure it
if command -v nginx &> /dev/null; then
    echo "📦 Configuring Nginx..."
    
    # Create nginx configuration
    sudo tee /etc/nginx/sites-available/gnrcontrol << 'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/gnrcontrol /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl reload nginx
    
    echo "✅ Nginx configured successfully"
else
    # Check if apache is installed
    if command -v apache2 &> /dev/null; then
        echo "📦 Configuring Apache..."
        
        # Create apache configuration
        sudo tee /etc/apache2/sites-available/gnrcontrol.conf << 'EOF'
<VirtualHost *:80>
    DocumentRoot /var/www/html
    ServerName _
    
    <Directory /var/www/html>
        AllowOverride All
        Require all granted
    </Directory>

    ProxyPreserveHost On
    ProxyPass /api http://localhost:5050
    ProxyPassReverse /api http://localhost:5050
</VirtualHost>
EOF

        # Enable required modules
        sudo a2enmod proxy
        sudo a2enmod proxy_http
        sudo a2enmod rewrite
        
        # Enable the site
        sudo a2ensite gnrcontrol
        sudo a2dissite 000-default
        sudo systemctl reload apache2
        
        echo "✅ Apache configured successfully"
    else
        echo "❌ No web server (nginx/apache) found. Please install one first."
        exit 1
    fi
fi

# Create .htaccess for SPA routing
cat > /var/www/html/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-l
RewriteRule . /index.html [L]
EOF

# Set final permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

echo "✅ Deployment fixed! Your site should now be accessible."
echo "🌐 Check your site at: http://your-server-ip"
echo "🔧 Backend API at: http://your-server-ip/api" 