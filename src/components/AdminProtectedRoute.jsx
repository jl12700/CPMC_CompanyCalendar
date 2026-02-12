import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

const AdminProtectedRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <LoadingSpinner fullScreen text="Loading..." />;

  if (!user) return <Navigate to="/login" replace />;

  // If authenticated but not admin, redirect to user dashboard
  if (!isAdmin) {
    return <Navigate to="/user/dashboard" replace />;
  }

  // Admin user
  return children;
};

export default AdminProtectedRoute;