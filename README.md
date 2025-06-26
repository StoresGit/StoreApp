# GnR Control - Restaurant Management System

A comprehensive restaurant management system with role-based access control, inventory management, and multi-module functionality.

## 🏗️ Project Overview

GnR Control is a full-stack web application designed for restaurant management with the following key features:

- **Role-Based Access Control**: Master Admin, Admin, and User roles with granular permissions
- **Inventory Management**: Items, Suppliers, Package Items with CRUD operations
- **Multi-Module System**: Departments, Branches, Brands, Categories, and more
- **Secure Authentication**: JWT-based authentication with token expiration
- **Image Management**: Cloudinary integration for file uploads
- **Responsive Design**: Modern UI with Tailwind CSS

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, helmet, express-rate-limit
- **File Upload**: Multer + Cloudinary
- **Development**: Nodemon

### Frontend
- **Framework**: React.js 18
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Icons**: Lucide React
- **Build Tool**: Create React App

### Database
- **Primary**: MongoDB Atlas
- **Connection**: Mongoose ODM
- **Collections**: Users, Items, Suppliers, PackageItems, etc.

### Deployment
- **Frontend**: GitHub Actions → DigitalOcean
- **Backend**: Vercel/Hostinger
- **Database**: MongoDB Atlas (Cloud)

## 📁 Project Structure

```
Project/
├── backend/                 # Backend API server
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
├── frontend/              # React frontend
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React Context providers
│   │   ├── layout/       # Layout components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── config/       # Configuration
│   └── package.json      # Frontend dependencies
└── README.md             # This file
```

## 🔐 Authentication & Authorization

### User Roles
1. **Master Admin** (`master_admin`)
   - Full CRUD permissions on all modules
   - Can manage other users
   - Access to all system features

2. **Admin** (`admin`)
   - Create and Edit permissions
   - Cannot delete records
   - Limited user management

3. **User** (`user`)
   - View-only access
   - No modification permissions
   - Read-only dashboard

### Security Features
- JWT tokens with 1-hour expiration
- Password hashing with bcryptjs
- Rate limiting on login attempts
- CORS protection
- Helmet security headers
- Automatic logout on token expiration

## 🗄️ Database Models

### Core Models
- **User**: Authentication, roles, permissions
- **Item**: Inventory items with categories
- **Supplier**: Vendor management
- **PackageItem**: Product packaging details
- **Department**: Organizational structure
- **Branch**: Location management
- **Brand**: Brand management
- **ItemCategory**: Item classification
- **Role**: User role definitions
- **Currency**: Multi-currency support
- **Tax**: Tax management
- **Units**: Measurement units
- **Gallery**: Image management
- **RecipeExpert**: Recipe management
- **MenuItem**: Menu items

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Cloudinary account (for image uploads)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Project/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the backend directory:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   NODE_ENV=development
   PORT=5050
   ```

4. **Set up Master Admin**
   ```bash
   node quick-password-update.js
   ```
   This creates/updates the master admin user:
   - Email: `admin@gmail.com`
   - Password: `243Gc794`
   - Role: `master_admin`

5. **Start the server**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

## 🔧 API Endpoints

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `GET /api/users/profile` - Get user profile
- `GET /api/users/permissions` - Get user permissions

### User Management
- `GET /api/users` - Get all users (requires view permission)
- `POST /api/users` - Create user (requires create permission)
- `PUT /api/users/:id` - Update user (requires edit permission)
- `DELETE /api/users/:id` - Delete user (requires delete permission)

### Inventory Management
- `GET /api/items` - Get all items
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Package Items
- `GET /api/package-items` - Get all package items
- `POST /api/package-items` - Create package item
- `PUT /api/package-items/:id` - Update package item
- `DELETE /api/package-items/:id` - Delete package item

## 🚀 Deployment

### Frontend Deployment (GitHub Actions)

The frontend is automatically deployed using GitHub Actions to DigitalOcean:

1. **GitHub Actions Workflow**
   - Triggered on push to main branch
   - Builds React app
   - Deploys to DigitalOcean App Platform

2. **Environment Configuration**
   - Backend URL automatically configured based on hostname
   - Production builds with optimization

### Backend Deployment

The backend can be deployed to:
- **Vercel**: Serverless deployment
- **Hostinger**: Traditional hosting
- **DigitalOcean**: App Platform or Droplets

### Environment Variables for Production

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=production_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
NODE_ENV=production
PORT=5050
```

## 🔒 Security Features

### Authentication Security
- JWT tokens with 1-hour expiration
- Secure password hashing with bcryptjs
- Rate limiting on login attempts (5 attempts per 15 minutes)
- Automatic logout on token expiration

### API Security
- CORS protection with whitelisted origins
- Helmet security headers
- Input validation and sanitization
- Role-based access control (RBAC)

### Data Protection
- MongoDB Atlas with network access controls
- Environment variable protection
- No sensitive data in client-side code

## 📱 Features

### Dashboard
- Overview of system statistics
- Quick access to main modules
- User role and permission display

### User Management
- Create, edit, delete users
- Role assignment
- Permission management
- User status tracking

### Inventory Management
- Item catalog with categories
- Supplier management
- Package item tracking
- Stock management

### Multi-Module System
- Department management
- Branch management
- Brand management
- Category management
- Currency management
- Tax management

### Image Management
- Cloudinary integration
- Image upload and storage
- Gallery management
- Optimized image delivery

## 🐛 Troubleshooting

### Common Issues

1. **Login Issues**
   - Check backend server is running
   - Verify database connection
   - Ensure correct credentials

2. **Permission Errors**
   - Verify user role and permissions
   - Check JWT token validity
   - Ensure proper authentication

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check for ESLint errors
   - Verify all dependencies are installed

### Debug Commands

```bash
# Check backend logs
npm start

# Check frontend build
npm run build

# Test API endpoints
curl http://localhost:5050/api/users

# Check database connection
node check-db.js
```

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For technical support or questions:
- Check the troubleshooting documentation
- Review the security documentation
- Contact the development team

---

**Last Updated**: June 2024
**Version**: 1.0.0
**Status**: Production Ready 