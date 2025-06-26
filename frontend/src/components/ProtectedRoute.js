import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

<<<<<<< HEAD
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
=======
  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to login if no user is logged in
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check for required role if specified
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
>>>>>>> 9ff61216b4d0ac253b3dd5502f8e1ca4983d5f15
  }

  return children;
};

export default ProtectedRoute; 