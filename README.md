# GnR Control - Restaurant Management System

A comprehensive, full-stack restaurant management system with advanced role-based access control, inventory management, branch operations, and multi-module functionality designed for restaurant chains and food service businesses.

## 🏗️ Project Overview

GnR Control is a sophisticated restaurant management system that provides complete control over restaurant operations including inventory management, user management, branch operations, order processing, and centralized kitchen management. The system is designed to handle multiple branches, users with different permission levels, and complex restaurant workflows.

### Key Features
- **Multi-Branch Management**: Support for multiple restaurant branches with centralized control
- **Advanced Role-Based Access Control**: Master Admin, Admin, and User roles with granular permissions
- **Inventory Management**: Complete item lifecycle from creation to stock management
- **Branch Order System**: Order processing, tracking, and management for each branch
- **Central Kitchen Operations**: Centralized kitchen management and order processing
- **User Management**: Comprehensive user administration with branch-specific access
- **Reporting & Analytics**: Detailed reports and analytics for business insights
- **Responsive Design**: Modern, mobile-friendly interface using Tailwind CSS

## 🛠️ Technology Stack

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM for data modeling
- **Authentication**: JWT (JSON Web Tokens) with role-based access control
- **Security**: bcryptjs for password hashing, helmet for security headers
- **File Management**: Cloudinary integration for image uploads and storage
- **Rate Limiting**: Express-rate-limit for API protection
- **Development**: Nodemon for hot reloading

### Frontend Architecture
- **Framework**: React.js 18 with functional components and hooks
- **Routing**: React Router DOM for client-side navigation
- **Styling**: Tailwind CSS for utility-first responsive design
- **HTTP Client**: Axios for API communication
- **State Management**: React Context API for global state
- **UI Components**: Custom responsive components with modern design
- **Build Tool**: Create React App with optimization

### Database Design
- **Primary Database**: MongoDB Atlas (Cloud-hosted)
- **ODM**: Mongoose for schema definition and validation
- **Collections**: 20+ collections for comprehensive data management
- **Relationships**: Proper referencing between collections using ObjectIds

### Deployment & Infrastructure
- **Frontend**: GitHub Actions → DigitalOcean App Platform
- **Backend**: Vercel/Hostinger for API hosting
- **Database**: MongoDB Atlas with automated backups
- **CDN**: Cloudinary for image delivery and optimization

## 📁 Complete Project Structure

```
Project/
├── backend/                          # Backend API server
│   ├── config/                      # Configuration files
│   │   └── cloudinary.js           # Cloudinary configuration
│   ├── controllers/                 # Business logic controllers
│   │   ├── userController.js       # User management
│   │   ├── itemController.js       # Item/Inventory management
│   │   ├── branchController.js     # Branch management
│   │   ├── orderController.js      # Order processing
│   │   ├── unitController.js       # Unit management
│   │   └── ...                     # Other controllers
│   ├── middleware/                  # Custom middleware
│   │   ├── auth.js                 # JWT authentication
│   │   ├── permissions.js          # Role-based permissions
│   │   └── rateLimiting.js        # API rate limiting
│   ├── models/                     # MongoDB schemas
│   │   ├── User.js                # User model with roles
│   │   ├── Item.js                # Item model
│   │   ├── Branch.js              # Branch model
│   │   ├── Order.js               # Order model
│   │   ├── Units.js               # Unit model
│   │   └── ...                    # Other models
│   ├── routes/                     # API route definitions
│   │   ├── userRoute.js           # User routes
│   │   ├── itemRoutes.js          # Item routes
│   │   ├── branchRoutes.js        # Branch routes
│   │   ├── orderRoutes.js         # Order routes
│   │   └── ...                    # Other routes
│   ├── server.js                   # Main server file
│   ├── package.json                # Backend dependencies
│   └── vercel.json                 # Vercel deployment config
├── frontend/                       # React frontend application
│   ├── public/                    # Static files
│   │   ├── index.html             # Main HTML file
│   │   ├── favicon.ico            # App icon
│   │   └── manifest.json          # PWA manifest
│   ├── src/
│   │   ├── components/            # Reusable components
│   │   │   ├── EditItemPage/      # Item editing components
│   │   │   ├── PermissionGuard.js # Permission checking
│   │   │   ├── ProtectedRoute.js  # Route protection
│   │   │   ├── ResponsiveForm.js  # Form components
│   │   │   ├── ResponsiveModal.js # Modal components
│   │   │   └── ResponsiveTable.js # Table components
│   │   ├── context/               # React Context providers
│   │   │   └── AuthContext.js     # Authentication context
│   │   ├── layout/                # Layout components
│   │   │   └── Layout.js          # Main layout with sidebar
│   │   ├── pages/                 # Page components
│   │   │   ├── Dashboard.js       # Main dashboard
│   │   │   ├── Login.js           # Login page
│   │   │   ├── User.js            # User management
│   │   │   ├── Items.js           # Item management
│   │   │   ├── Branches.js        # Branch management
│   │   │   ├── Units.js           # Unit management
│   │   │   ├── BranchOrder/       # Branch order pages
│   │   │   ├── CentralKitchen/    # Central kitchen pages
│   │   │   ├── BranchSettings/    # Branch settings pages
│   │   │   └── ...                # Other pages
│   │   ├── services/              # API services
│   │   │   └── api.js             # Axios configuration
│   │   ├── config/                # Configuration
│   │   │   ├── config.js          # App configuration
│   │   │   └── cloudinary.js      # Cloudinary config
│   │   ├── App.js                 # Main app component
│   │   └── index.js               # App entry point
│   ├── package.json               # Frontend dependencies
│   └── tailwind.config.js         # Tailwind configuration
├── composer.json                   # PHP dependencies (if any)
├── deploy.sh                      # Deployment script
└── README.md                      # This documentation
```

## 🔐 Authentication & Authorization System

### User Roles and Permissions

#### 1. Master Admin (`master_admin`)
- **Full System Access**: Complete CRUD permissions on all modules
- **User Management**: Can create, edit, delete, and manage all users
- **Branch Management**: Full control over all branches and their settings
- **System Configuration**: Can modify system-wide settings and configurations
- **Data Access**: Access to all data across all branches
- **Permission Management**: Can assign roles and permissions to other users

#### 2. Admin (`admin`)
- **Limited CRUD**: Create and Edit permissions, but cannot delete records
- **Branch-Specific Access**: Limited to their assigned branches
- **User Management**: Can view and edit users within their scope
- **Inventory Management**: Full access to inventory operations
- **Order Processing**: Can process and manage orders
- **Reporting**: Access to reports and analytics

#### 3. User (`user`)
- **View-Only Access**: Read-only access to assigned modules
- **Branch-Limited**: Access only to their assigned branches
- **No Modifications**: Cannot create, edit, or delete records
- **Dashboard Access**: Limited dashboard with relevant information
- **Order Viewing**: Can view orders but not modify them

### Security Features
- **JWT Authentication**: Tokens with 1-hour expiration
- **Password Security**: bcryptjs hashing with salt
- **Rate Limiting**: 5 login attempts per 15 minutes
- **CORS Protection**: Whitelisted origins only
- **Helmet Security**: Security headers for protection
- **Automatic Logout**: Session timeout on token expiration
- **Permission Validation**: Server-side permission checking

## 🗄️ Database Models & Relationships

### Core Models

#### User Model (`User.js`)
```javascript
{
  name: String,           // User's full name
  email: String,          // Unique email address
  password: String,       // Hashed password
  role: String,           // master_admin, admin, user
  branch: ObjectId,       // Reference to Branch
  sections: [ObjectId],   // Array of Section references
  departments: [String],  // Department assignments
  loginPin: String,       // PIN for quick login
  biometricId: String,    // Biometric authentication
  isActive: Boolean       // Account status
}
```

#### Item Model (`Item.js`)
```javascript
{
  nameEn: String,         // English name
  nameUr: String,         // Urdu name
  code: String,           // Unique item code
  category: ObjectId,     // Reference to ItemCategory
  unit: ObjectId,         // Reference to Units
  price: Number,          // Item price
  cost: Number,           // Item cost
  minStock: Number,       // Minimum stock level
  maxStock: Number,       // Maximum stock level
  currentStock: Number,   // Current stock quantity
  assignBranch: [ObjectId], // Assigned branches
  assignSection: ObjectId,  // Assigned section
  isActive: Boolean       // Item status
}
```

#### Branch Model (`Branch.js`)
```javascript
{
  name: String,           // Branch name
  code: String,           // Unique branch code
  address: String,        // Branch address
  phone: String,          // Contact phone
  email: String,          // Contact email
  manager: String,        // Branch manager
  isActive: Boolean       // Branch status
}
```

#### Order Model (`Order.js`)
```javascript
{
  orderNumber: String,    // Unique order number
  branch: ObjectId,       // Reference to Branch
  items: [{               // Order items
    item: ObjectId,       // Reference to Item
    quantity: Number,     // Item quantity
    price: Number         // Item price
  }],
  status: String,         // Order status
  totalAmount: Number,    // Order total
  createdBy: ObjectId,    // Reference to User
  createdAt: Date         // Order creation date
}
```

#### Units Model (`Units.js`)
```javascript
{
  name: String,           // Unit name
  code: String,           // Unit code
  unitType: String,       // 'Branch Unit' or 'Standard Unit'
  baseUnit: String,       // kg, liter, pieces
  conversionRate: Number, // Conversion rate
  isActive: Boolean       // Unit status
}
```

### Supporting Models
- **ItemCategory**: Item classification and categorization
- **Section**: Restaurant sections/departments
- **Supplier**: Vendor and supplier management
- **Brand**: Brand management
- **Currency**: Multi-currency support
- **Tax**: Tax calculation and management
- **Gallery**: Image and media management
- **RecipeExpert**: Recipe and menu management
- **MenuItem**: Menu item management
- **Department**: Organizational structure
- **Role**: User role definitions

## 🚀 Complete Setup Guide

### Prerequisites
- **Node.js**: Version 16 or higher
- **MongoDB Atlas**: Cloud database account
- **Cloudinary**: Image upload service account
- **Git**: Version control system
- **Code Editor**: VS Code recommended

### Backend Setup

1. **Clone and Navigate**
   ```bash
   git clone <repository-url>
   cd Project/backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Configuration**
   Create `.env` file in backend directory:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Server Configuration
   NODE_ENV=development
   PORT=5050
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Test database connection
   node check-db.js
   
   # Create master admin user
   node setup-super-admin.js
   
   # Seed initial data (optional)
   node seed.js
   ```

5. **Start Development Server**
   ```bash
   npm start
   # or
   npm run dev
   ```

### Frontend Setup

1. **Navigate to Frontend**
   ```bash
   cd ../frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Configuration**
   Create `.env` file in frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:5050/api
   REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```

## 🔧 Complete API Documentation

### Authentication Endpoints

#### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "admin@gmail.com",
  "password": "243Gc794"
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "Admin User",
    "role": "master_admin",
    "branch": "branch_id",
    "permissions": {...}
  }
}
```

#### Logout
```http
POST /api/users/logout
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

### User Management

#### Get All Users
```http
GET /api/users
Authorization: Bearer <token>

Response:
{
  "success": true,
  "users": [
    {
      "id": "user_id",
      "name": "User Name",
      "email": "user@email.com",
      "role": "admin",
      "branch": {
        "id": "branch_id",
        "name": "Branch Name"
      },
      "sections": [...],
      "isActive": true
    }
  ]
}
```

#### Create User
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@gmail.com",
  "password": "password123",
  "role": "admin",
  "branch": "branch_id",
  "sections": ["section_id1", "section_id2"],
  "departments": ["kitchen", "service"],
  "loginPin": "1234",
  "biometricId": "bio_id"
}
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated User Name",
  "email": "updated@email.com",
  "role": "admin",
  "branch": "new_branch_id"
}
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

### Item Management

#### Get All Items
```http
GET /api/items
Authorization: Bearer <token>

Query Parameters:
- category: Filter by category
- branch: Filter by branch
- search: Search by name or code
```

#### Create Item
```http
POST /api/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "nameEn": "Item Name",
  "nameUr": "آئٹم کا نام",
  "code": "ITEM001",
  "category": "category_id",
  "unit": "unit_id",
  "price": 100.00,
  "cost": 80.00,
  "minStock": 10,
  "maxStock": 100,
  "currentStock": 50,
  "assignBranch": ["branch_id1", "branch_id2"],
  "assignSection": "section_id"
}
```

### Branch Management

#### Get All Branches
```http
GET /api/branch
Authorization: Bearer <token>
```

#### Create Branch
```http
POST /api/branch
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Branch Name",
  "code": "BR001",
  "address": "Branch Address",
  "phone": "1234567890",
  "email": "branch@email.com",
  "manager": "Manager Name"
}
```

### Unit Management

#### Get All Units
```http
GET /api/units
Authorization: Bearer <token>
```

#### Get Branch Units Only
```http
GET /api/units/branch
Authorization: Bearer <token>
```

#### Create Unit
```http
POST /api/units
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Kilogram",
  "code": "KG",
  "unitType": "Branch Unit",
  "baseUnit": "kg",
  "conversionRate": 1
}
```

### Order Management

#### Get All Orders
```http
GET /api/orders
Authorization: Bearer <token>
```

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "branch": "branch_id",
  "items": [
    {
      "item": "item_id",
      "quantity": 5,
      "price": 100.00
    }
  ],
  "status": "pending"
}
```

## 🎯 Complete Feature Walkthrough

### 1. Dashboard System

#### Main Dashboard (`/dashboard`)
- **Overview Statistics**: Total users, items, branches, orders
- **Recent Activity**: Latest system activities
- **Quick Actions**: Fast access to common tasks
- **Role-Based Content**: Different views based on user role
- **Real-time Updates**: Live data from database

#### Branch Order Dashboard (`/branch-order`)
- **Order Management**: Create, view, and manage orders
- **Inventory Control**: Stock management and alerts
- **Order History**: Complete order tracking
- **Reports**: Branch-specific analytics
- **Settings**: Branch configuration

### 2. User Management System

#### User List (`/user`)
- **User Table**: Complete user listing with search and filter
- **Role Management**: Assign and manage user roles
- **Branch Assignment**: Assign users to specific branches
- **Section Assignment**: Assign users to restaurant sections
- **Status Management**: Activate/deactivate users
- **Permission Control**: Granular permission management

#### User Creation/Editing
- **Form Validation**: Real-time validation
- **Role Selection**: Dropdown with available roles
- **Branch Selection**: Dropdown with available branches
- **Section Assignment**: Multiple section selection
- **Password Management**: Secure password handling
- **PIN Setup**: Quick login PIN configuration

### 3. Inventory Management

#### Item Management (`/items`)
- **Item Catalog**: Complete item listing with search
- **Category Management**: Item categorization
- **Stock Tracking**: Current stock levels
- **Price Management**: Cost and selling price
- **Branch Assignment**: Assign items to branches
- **Section Assignment**: Assign items to sections

#### Item Creation (`/branch-settings/create-item`)
- **Bilingual Support**: English and Urdu names
- **Category Selection**: Dropdown with search functionality
- **Unit Assignment**: Measurement unit selection
- **Branch Assignment**: Multiple branch selection via checkboxes
- **Section Assignment**: Single section selection via dropdown
- **Stock Configuration**: Min/max stock levels
- **Price Configuration**: Cost and selling price

#### Category Management (`/branch-settings/create-category`)
- **Category Creation**: Create new item categories
- **Bilingual Names**: English and Urdu category names
- **Category Listing**: View and manage categories
- **Edit/Delete**: Full CRUD operations

### 4. Branch Management System

#### Branch List (`/branches`)
- **Branch Overview**: Complete branch listing
- **Branch Details**: Contact information and manager
- **Status Management**: Activate/deactivate branches
- **Edit Operations**: Update branch information

#### Branch Settings
- **Branch-Specific Configuration**: Settings per branch
- **User Assignment**: Assign users to branches
- **Item Assignment**: Assign items to branches
- **Section Management**: Manage branch sections

### 5. Unit Management

#### Unit System (`/units`)
- **Unit Types**: Branch Unit and Standard Unit
- **Unit Creation**: Create new measurement units
- **Base Units**: kg, liter, pieces
- **Conversion Rates**: Unit conversion configuration
- **Unit Listing**: View and manage all units

### 6. Order Management System

#### Branch Orders (`/branch-order`)
- **Order Creation**: Create new orders
- **Order Tracking**: Track order status
- **Order History**: Complete order history
- **Order Processing**: Process and manage orders

#### Central Kitchen (`/central-kitchen`)
- **Order Processing**: Process orders from branches
- **Pick Lists**: Generate pick lists for orders
- **Preparation Tracking**: Track order preparation
- **Dashboard**: Central kitchen overview

### 7. Reporting & Analytics

#### Reports (`/reports`)
- **Sales Reports**: Revenue and sales analytics
- **Inventory Reports**: Stock level reports
- **User Reports**: User activity reports
- **Branch Reports**: Branch-specific analytics
- **Custom Reports**: Customizable report generation

### 8. Settings & Configuration

#### System Settings
- **User Management**: User administration
- **Role Management**: Role and permission configuration
- **Branch Management**: Branch administration
- **Category Management**: Category configuration
- **Unit Management**: Unit configuration
- **Section Management**: Section administration

## 🔒 Security Implementation

### Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: 1-hour automatic expiration
- **Password Hashing**: bcryptjs with salt
- **Rate Limiting**: 5 attempts per 15 minutes
- **Session Management**: Automatic logout on expiration

### Authorization Security
- **Role-Based Access Control**: Granular permission system
- **Permission Validation**: Server-side permission checking
- **Route Protection**: Protected routes with authentication
- **API Security**: CORS and helmet protection
- **Input Validation**: Server-side input validation

### Data Security
- **MongoDB Atlas**: Cloud database with encryption
- **Environment Variables**: Secure configuration management
- **No Sensitive Data**: No sensitive data in client-side code
- **HTTPS**: Secure communication protocols

## 🚀 Deployment Guide

### Frontend Deployment (DigitalOcean)

1. **GitHub Actions Setup**
   ```yaml
   name: Deploy to DigitalOcean
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Setup Node.js
           uses: actions/setup-node@v2
           with:
             node-version: '16'
         - name: Install dependencies
           run: npm install
         - name: Build
           run: npm run build
         - name: Deploy to DigitalOcean
           uses: digitalocean/app_action@main
           with:
             app_name: your-app-name
             token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
   ```

2. **Environment Variables**
   ```env
   REACT_APP_API_URL=https://your-backend-url.com/api
   REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   ```

### Backend Deployment (Vercel)

1. **Vercel Configuration**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

2. **Environment Variables**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=production_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
NODE_ENV=production
   ```

## 🐛 Troubleshooting Guide

### Common Issues and Solutions

#### 1. Authentication Issues
**Problem**: Login fails or token expires
**Solution**: 
   - Check backend server is running
   - Verify database connection
   - Ensure correct credentials
- Check JWT secret configuration

#### 2. Permission Errors
**Problem**: 401 Unauthorized or 403 Forbidden
**Solution**:
   - Verify user role and permissions
   - Check JWT token validity
- Ensure proper authentication headers
- Validate user permissions on server

#### 3. Database Connection Issues
**Problem**: MongoDB connection fails
**Solution**:
- Check MongoDB Atlas connection string
- Verify network access settings
- Test connection with `node check-db.js`
- Check environment variables

#### 4. Build Errors
**Problem**: Frontend build fails
**Solution**:
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for ESLint errors: `npm run lint`
   - Verify all dependencies are installed
- Check for syntax errors in components

#### 5. API Connection Issues
**Problem**: Frontend can't connect to backend
**Solution**:
- Verify backend server is running on correct port
- Check CORS configuration
- Ensure API URL is correct in frontend config
- Test API endpoints directly

#### 6. Image Upload Issues
**Problem**: Images not uploading to Cloudinary
**Solution**:
- Verify Cloudinary credentials
- Check file size limits
- Ensure proper file format
- Test Cloudinary connection

### Debug Commands

```bash
# Backend debugging
npm start                    # Start backend server
node check-db.js            # Test database connection
node test-auth.js           # Test authentication
node check-admin.js         # Check admin user

# Frontend debugging
npm start                   # Start frontend server
npm run build              # Build for production
npm run lint               # Check for linting errors

# Database debugging
mongo "mongodb+srv://..."   # Connect to MongoDB
show collections            # List all collections
db.users.find()            # Query users collection

# Network debugging
curl http://localhost:5050/api/users  # Test API endpoint
curl -H "Authorization: Bearer <token>" http://localhost:5050/api/users  # Test authenticated endpoint
```

## 📚 Development Guidelines

### Code Standards
- **ESLint**: Follow ESLint rules for code quality
- **Prettier**: Use Prettier for code formatting
- **Component Structure**: Use functional components with hooks
- **Error Handling**: Implement proper error handling
- **Loading States**: Show loading states for better UX

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request
# Merge after review
```

### Testing Strategy
- **Unit Testing**: Test individual components
- **Integration Testing**: Test API endpoints
- **E2E Testing**: Test complete user flows
- **Performance Testing**: Monitor application performance

## 📞 Support and Maintenance

### Getting Help
1. **Check Documentation**: Review this README and code comments
2. **Check Logs**: Review server and browser console logs
3. **Test Endpoints**: Use Postman or curl to test API
4. **Contact Team**: Reach out to development team

### Maintenance Tasks
- **Regular Updates**: Keep dependencies updated
- **Security Patches**: Apply security updates
- **Database Backups**: Regular MongoDB backups
- **Performance Monitoring**: Monitor application performance
- **User Training**: Provide user training and support

## 📄 License and Legal

This project is proprietary software developed for restaurant management. All rights reserved.

### Usage Terms
- **Internal Use**: For authorized restaurant chains only
- **No Redistribution**: Cannot be redistributed without permission
- **Support**: Technical support provided to authorized users
- **Updates**: Regular updates and maintenance provided

---

**Last Updated**: December 2024  
**Version**: 2.0.0  
**Status**: Production Ready 
**Maintained By**: Development Team 