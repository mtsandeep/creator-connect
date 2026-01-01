import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Single vendor chunk - all third-party libraries together
          if (id.includes('node_modules')) {
            return 'vendor';
          }

          // Application code chunks - simplified grouping
          if (id.includes('/src/')) {
            // Public pages
            if (id.includes('/pages/Landing') ||
                id.includes('/pages/Login') ||
                id.includes('/pages/RoleSelection') ||
                id.includes('/pages/InfluencerSignup') ||
                id.includes('/pages/PromoterSignup')) {
              return 'public-pages';
            }

            // Influencer pages + layout
            if (id.includes('/pages/influencer/') || id.includes('/components/layout/InfluencerLayout')) {
              return 'influencer';
            }

            // Promoter pages + layout
            if (id.includes('/pages/promoter/') || id.includes('/components/layout/PromoterLayout')) {
              return 'promoter';
            }

            // Admin pages + layout
            if (id.includes('/pages/admin/') || id.includes('/components/layout/AdminLayout')) {
              return 'admin';
            }

            // Chat components and pages
            if (id.includes('/components/chat/') || id.includes('/hooks/useChat') || id.includes('/stores/chatStore')) {
              return 'chat';
            }

            // Proposal components and hooks
            if (id.includes('/components/proposal/') || id.includes('/hooks/useProposal')) {
              return 'proposal';
            }

            // Public profiles
            if (id.includes('/pages/InfluencerPublicProfile') ||
                id.includes('/pages/PromoterPublicProfile')) {
              return 'public-profiles';
            }

            // Shared auth store and hook
            if (id.includes('/stores/authStore') || id.includes('/hooks/useAuth') || id.includes('/lib/firebase')) {
              return 'auth';
            }
          }
        }
      }
    }
  }
})
