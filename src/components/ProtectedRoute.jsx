import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen text="Loading..." />;

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
