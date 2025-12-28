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

import InfluencerDashboard from './pages/influencer/Dashboard';
import InfluencerProposals from './pages/influencer/Proposals';
import InfluencerMessages from './pages/influencer/Messages';
import InfluencerEarnings from './pages/influencer/Earnings';
import InfluencerProfile from './pages/influencer/Profile';
import InfluencerSettings from './pages/influencer/Settings';

// ============================================
// PROMOTER PAGES
// ============================================

import PromoterDashboard from './pages/promoter/Dashboard';
import PromoterBrowse from './pages/promoter/Browse';
import PromoterProposals from './pages/promoter/Proposals';
import PromoterMessages from './pages/promoter/Messages';
import PromoterProfile from './pages/promoter/Profile';
import PromoterSettings from './pages/promoter/Settings';
import InfluencerPublicProfile from './pages/InfluencerPublicProfile';
import PromoterPublicProfile from './pages/PromoterPublicProfile';
import ChatView from './pages/ChatView';

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

  // User has no roles - go to role selection to choose first role
  if (!user?.roles || user.roles.length === 0) {
    return <Navigate to="/role-selection" replace />;
  }

  // User has both roles - show role selection page
  if (user.roles.length > 1) {
    return <Navigate to="/role-selection" replace />;
  }

  // User has single role - go to that dashboard
  if (user.roles.includes('influencer')) {
    return <Navigate to="/influencer/dashboard" replace />;
  } else if (user.roles.includes('promoter')) {
    return <Navigate to="/promoter/dashboard" replace />;
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

  // Check if user has the required role
  if (requiredRole && !user?.roles.includes(requiredRole)) {
    // User doesn't have this role - redirect to appropriate dashboard
    if (user?.roles.includes('influencer')) {
      return <Navigate to="/influencer/dashboard" replace />;
    } else if (user?.roles.includes('promoter')) {
      return <Navigate to="/promoter/dashboard" replace />;
    }
    return <Navigate to="/role-selection" replace />;
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

        {/* Public Profiles - accessible to anyone */}
        <Route path="/influencers/:uid" element={<InfluencerPublicProfile />} />
        <Route path="/promoters/:uid" element={<PromoterPublicProfile />} />

        {/* Chat Routes - accessible to both influencers and promoters */}
        <Route
          path="/messages/:proposalId"
          element={
            <ProtectedRoute>
              <ChatView />
            </ProtectedRoute>
          }
        />

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
          <Route path="proposals/:proposalId" element={<InfluencerProposals />} />
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
          <Route path="proposals/:proposalId" element={<PromoterProposals />} />
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
