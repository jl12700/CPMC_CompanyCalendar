import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLogin from './pages/auth/AdminLogin';

// Admin Pages
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import SchedulePage from './pages/SchedulePage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import ProfilePage from './pages/Profilepage';

// User Pages
import UserDashboard from './userpage/userDashboard';
import UserCalendar from './userpage/userCalendar';
import UserSchedule from './userpage/userSchedule';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Routes - Admins only */}
          <Route
            path="/dashboard"
            element={
              <AdminProtectedRoute>
                <DashboardPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <AdminProtectedRoute>
                <CalendarPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <AdminProtectedRoute>
                <SchedulePage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/create-event"
            element={
              <AdminProtectedRoute>
                <CreateEventPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/edit-event/:id"
            element={
              <AdminProtectedRoute>
                <EditEventPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <AdminProtectedRoute>
                <ProfilePage />
              </AdminProtectedRoute>
            }
          />

          {/* Protected User Routes - Regular users only */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/calendar"
            element={
              <ProtectedRoute>
                <UserCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/schedule"
            element={
              <ProtectedRoute>
                <UserSchedule />
              </ProtectedRoute>
            }
          />

          {/* Root redirect - handled by role-based redirect in ProtectedRoute components */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;