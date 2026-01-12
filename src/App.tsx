import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from './stores';
import { useAuth } from './hooks/useAuth';
import ToastContainer from './components/common/ToastContainer';

// ============================================
// PUBLIC PAGES - Always loaded
// ============================================

// Import actual page components
import Landing from './pages/Landing';
import Login from './pages/Login';
import RoleSelection from './pages/RoleSelection';
import InfluencerSignup from './pages/InfluencerSignup';
import PromoterSignup from './pages/PromoterSignup';

// ============================================
// LAZY LOADED ROUTES
// ============================================

// Influencer Pages & Layout
const InfluencerLayout = lazy(() => import('./components/layout/InfluencerLayout'));
const InfluencerDashboard = lazy(() => import('./pages/influencer/Dashboard'));
const InfluencerProposals = lazy(() => import('./pages/influencer/Proposals'));
const InfluencerMessages = lazy(() => import('./pages/influencer/Messages'));
const InfluencerEarnings = lazy(() => import('./pages/influencer/Earnings'));
const InfluencerProfile = lazy(() => import('./pages/influencer/Profile'));
const InfluencerLinkInBioSettings = lazy(() => import('./pages/influencer/LinkInBioSettings'));
const InfluencerSettings = lazy(() => import('./pages/influencer/Settings'));
const InfluencerBusinessProfile = lazy(() => import('./pages/influencer/BusinessProfile'));
const InfluencerVerificationTasks = lazy(() => import('./pages/influencer/VerificationTasks'));

// Promoter Pages & Layout
const PromoterLayout = lazy(() => import('./components/layout/PromoterLayout'));
const PromoterDashboard = lazy(() => import('./pages/promoter/Dashboard'));
const PromoterBrowse = lazy(() => import('./pages/promoter/Browse'));
const PromoterProposals = lazy(() => import('./pages/promoter/Proposals'));
const PromoterMessages = lazy(() => import('./pages/promoter/Messages'));
const PromoterProfile = lazy(() => import('./pages/promoter/Profile'));
const PromoterSettings = lazy(() => import('./pages/promoter/Settings'));
const PromoterBusinessProfile = lazy(() => import('./pages/promoter/BusinessProfile'));

// Admin Pages & Layout
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminInfluencers = lazy(() => import('./pages/admin/Influencers'));
const AdminPromoters = lazy(() => import('./pages/admin/Promoters'));
const AdminVerifications = lazy(() => import('./pages/admin/Verifications'));
const AdminVerificationTasks = lazy(() => import('./pages/admin/VerificationTasks'));
const AdminTaskDetail = lazy(() => import('./pages/admin/TaskDetail'));
const AdminDashboardMessages = lazy(() => import('./pages/admin/DashboardMessages'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

// Public Profiles (lazy loaded as they're only accessed when viewing someone's profile)
const InfluencerPublicProfile = lazy(() => import('./pages/InfluencerPublicProfile'));
const PromoterProfileView = lazy(() => import('./pages/PromoterProfileView'));

// Link-in Bio (public page, lazy loaded)
const LinkInBio = lazy(() => import('./pages/LinkInBio'));

// Streamlined Signup (lazy loaded)
const SignupFromLink = lazy(() => import('./pages/SignupFromLink'));

// Link-in-Bio dedicated pages (lazy loaded)
const LinkInBioChat = lazy(() => import('./pages/LinkInBioChat'));
const LinkInBioProposal = lazy(() => import('./pages/LinkInBioProposal'));

// Invoice (shared page, lazy loaded)
const InvoiceView = lazy(() => import('./pages/InvoiceView'));

// Incomplete Profile & Verification (root routes, lazy loaded)
const IncompleteProfile = lazy(() => import('./pages/IncompleteProfile'));
const Verification = lazy(() => import('./pages/Verification'));

// ============================================
// LOADING COMPONENT
// ============================================

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
    </div>
  );
}

// ============================================
// WRAPPER FOR LAZY ROUTES
// ============================================

function LazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoader />}>{children}</Suspense>;
}

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
  requiredRole?: 'influencer' | 'promoter' | 'admin';
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
    if (user?.roles.includes('admin')) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user?.roles.includes('influencer')) {
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
      <ToastContainer />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/signup/influencer" element={<InfluencerSignup />} />
        <Route path="/signup/promoter" element={<PromoterSignup />} />

        {/* Auth Redirect - handles root auth flow */}
        <Route path="/auth-redirect" element={<AuthRedirect />} />

        {/* Standalone Invoice View (auth required, no sidebar/header) */}
        <Route
          path="/invoice/:proposalId/:invoiceType"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <InvoiceView />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Link-in Bio - public page (no auth required) */}
        <Route
          path="/link/:username"
          element={
            <LazyRoute>
              <LinkInBio />
            </LazyRoute>
          }
        />

        {/* Link-in-Bio dedicated pages - standalone chat and proposal (auth required) */}
        <Route
          path="/link/:username/chat"
          element={
            <LazyRoute>
              <LinkInBioChat />
            </LazyRoute>
          }
        />
        <Route
          path="/link/:username/proposal"
          element={
            <LazyRoute>
              <LinkInBioProposal />
            </LazyRoute>
          }
        />

        {/* Incomplete Profile - root route (auth required) */}
        <Route
          path="/incomplete-profile"
          element={
            <LazyRoute>
              <IncompleteProfile />
            </LazyRoute>
          }
        />

        {/* Verification - root route (auth required) */}
        <Route
          path="/verification"
          element={
            <LazyRoute>
              <Verification />
            </LazyRoute>
          }
        />

        {/* Streamlined Signup from Link-in Bio */}
        <Route
          path="/signup-from-link"
          element={
            <LazyRoute>
              <SignupFromLink />
            </LazyRoute>
          }
        />

        {/* Public Profiles - accessible to anyone (lazy loaded) */}
        <Route
          path="/influencers/:uid"
          element={
            <LazyRoute>
              <InfluencerPublicProfile />
            </LazyRoute>
          }
        />

        <Route
          path="/promoters/:uid"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <PromoterProfileView />
              </LazyRoute>
            </ProtectedRoute>
          }
        />

        {/* Influencer Routes with Layout - Lazy Loaded */}
        <Route
          path="/influencer/*"
          element={
            <ProtectedRoute requiredRole="influencer">
              <LazyRoute>
                <InfluencerLayout />
              </LazyRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <LazyRoute>
                <InfluencerDashboard />
              </LazyRoute>
            }
          />
          <Route
            path="proposals"
            element={
              <LazyRoute>
                <InfluencerProposals />
              </LazyRoute>
            }
          />
          <Route
            path="proposals/:proposalId"
            element={
              <LazyRoute>
                <InfluencerProposals />
              </LazyRoute>
            }
          />
          <Route
            path="proposals/:proposalId/invoice/:invoiceType"
            element={
              <LazyRoute>
                <InvoiceView />
              </LazyRoute>
            }
          />
          <Route
            path="messages/:promoterId?/:proposalId?"
            element={
              <LazyRoute>
                <InfluencerMessages />
              </LazyRoute>
            }
          />
          <Route
            path="earnings"
            element={
              <LazyRoute>
                <InfluencerEarnings />
              </LazyRoute>
            }
          />
          <Route
            path="profile"
            element={
              <LazyRoute>
                <InfluencerProfile />
              </LazyRoute>
            }
          />
          <Route
            path="business-profile"
            element={
              <LazyRoute>
                <InfluencerBusinessProfile />
              </LazyRoute>
            }
          />
          <Route
            path="link-bio"
            element={
              <LazyRoute>
                <InfluencerLinkInBioSettings />
              </LazyRoute>
            }
          />
          <Route
            path="settings"
            element={
              <LazyRoute>
                <InfluencerSettings />
              </LazyRoute>
            }
          />
          <Route
            path="verification-tasks"
            element={
              <LazyRoute>
                <InfluencerVerificationTasks />
              </LazyRoute>
            }
          />
        </Route>

        {/* Promoter Routes with Layout - Lazy Loaded */}
        <Route
          path="/promoter/*"
          element={
            <ProtectedRoute requiredRole="promoter">
              <LazyRoute>
                <PromoterLayout />
              </LazyRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <LazyRoute>
                <PromoterDashboard />
              </LazyRoute>
            }
          />
          <Route
            path="browse"
            element={
              <LazyRoute>
                <PromoterBrowse />
              </LazyRoute>
            }
          />
          <Route
            path="proposals"
            element={
              <LazyRoute>
                <PromoterProposals />
              </LazyRoute>
            }
          />
          <Route
            path="proposals/:proposalId"
            element={
              <LazyRoute>
                <PromoterProposals />
              </LazyRoute>
            }
          />
          <Route
            path="proposals/:proposalId/invoice/:invoiceType"
            element={
              <LazyRoute>
                <InvoiceView />
              </LazyRoute>
            }
          />
          <Route
            path="proposals/:proposalId/edit"
            element={
              <LazyRoute>
                <PromoterProposals />
              </LazyRoute>
            }
          />
          <Route
            path="messages/:influencerId?/:proposalId?"
            element={
              <LazyRoute>
                <PromoterMessages />
              </LazyRoute>
            }
          />
          <Route
            path="profile"
            element={
              <LazyRoute>
                <PromoterProfile />
              </LazyRoute>
            }
          />
          <Route
            path="business-profile"
            element={
              <LazyRoute>
                <PromoterBusinessProfile />
              </LazyRoute>
            }
          />
          <Route
            path="settings"
            element={
              <LazyRoute>
                <PromoterSettings />
              </LazyRoute>
            }
          />
        </Route>

        {/* Admin Routes with Layout - Lazy Loaded */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <LazyRoute>
                <AdminLayout />
              </LazyRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <LazyRoute>
                <AdminDashboard />
              </LazyRoute>
            }
          />
          <Route
            path="influencers"
            element={
              <LazyRoute>
                <AdminInfluencers />
              </LazyRoute>
            }
          />
          <Route
            path="promoters"
            element={
              <LazyRoute>
                <AdminPromoters />
              </LazyRoute>
            }
          />
          <Route
            path="verifications"
            element={
              <LazyRoute>
                <AdminVerifications />
              </LazyRoute>
            }
          />
          <Route
            path="verification-tasks"
            element={
              <LazyRoute>
                <AdminVerificationTasks />
              </LazyRoute>
            }
          />
          <Route
            path="verification-tasks/:taskId"
            element={
              <LazyRoute>
                <AdminTaskDetail />
              </LazyRoute>
            }
          />
          <Route
            path="dashboard-messages"
            element={
              <LazyRoute>
                <AdminDashboardMessages />
              </LazyRoute>
            }
          />
          <Route
            path="settings"
            element={
              <LazyRoute>
                <AdminSettings />
              </LazyRoute>
            }
          />
        </Route>

        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
