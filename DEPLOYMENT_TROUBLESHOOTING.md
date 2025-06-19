# GitHub Actions Deployment Troubleshooting

## 🚨 Common Deployment Issues

### 1. **Build Failing Due to ESLint Errors**
**Problem**: Build fails with ESLint warnings treated as errors
**Solution**: 
- ✅ Fixed: Removed unused variables in `Layout.js` and `User.js`
- ✅ Fixed: Updated production admin script for master admin role

### 2. **SSH Connection Issues**
**Problem**: Deployment fails at SSH steps
**Check**:
- GitHub repository secrets are properly configured:
  - `HOST`: Your server IP address
  - `USERNAME`: SSH username (usually `root`)
  - `SSH_PRIVATE_KEY`: Your private SSH key

### 3. **PM2 Process Issues**
**Problem**: Backend server not starting properly
**Check**:
- PM2 is installed on the server: `npm install -g pm2`
- Server has Node.js installed
- Port 5050 is available

### 4. **File Permission Issues**
**Problem**: Cannot write to directories
**Solution**:
```bash
# On your server
chmod -R 755 /var/www/gnrcontrol
chmod -R 755 /root/gnr/backend
```

## 🔧 Manual Deployment Steps

If GitHub Actions continues to fail, you can deploy manually:

### Frontend Deployment
```bash
# Build the frontend
cd frontend
npm install
npm run build

# Upload build folder to server
scp -r build/* user@your-server:/var/www/gnrcontrol/
```

### Backend Deployment
```bash
# Upload backend to server
scp -r backend/* user@your-server:/root/gnr/backend/

# SSH into server and start backend
ssh user@your-server
cd /root/gnr/backend
npm install
pm2 delete api || true
pm2 start server.js --name api
pm2 save
```

## 📋 GitHub Actions Workflow Steps

The current workflow does the following:

1. **Checkout code** from main branch
2. **Setup Node.js** for frontend
3. **Install frontend dependencies**
4. **Build frontend** (React app)
5. **Setup Node.js** for backend
6. **Install backend dependencies**
7. **Deploy backend** via SSH to `/root/gnr/backend`
8. **Deploy frontend build** via SSH to `/var/www/gnrcontrol`
9. **Setup admin user** and start server

## 🔍 Debugging Steps

### 1. Check GitHub Actions Logs
- Go to your repository → Actions tab
- Click on the failed workflow run
- Check each step for error messages

### 2. Check Server Logs
```bash
# SSH into your server
ssh user@your-server

# Check PM2 processes
pm2 list
pm2 logs api

# Check nginx/apache logs
tail -f /var/log/nginx/error.log
```

### 3. Test Server Connection
```bash
# Test if server is reachable
ping your-server-ip

# Test SSH connection
ssh -i your-key user@your-server-ip
```

## 🛠️ Required Server Setup

### Prerequisites on Server:
1. **Node.js** (v16 or higher)
2. **PM2** globally installed: `npm install -g pm2`
3. **Nginx/Apache** configured for frontend
4. **SSH access** with proper keys
5. **Firewall** allowing ports 80, 443, 5050

### Nginx Configuration Example:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/gnrcontrol;
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
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔐 Environment Variables

Make sure your server has the correct environment variables:

```bash
# In /root/gnr/backend/.env
MONGODB_URI=mongodb+srv://Karyanastore:Karyanastore123@cluster0.izvxlqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_production_jwt_secret
NODE_ENV=production
PORT=5050
```

## 📞 Support

If deployment continues to fail:

1. **Check GitHub Actions logs** for specific error messages
2. **Verify server configuration** and prerequisites
3. **Test manual deployment** to isolate the issue
4. **Check server resources** (disk space, memory, etc.)

## 🎯 Quick Fix Commands

```bash
# On your server - restart everything
pm2 delete all
cd /root/gnr/backend
npm install
pm2 start server.js --name api
pm2 save

# Check if backend is running
curl http://localhost:5050/api

# Check frontend files
ls -la /var/www/gnrcontrol/
``` 