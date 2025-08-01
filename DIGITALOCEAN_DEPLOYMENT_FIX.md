# DigitalOcean Deployment Fix Guide

## 🚨 Issue: "Site doesn't exist" Error

### **Root Cause:**
The deployment was configured to deploy frontend files to `/var/www/gnrcontrol` but the web server wasn't properly configured to serve files from this location.

### **✅ Fixed Issues:**

#### **1. Directory Structure**
- ✅ **Before**: Files deployed to `/var/www/gnrcontrol` (non-standard)
- ✅ **After**: Files deployed to `/var/www/html` (standard web root)

#### **2. Web Server Configuration**
- ✅ **Nginx**: Added proper configuration for SPA routing
- ✅ **Apache**: Added proper configuration with proxy settings
- ✅ **Auto-Detection**: Script detects which web server is installed

#### **3. Backend API Routing**
- ✅ **Proxy Setup**: `/api` requests are forwarded to backend server
- ✅ **CORS Handling**: Proper headers for API communication

### **🔧 Manual Fix Steps:**

#### **Option 1: Run the Fix Script**
```bash
# SSH into your DigitalOcean server
ssh root@your-server-ip

# Download and run the fix script
wget https://raw.githubusercontent.com/your-repo/main/fix-deployment.sh
chmod +x fix-deployment.sh
./fix-deployment.sh
```

#### **Option 2: Manual Configuration**

**Step 1: Create Directories**
```bash
sudo mkdir -p /var/www/html
sudo chown -R $USER:$USER /var/www/html
sudo chmod -R 755 /var/www/html
```

**Step 2: Configure Nginx (if using nginx)**
```bash
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

sudo ln -sf /etc/nginx/sites-available/gnrcontrol /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

**Step 3: Configure Apache (if using apache)**
```bash
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

sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2ensite gnrcontrol
sudo a2dissite 000-default
sudo systemctl reload apache2
```

**Step 4: Create .htaccess for SPA Routing**
```bash
cat > /var/www/html/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-l
RewriteRule . /index.html [L]
EOF
```

### **🔍 Troubleshooting Commands:**

#### **Check Web Server Status:**
```bash
# Check nginx status
sudo systemctl status nginx

# Check apache status
sudo systemctl status apache2

# Check if web server is listening on port 80
sudo netstat -tlnp | grep :80
```

#### **Check File Permissions:**
```bash
# Check if files exist
ls -la /var/www/html/

# Check permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

#### **Check Backend Server:**
```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs api

# Check if backend is listening on port 5050
sudo netstat -tlnp | grep :5050
```

#### **Test API Endpoints:**
```bash
# Test backend API
curl http://localhost:5050/api/users

# Test frontend
curl http://localhost
```

### **🌐 Expected URLs:**

- ✅ **Frontend**: `http://your-server-ip/`
- ✅ **Backend API**: `http://your-server-ip/api/`
- ✅ **Login**: `http://your-server-ip/` (React Router will handle routing)

### **📋 Pre-Deployment Checklist:**

1. ✅ **Web Server Installed**: nginx or apache2
2. ✅ **Node.js Installed**: version 16 or higher
3. ✅ **PM2 Installed**: `npm install -g pm2`
4. ✅ **Firewall Open**: port 80 and 22
5. ✅ **Domain Configured**: (if using custom domain)

### **🚀 After Fix:**

Your site should be accessible at:
- **Frontend**: `http://your-server-ip/`
- **Backend**: `http://your-server-ip/api/`

The "site doesn't exist" error should be resolved! 