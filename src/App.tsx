import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores';

// ============================================
// PUBLIC PAGES
// ============================================

// Placeholder components - will be implemented
const Landing = () => <div className="min-h-screen flex items-center justify-center">Landing Page</div>;
const Login = () => <div className="min-h-screen flex items-center justify-center">Login Page</div>;
const RoleSelection = () => <div className="min-h-screen flex items-center justify-center">Role Selection Page</div>;

// ============================================
// INFLUENCER PAGES
// ============================================

const InfluencerDashboard = () => <div className="min-h-screen p-8">Influencer Dashboard</div>;
const InfluencerProposals = () => <div className="min-h-screen p-8">Influencer Proposals</div>;
const InfluencerMessages = () => <div className="min-h-screen p-8">Influencer Messages</div>;
const InfluencerEarnings = () => <div className="min-h-screen p-8">Influencer Earnings</div>;
const InfluencerProfile = () => <div className="min-h-screen p-8">Influencer Profile</div>;
const InfluencerSettings = () => <div className="min-h-screen p-8">Influencer Settings</div>;

// ============================================
// PROMOTER PAGES
// ============================================

const PromoterDashboard = () => <div className="min-h-screen p-8">Promoter Dashboard</div>;
const PromoterBrowse = () => <div className="min-h-screen p-8">Browse Influencers</div>;
const PromoterProposals = () => <div className="min-h-screen p-8">Promoter Proposals</div>;
const PromoterMessages = () => <div className="min-h-screen p-8">Promoter Messages</div>;
const PromoterProfile = () => <div className="min-h-screen p-8">Promoter Profile</div>;
const PromoterSettings = () => <div className="min-h-screen p-8">Promoter Settings</div>;

// ============================================
// PROTECTED ROUTE WRAPPER
// ============================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'influencer' | 'promoter';
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'influencer') {
      return <Navigate to="/influencer/dashboard" replace />;
    } else if (user.role === 'promoter') {
      return <Navigate to="/promoter/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ============================================
// APP COMPONENT
// ============================================

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/role-selection" element={<RoleSelection />} />

        {/* Influencer Routes */}
        <Route
          path="/influencer/dashboard"
          element={
            <ProtectedRoute requiredRole="influencer">
              <InfluencerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/influencer/proposals"
          element={
            <ProtectedRoute requiredRole="influencer">
              <InfluencerProposals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/influencer/messages"
          element={
            <ProtectedRoute requiredRole="influencer">
              <InfluencerMessages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/influencer/earnings"
          element={
            <ProtectedRoute requiredRole="influencer">
              <InfluencerEarnings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/influencer/profile"
          element={
            <ProtectedRoute requiredRole="influencer">
              <InfluencerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/influencer/settings"
          element={
            <ProtectedRoute requiredRole="influencer">
              <InfluencerSettings />
            </ProtectedRoute>
          }
        />

        {/* Promoter Routes */}
        <Route
          path="/promoter/dashboard"
          element={
            <ProtectedRoute requiredRole="promoter">
              <PromoterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/promoter/browse"
          element={
            <ProtectedRoute requiredRole="promoter">
              <PromoterBrowse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/promoter/proposals"
          element={
            <ProtectedRoute requiredRole="promoter">
              <PromoterProposals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/promoter/messages"
          element={
            <ProtectedRoute requiredRole="promoter">
              <PromoterMessages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/promoter/profile"
          element={
            <ProtectedRoute requiredRole="promoter">
              <PromoterProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/promoter/settings"
          element={
            <ProtectedRoute requiredRole="promoter">
              <PromoterSettings />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
