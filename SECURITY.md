# Security Implementation

This document outlines the security features implemented in the application.

## Authentication & Authorization

### JWT Token Management
- **Token Expiration**: 1 hour (3600 seconds)
- **Automatic Logout**: Users are automatically logged out after 1 hour
- **Token Validation**: Server-side validation of token expiration and user existence
- **Secure Storage**: Tokens stored in localStorage with automatic cleanup

### Login Security
- **Rate Limiting**: Maximum 5 login attempts per 15 minutes per IP
- **Password Hashing**: BCrypt with salt rounds of 10
- **Account Status Check**: Verification of user account active status
- **Secure Password**: Admin password updated to `243Gc794`

## Frontend Security Features

### Protected Routes
- All routes except login are protected
- Automatic redirect to login page for unauthenticated users
- Loading states during authentication checks

### Token Management
- Automatic token inclusion in API requests
- Global error handling for 401 responses
- Automatic logout on token expiration
- Clean localStorage on logout

### User Experience
- Real-time user name display in navbar
- Secure logout button in navigation
- Loading indicators during authentication
- Error messages for failed login attempts

## Backend Security Features

### Middleware Protection
- JWT token verification
- User existence validation
- Account status verification
- Comprehensive error handling

### Rate Limiting
- General API rate limiting: 100 requests per 15 minutes
- Login-specific rate limiting: 5 attempts per 15 minutes
- IP-based limiting to prevent brute force attacks

### Security Headers
- Helmet.js for security headers
- CORS configuration for production domains
- Content-Type validation

### Database Security
- Password hashing with BCrypt
- User model validation
- Timestamp tracking for audit trails

## API Endpoints

### Authentication Endpoints
- `POST /api/users/login` - User login (rate limited)
- `POST /api/users/logout` - User logout (requires auth)
- `GET /api/users/profile` - Get user profile (requires auth)

### Protected Endpoints
All other endpoints require valid JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Error Handling

### Token Errors
- `TOKEN_EXPIRED`: Token has expired
- `INVALID_TOKEN`: Malformed or invalid token
- `USER_NOT_FOUND`: User no longer exists
- `ACCOUNT_INACTIVE`: User account is deactivated

### Rate Limiting
- `429 Too Many Requests`: Rate limit exceeded
- Custom error messages for login attempts

## Testing

Run the authentication test:
```bash
cd backend
node test-auth.js
```

Update admin password:
```bash
cd backend
node update-password-simple.js
```

## Security Best Practices

1. **Never store sensitive data in localStorage** (except JWT tokens)
2. **Always validate tokens server-side**
3. **Use HTTPS in production**
4. **Implement proper CORS policies**
5. **Regular security audits**
6. **Monitor for suspicious activity**
7. **Keep dependencies updated**

## Environment Variables

Required environment variables:
```
JWT_SECRET=your-secret-key
MONGODB_URI=your-mongodb-connection-string
NODE_ENV=production
```

## Deployment Security

1. Use environment variables for sensitive data
2. Enable HTTPS
3. Configure proper CORS origins
4. Set up monitoring and logging
5. Regular security updates 