# Domain Setup Guide for gnrcontrol.com

## 🌐 Setting Up Your Domain

### **Prerequisites:**
1. ✅ **Domain Purchased**: gnrcontrol.com should be purchased from a domain registrar
2. ✅ **DigitalOcean Droplet**: Your server should be running
3. ✅ **DNS Access**: Access to your domain's DNS settings

### **Step 1: Configure DNS Records**

#### **A Record (Main Domain)**
```
Type: A
Name: @ (or leave blank)
Value: YOUR_DIGITALOCEAN_SERVER_IP
TTL: 3600 (or default)
```

#### **A Record (WWW Subdomain)**
```
Type: A
Name: www
Value: YOUR_DIGITALOCEAN_SERVER_IP
TTL: 3600 (or default)
```

#### **CNAME Record (Optional - Redirect www to root)**
```
Type: CNAME
Name: www
Value: gnrcontrol.com
TTL: 3600 (or default)
```

### **Step 2: Verify DNS Propagation**

After setting up DNS records, wait 24-48 hours for full propagation. You can check using:

```bash
# Check DNS propagation
nslookup gnrcontrol.com
nslookup www.gnrcontrol.com

# Or use online tools:
# - https://www.whatsmydns.net/
# - https://dnschecker.org/
```

### **Step 3: SSL Certificate Setup (Recommended)**

#### **Option A: Let's Encrypt (Free)**
```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d gnrcontrol.com -d www.gnrcontrol.com

# Auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

#### **Option B: Manual SSL Certificate**
If you have a paid SSL certificate:
```bash
# Place your certificate files in:
sudo mkdir -p /etc/ssl/gnrcontrol
sudo cp your-certificate.crt /etc/ssl/gnrcontrol/
sudo cp your-private-key.key /etc/ssl/gnrcontrol/
```

### **Step 4: Update Nginx Configuration for HTTPS**

After getting SSL certificate, update the nginx configuration:

```bash
sudo tee /etc/nginx/sites-available/gnrcontrol << 'EOF'
server {
    listen 80;
    server_name gnrcontrol.com www.gnrcontrol.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gnrcontrol.com www.gnrcontrol.com;
    
    ssl_certificate /etc/letsencrypt/live/gnrcontrol.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gnrcontrol.com/privkey.pem;
    
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

sudo nginx -t
sudo systemctl reload nginx
```

### **Step 5: Update Frontend Configuration**

The frontend is already configured to use `https://gnrcontrol.com/api` in production. The configuration automatically detects:

- **Development**: Uses `http://localhost:5050/api`
- **Production**: Uses `https://gnrcontrol.com/api`

### **Step 6: Test Your Setup**

#### **Test URLs:**
- ✅ **Frontend**: `https://gnrcontrol.com`
- ✅ **Backend API**: `https://gnrcontrol.com/api`
- ✅ **Login**: `https://gnrcontrol.com/login`

#### **Test Commands:**
```bash
# Test frontend
curl -I https://gnrcontrol.com

# Test backend API
curl -I https://gnrcontrol.com/api/users

# Test SSL certificate
curl -I https://gnrcontrol.com
```

### **Step 7: Security Considerations**

#### **Firewall Setup:**
```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

#### **Security Headers:**
Add these to your nginx configuration:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### **Troubleshooting:**

#### **Domain Not Resolving:**
1. Check DNS records are correct
2. Wait for DNS propagation (24-48 hours)
3. Use `nslookup` or online DNS checkers

#### **SSL Certificate Issues:**
1. Ensure domain is pointing to correct IP
2. Check firewall allows port 443
3. Verify nginx configuration syntax

#### **API Not Working:**
1. Check backend is running: `pm2 status`
2. Verify proxy configuration in nginx/apache
3. Check logs: `sudo tail -f /var/log/nginx/error.log`

### **Expected Results:**

After setup, your app should be accessible at:
- ✅ **Main Site**: `https://gnrcontrol.com`
- ✅ **WWW Redirect**: `https://www.gnrcontrol.com` → `https://gnrcontrol.com`
- ✅ **API Endpoints**: `https://gnrcontrol.com/api/*`
- ✅ **Secure Connection**: Green padlock in browser

### **Monitoring:**

```bash
# Check nginx status
sudo systemctl status nginx

# Check SSL certificate expiry
sudo certbot certificates

# Monitor logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

Your app will now be fully accessible at `https://gnrcontrol.com`! 🚀 