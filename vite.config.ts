import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - third-party libraries
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }

            // Firebase - separate chunk for Firebase SDKs
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }

            // Zustand
            if (id.includes('zustand')) {
              return 'vendor-zustand';
            }

            // Date utilities (date-fns)
            if (id.includes('date-fns')) {
              return 'vendor-date-fns';
            }

            // Other vendor code
            return 'vendor';
          }

          // Application code chunks
          if (id.includes('/src/')) {
            // Firebase config and initialization
            if (id.includes('/lib/firebase')) {
              return 'firebase-config';
            }

            // Auth store - used everywhere
            if (id.includes('/stores/authStore')) {
              return 'store-auth';
            }

            // Chat store - only used in messaging
            if (id.includes('/stores/chatStore')) {
              return 'store-chat';
            }

            // Hooks
            if (id.includes('/hooks/')) {
              if (id.includes('useAuth')) {
                return 'hook-auth';
              }
              if (id.includes('useChat')) {
                return 'hook-chat';
              }
              if (id.includes('useProposal')) {
                return 'hook-proposal';
              }
              return 'hooks';
            }

            // Public pages - bundle together for landing/login
            if (id.includes('/pages/Landing') ||
                id.includes('/pages/Login') ||
                id.includes('/pages/RoleSelection') ||
                id.includes('/pages/InfluencerSignup') ||
                id.includes('/pages/PromoterSignup')) {
              return 'public-pages';
            }

            // Layouts
            if (id.includes('/components/layout/')) {
              if (id.includes('InfluencerLayout')) {
                return 'layout-influencer';
              }
              if (id.includes('PromoterLayout')) {
                return 'layout-promoter';
              }
              if (id.includes('AdminLayout')) {
                return 'layout-admin';
              }
              return 'layouts';
            }

            // Chat components
            if (id.includes('/components/chat/')) {
              return 'chat-components';
            }

            // Proposal components
            if (id.includes('/components/proposal/')) {
              return 'proposal-components';
            }

            // Influencer pages
            if (id.includes('/pages/influencer/')) {
              return 'pages-influencer';
            }

            // Promoter pages
            if (id.includes('/pages/promoter/')) {
              return 'pages-promoter';
            }

            // Admin pages
            if (id.includes('/pages/admin/')) {
              return 'pages-admin';
            }

            // Public profile pages
            if (id.includes('/pages/InfluencerPublicProfile') ||
                id.includes('/pages/PromoterPublicProfile')) {
              return 'public-profiles';
            }
          }
        }
      }
    }
  }
})
