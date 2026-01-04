// ============================================
// LOGIN PAGE
// ============================================

import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useGoogleSignIn } from '../hooks/useAuth';
import { useAuthStore } from '../stores';
import Logo from '../components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithGoogle } = useGoogleSignIn();
  const { isAuthenticated, isLoading, error, user } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if there's a redirect from link-in bio via query params
      const redirect = searchParams.get('redirect');
      const action = searchParams.get('action');
      const username = searchParams.get('username');

      if (redirect && action && username) {
        // User came from link-in bio, pass query params to signup-from-link
        navigate(`/signup-from-link?redirect=${encodeURIComponent(redirect)}&action=${action}&username=${username}`, { replace: true });
        return;
      }

      // Check if user has completed profile setup
      if (user.profileComplete && user.activeRole) {
        // Redirect to appropriate dashboard based on active role
        if (user.activeRole === 'influencer') {
          navigate('/influencer/dashboard', { replace: true });
        } else if (user.activeRole === 'promoter') {
          navigate('/promoter/dashboard', { replace: true });
        } else {
          // Only show role selection if user has multiple roles
          navigate('/role-selection', { replace: true });
        }
      } else if (user.roles && user.roles.length > 0) {
        // User has roles but profile incomplete - go to first role's signup
        navigate(`/signup/${user.roles[0]}`, { replace: true });
      } else {
        // New user - no role selected yet
        navigate('/role-selection', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Auth state listener will handle redirect
    } catch (error) {
      console.error('Sign-in error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9FF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <Logo size="lg" />
          <p className="text-gray-400 text-xl pl-2">The Collab Workspace</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
          <h2 className="text-2xl font-semibold text-white mb-2">Welcome back</h2>
          <p className="text-gray-400 mb-8">Sign in to continue to your dashboard</p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium py-3.5 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-[#00D9FF] hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-[#00D9FF] hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-gray-500 hover:text-white transition-colors text-sm">
            ← Back to home
          </Link>
        </div>

      </div>
    </div>
  );
}
