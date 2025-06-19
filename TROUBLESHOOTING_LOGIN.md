# Login Troubleshooting Guide

## Current Issue: 401 Unauthorized Error

You're getting a 401 Unauthorized error when trying to login. This means the password in the database doesn't match what you're entering.

## Step-by-Step Solution

### 1. Check Current Password Status
First, let's see what password is currently in the database:

```bash
cd backend
node test-current-password.js
```

This will tell us:
- ✅ If admin user exists
- 🔑 Which password is currently working
- ⚠️ If we need to update the password

### 2. Update Password (if needed)
If the test shows the old password is still active, run:

```bash
cd backend
node quick-password-update.js
```

This will:
- 🔄 Update admin password to `243Gc794`
- ✅ Create admin user if it doesn't exist
- 📋 Show the new login credentials

### 3. Start Backend Server
Make sure the backend server is running:

```bash
cd backend
npm start
```

You should see:
- ✅ Server running on port 5050
- ✅ MongoDB connected

### 4. Test Login
Try logging in with:
- **Email**: `admin@gmail.com`
- **Password**: `243Gc794`

## Expected Results

### ✅ Success
- Login form accepts credentials
- Redirects to dashboard
- No more 401 errors

### ❌ Still Failing
If you still get 401 errors:

1. **Check Backend Console**: Look for login attempt logs
2. **Check Network Tab**: Verify request is going to correct URL
3. **Clear Browser Cache**: Remove any cached data
4. **Try Different Browser**: Test in incognito mode

## Debug Information

### Current Configuration
- ✅ Frontend: `http://localhost:3000`
- ✅ Backend: `http://localhost:5050/api`
- ✅ Config: Using correct URLs
- ❌ Password: Needs to be updated

### API Endpoints
- `POST /api/users/login` - Login endpoint
- `GET /api/users/profile` - Get user profile
- `POST /api/users/logout` - Logout endpoint

## Common Issues

### 1. Backend Server Not Running
**Symptoms**: Connection refused errors
**Solution**: Start backend with `npm start`

### 2. Wrong Password in Database
**Symptoms**: 401 Unauthorized
**Solution**: Run password update script

### 3. CORS Issues
**Symptoms**: Network errors in browser
**Solution**: Backend CORS is configured correctly

### 4. MongoDB Connection Issues
**Symptoms**: Backend won't start
**Solution**: Check MongoDB connection string

## Quick Fix Commands

```bash
# 1. Navigate to backend
cd backend

# 2. Test current password
node test-current-password.js

# 3. Update password if needed
node quick-password-update.js

# 4. Start server
npm start

# 5. Test authentication
node test-auth.js
```

## Login Credentials (After Update)

- **Email**: `admin@gmail.com`
- **Password**: `243Gc794`

## Next Steps

1. Run the password test script
2. Update password if needed
3. Start backend server
4. Try logging in again
5. Check browser console for any remaining errors

The configuration is now correct - we just need to ensure the password is updated in the database! 