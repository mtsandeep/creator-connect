import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores';
import { useAuth } from './hooks/useAuth';

// ============================================
// PUBLIC PAGES
// ============================================

// Import actual page components
import Landing from './pages/Landing';
import Login from './pages/Login';
import RoleSelection from './pages/RoleSelection';
import InfluencerSignup from './pages/InfluencerSignup';
import PromoterSignup from './pages/PromoterSignup';

// Import Layouts
import InfluencerLayout from './components/layout/InfluencerLayout';
import PromoterLayout from './components/layout/PromoterLayout';

// ============================================
// INFLUENCER PAGES
// ============================================

const InfluencerDashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
    <p className="text-gray-400">Welcome to your influencer dashboard!</p>
  </div>
);
const InfluencerProposals = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-white mb-6">Proposals</h1>
    <p className="text-gray-400">View and manage your collaboration proposals</p>
  </div>
);
const InfluencerMessages = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-white mb-6">Messages</h1>
    <p className="text-gray-400">Chat with brands about ongoing collaborations</p>
  </div>
);
const InfluencerEarnings = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-white mb-6">Earnings</h1>
    <p className="text-gray-400">Track your payments and earnings</p>
  </div>
);
const InfluencerProfile = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>
    <p className="text-gray-400">View and edit your public profile</p>
  </div>
);
const InfluencerSettings = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
    <p className="text-gray-400">Manage your account settings</p>
  </div>
);

// ============================================
// PROMOTER PAGES
// ============================================

const PromoterDashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
    <p className="text-gray-400">Welcome to your promoter dashboard!</p>
  </div>
);
const PromoterBrowse = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-white mb-6">Browse Influencers</h1>
    <p className="text-gray-400">Discover and connect with influencers</p>
  </div>
);
const PromoterProposals = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-white mb-6">Proposals</h1>
    <p className="text-gray-400">View and manage your collaboration proposals</p>
  </div>
);
const PromoterMessages = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-white mb-6">Messages</h1>
    <p className="text-gray-400">Chat with influencers about ongoing collaborations</p>
  </div>
);
const PromoterProfile = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>
    <p className="text-gray-400">View and edit your brand profile</p>
  </div>
);
const PromoterSettings = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
    <p className="text-gray-400">Manage your account settings</p>
  </div>
);

// ============================================
// AUTH REDIRECT COMPONENT
// ============================================

function AuthRedirect() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated - redirect based on profile status
  if (user?.profileComplete && user?.role) {
    // Profile complete - go to dashboard
    if (user.role === 'influencer') {
      return <Navigate to="/influencer/dashboard" replace />;
    } else if (user.role === 'promoter') {
      return <Navigate to="/promoter/dashboard" replace />;
    }
  }

  // Profile incomplete - continue flow
  if (user?.role) {
    return <Navigate to={`/signup/${user.role}`} replace />;
  }

  return <Navigate to="/role-selection" replace />;
}

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'influencer') {
      return <Navigate to="/influencer/dashboard" replace />;
    } else if (user?.role === 'promoter') {
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
  // Initialize auth listener
  useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/signup/influencer" element={<InfluencerSignup />} />
        <Route path="/signup/promoter" element={<PromoterSignup />} />

        {/* Auth Redirect - handles root auth flow */}
        <Route path="/auth-redirect" element={<AuthRedirect />} />

        {/* Influencer Routes with Layout */}
        <Route
          path="/influencer/*"
          element={
            <ProtectedRoute requiredRole="influencer">
              <InfluencerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<InfluencerDashboard />} />
          <Route path="proposals" element={<InfluencerProposals />} />
          <Route path="messages" element={<InfluencerMessages />} />
          <Route path="earnings" element={<InfluencerEarnings />} />
          <Route path="profile" element={<InfluencerProfile />} />
          <Route path="settings" element={<InfluencerSettings />} />
        </Route>

        {/* Promoter Routes with Layout */}
        <Route
          path="/promoter/*"
          element={
            <ProtectedRoute requiredRole="promoter">
              <PromoterLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<PromoterDashboard />} />
          <Route path="browse" element={<PromoterBrowse />} />
          <Route path="proposals" element={<PromoterProposals />} />
          <Route path="messages" element={<PromoterMessages />} />
          <Route path="profile" element={<PromoterProfile />} />
          <Route path="settings" element={<PromoterSettings />} />
        </Route>

        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
