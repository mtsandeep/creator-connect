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
const LinkBioPreview = lazy(() => import('../../pages/demo/linkbio-preview/Preview'));

// Brand Discover Flow
const BrandDiscoverBrowse = lazy(() => import('../../pages/demo/brand-discover/Browse'));
const BrandDiscoverProfile = lazy(() => import('../../pages/demo/brand-discover/Profile'));
const BrandDiscoverChat = lazy(() => import('../../pages/demo/brand-discover/Chat'));
const BrandDiscoverProposal = lazy(() => import('../../pages/demo/brand-discover/Proposal'));

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
      <Route
        path="linkbio-preview"
        element={
          <DemoLazyRoute>
            <LinkBioPreview />
          </DemoLazyRoute>
        }
      />

      {/* Brand Discover Flow */}
      <Route
        path="brand-discover/browse"
        element={
          <DemoLazyRoute>
            <BrandDiscoverBrowse />
          </DemoLazyRoute>
        }
      />
      <Route
        path="brand-discover/profile"
        element={
          <DemoLazyRoute>
            <BrandDiscoverProfile />
          </DemoLazyRoute>
        }
      />
      <Route
        path="brand-discover/chat"
        element={
          <DemoLazyRoute>
            <BrandDiscoverChat />
          </DemoLazyRoute>
        }
      />
      <Route
        path="brand-discover/proposal"
        element={
          <DemoLazyRoute>
            <BrandDiscoverProposal />
          </DemoLazyRoute>
        }
      />
    </Routes>
  );
}
