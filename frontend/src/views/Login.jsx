import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, RefreshCw, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login, forgotPassword, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // If already authenticated, redirect to dashboard automatically
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter both email and password.');
    }

    try {
      setLoading(true);
      const res = await login(email, password);
      if (res.success) {
        toast.success('Login successful! Welcome back.');
        window.location.replace('/');
      } else {
        toast.error(res.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      return toast.error('Please enter your email address.');
    }

    try {
      setResetLoading(true);
      const res = await forgotPassword(resetEmail);
      if (res.success) {
        toast.success(res.message || 'Password reset link sent to your email.');
        setForgotMode(false);
        setResetEmail('');
      } else {
        toast.error(res.error || 'Failed to send reset email.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-navy-800/40 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-gold-950/20 blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500 text-navy-900 font-extrabold text-3xl shadow-xl shadow-gold-500/10 mb-4 font-ethiopic">
            ጽ
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide font-ethiopic">
            Zion Choir Admin
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {forgotMode ? 'Recover your administrator session' : 'Sign in to access your dashboard'}
          </p>
        </div>

        {/* Form Panel */}
        <div className="bg-navy-900/60 backdrop-blur-md border border-navy-800/80 rounded-3xl p-8 shadow-2xl shadow-black/40">
          
          {!forgotMode ? (
            /* Login Mode Form */
            <form onSubmit={handleLogin} className="space-y-6">
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@zionchoir.org"
                    className="w-full bg-navy-950/60 text-white placeholder-slate-500 pl-11 pr-4 py-3.5 rounded-xl border border-navy-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-xs text-gold-400 hover:text-gold-300 font-semibold transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-navy-950/60 text-white placeholder-slate-500 pl-11 pr-4 py-3.5 rounded-xl border border-navy-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold-500 text-navy-950 hover:bg-gold-400 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-gold-500/10 hover:shadow-gold-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          ) : (
            /* Forgot Password Mode Form */
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="flex items-start space-x-3 bg-gold-500/10 border border-gold-500/20 rounded-2xl p-4 text-xs text-gold-300 leading-relaxed font-medium">
                <KeyRound size={20} className="flex-shrink-0 text-gold-400 mt-0.5" />
                <span>
                  Enter your email. If matching account exists, we will send reset instructions. Ensure your SMTP endpoints are configured in Supabase.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Account Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@zionchoir.org"
                    className="w-full bg-navy-950/60 text-white placeholder-slate-500 pl-11 pr-4 py-3.5 rounded-xl border border-navy-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-gold-500 text-navy-950 hover:bg-gold-400 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2 focus:outline-none"
                >
                  {resetLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Sending reset email...</span>
                    </>
                  ) : (
                    <span>Send Recovery Instructions</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="w-full bg-navy-950/40 text-slate-400 hover:text-white border border-navy-800 py-3 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center space-x-2 focus:outline-none"
                >
                  <ArrowLeft size={14} />
                  <span>Back to login</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-500 font-medium">
          <span>Protected Administrative Space. Authorized Access Only.</span>
        </div>

      </div>
    </div>
  );
};

export default Login;
