import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Branches from './pages/Branches';
import AuditLogs from './pages/AuditLogs';
import Analytics from './pages/Analytics';
import AiInsights from './pages/AiInsights';
import PublicAssetSummary from './pages/PublicAssetSummary';
import LoadingSpinner from './components/LoadingSpinner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/** Only ADMIN and MANAGER can access; redirect USER to dashboard */
function ManagerRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user && user.role === 'USER') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes (no auth required) */}
      <Route path="/login" element={<Login />} />
      <Route path="/public/assets/:id" element={<PublicAssetSummary />} />

      {/* Protected routes */}
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/assets/:id" element={<AssetDetail />} />
              <Route path="/employees" element={<ManagerRoute><Employees /></ManagerRoute>} />
              <Route path="/departments" element={<ManagerRoute><Departments /></ManagerRoute>} />
              <Route path="/branches" element={<ManagerRoute><Branches /></ManagerRoute>} />
              <Route path="/audit" element={<ManagerRoute><AuditLogs /></ManagerRoute>} />
              <Route path="/analytics" element={<ManagerRoute><Analytics /></ManagerRoute>} />
              <Route path="/ai" element={<ManagerRoute><AiInsights /></ManagerRoute>} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}
