// ============================================
// DEMO ROUTES COMPONENT
// ============================================

import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Demo Index
const DemoIndex = lazy(() => import('../../pages/demo/Index'));

// Link-in-Bio Flow
const LinkBioInstagram = lazy(() => import('../../pages/demo/linkbio/Instagram'));
const LinkBioProfile = lazy(() => import('../../pages/demo/linkbio/Profile'));
const LinkBioChat = lazy(() => import('../../pages/demo/linkbio/Chat'));
const LinkBioProposal = lazy(() => import('../../pages/demo/linkbio/Proposal'));

// Loading Component
function DemoLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
    </div>
  );
}

// Wrapper for lazy routes
function DemoLazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<DemoLoader />}>{children}</Suspense>;
}

export default function DemoRoutes() {
  return (
    <Routes>
      {/* Demo Hub */}
      <Route
        index
        element={
          <DemoLazyRoute>
            <DemoIndex />
          </DemoLazyRoute>
        }
      />

      {/* Link-in-Bio Flow */}
      <Route
        path="linkbio/instagram"
        element={
          <DemoLazyRoute>
            <LinkBioInstagram />
          </DemoLazyRoute>
        }
      />
      <Route
        path="linkbio/profile"
        element={
          <DemoLazyRoute>
            <LinkBioProfile />
          </DemoLazyRoute>
        }
      />
      <Route
        path="linkbio/chat"
        element={
          <DemoLazyRoute>
            <LinkBioChat />
          </DemoLazyRoute>
        }
      />
      <Route
        path="linkbio/proposal"
        element={
          <DemoLazyRoute>
            <LinkBioProposal />
          </DemoLazyRoute>
        }
      />
    </Routes>
  );
}
