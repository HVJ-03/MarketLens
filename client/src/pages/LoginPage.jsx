import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const { user, login, loginWithGoogle, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) return <Navigate to="/dashboard" replace />;

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // Error mapped in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    clearError();
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch {
      // Error mapped in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@marketlens.com');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        {/* Architectural Brand Header */}
        <div className="text-center">
          <div className="w-9 h-9 rounded-md bg-white/[0.08] border border-white/20 mx-auto flex items-center justify-center text-white mb-3 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 21l-4.35-4.35" />
              <circle cx="11" cy="11" r="8" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            MarketLens Terminal
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Access evidence-backed commerce market intelligence
          </p>
        </div>

        {/* Card */}
        <div className="card-panel p-6 shadow-2xl">
          {/* Quick Demo Credentials Autofill Banner */}
          <div className="mb-5 p-3 rounded-md bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-white">Demo Account Ready</p>
              <p className="text-[11px] font-mono text-neutral-400">demo@marketlens.com</p>
            </div>
            <button
              id="demo-fill-button"
              type="button"
              onClick={handleFillDemo}
              className="text-xs px-2.5 py-1 rounded bg-white/[0.08] hover:bg-white/15 text-white border border-white/15 hover:border-white/30 transition-all cursor-pointer font-medium"
            >
              Fill Credentials
            </button>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="input-label">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="input-field text-xs"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="input-label mb-0">Password</label>
                <span className="text-[10px] font-mono text-neutral-500">MIN 6 CHARS</span>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={6}
                className="input-field text-xs font-mono"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-md text-xs font-mono bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-2">
                <span className="text-rose-400 mt-0.5">!</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button (NO COLOR FILL, NO PILL SHAPE) */}
            <button
              id="login-button"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs font-semibold uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Authenticating…
                </>
              ) : (
                'Sign In with Credentials'
              )}
            </button>

            {/* Divider */}
            <div className="relative py-2 flex items-center justify-center">
              <div className="w-full border-t border-white/[0.08]" />
              <span className="absolute px-2 bg-[#0e1117] text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                or
              </span>
            </div>

            {/* Google Authentication Option */}
            <button
              id="google-login-button"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-500">
          Need an account?{' '}
          <Link to="/signup" className="text-neutral-300 hover:text-white underline underline-offset-4 font-medium transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
