import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Campaigns from './pages/Campaigns';
import Tasks from './pages/Tasks';
import Biodiversity from './pages/Biodiversity';
import Payments from './pages/Payments';
import UserApproval from './pages/UserApproval';
import Notifications from './pages/Notifications';
import MyParticipations from './pages/MyParticipations';
import LocationSetup from './pages/LocationSetup';

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#0a0f1d',
        color: '#00f5d4',
        fontSize: '1.2rem',
        fontFamily: 'var(--font-display)'
      }}>
        Loading TerraMarine Platform...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Mandatory Location Setup Guard for Fisherman users
  if (user.role === 'Fisherman' && !user.location_completed && location.pathname !== '/fisherman/location-setup') {
    return <Navigate to="/fisherman/location-setup" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

const LocationSetupGuard = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'Fisherman') return <Navigate to="/dashboard" replace />;
  if (user.location_completed && !isEditMode) return <Navigate to="/dashboard" replace />;

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AuthorityOrAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || (user.role !== 'Admin' && user.role !== 'Authority')) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const NonVolunteerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || ['Volunteer', 'Citizen'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Fisherman Location Setup Route */}
          <Route 
            path="/fisherman/location-setup" 
            element={
              <LocationSetupGuard>
                <LocationSetup />
              </LocationSetupGuard>
            } 
          />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
          <Route path="/campaigns" element={<ProtectedLayout><Campaigns /></ProtectedLayout>} />
          <Route path="/tasks" element={<ProtectedLayout><NonVolunteerRoute><Tasks /></NonVolunteerRoute></ProtectedLayout>} />
          <Route path="/biodiversity" element={<ProtectedLayout><NonVolunteerRoute><Biodiversity /></NonVolunteerRoute></ProtectedLayout>} />
          <Route path="/payments" element={<ProtectedLayout><Payments /></ProtectedLayout>} />
          <Route path="/participations" element={<ProtectedLayout><MyParticipations /></ProtectedLayout>} />
          <Route path="/notifications" element={<ProtectedLayout><Notifications /></ProtectedLayout>} />
          <Route path="/user-approval" element={<ProtectedLayout><AuthorityOrAdminRoute><UserApproval /></AuthorityOrAdminRoute></ProtectedLayout>} />

          {/* Catch All Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
