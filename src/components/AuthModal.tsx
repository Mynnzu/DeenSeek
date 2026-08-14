import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, UserPlus, Mail, Lock, User as UserIcon, AlertCircle, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  syncUserProfile 
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
        onClose();
      }
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        try {
          // Fallback to redirect if popup is blocked
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          setError(redirectErr.message || 'Google sign-in popup was blocked. Please allow popups.');
        }
      } else {
        setError(err.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName && userCred.user) {
          await updateProfile(userCred.user, { displayName });
        }
        await syncUserProfile(userCred.user);
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        await syncUserProfile(userCred.user);
      }
      onClose();
    } catch (err: any) {
      console.error('Email Auth error:', err);
      let friendlyMsg = 'An error occurred during authentication.';
      if (err.code === 'auth/email-already-in-use') {
        friendlyMsg = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        friendlyMsg = 'Invalid email or password credentials.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMsg = 'Password should be at least 6 characters.';
      } else if (err.message) {
        friendlyMsg = err.message;
      }
      setError(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        {/* Backdrop overlay */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white rounded-3xl shadow-2xl border border-[#e5e5e0] max-w-md w-full overflow-hidden z-10 p-6 md:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#f5f5f0] text-gray-500 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#064e3b]/10 text-[#064e3b] rounded-2xl mb-1 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-[#064e3b]">
              {mode === 'signin' ? 'Welcome Back to DeenSeek' : 'Create Your Account'}
            </h2>
            <p className="text-xs text-[#6b7280]">
              Sign in to save your Islamic Q&A chat history safely across devices
            </p>
          </div>

          {/* Google Sign In Button */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-[#d1d5db] hover:bg-[#f9fafb] text-gray-700 font-semibold text-sm rounded-xl transition-all shadow-xs disabled:opacity-50"
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
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#e5e5e0] w-full" />
              <span className="bg-white px-3 text-[10px] uppercase tracking-widest font-bold text-gray-400 absolute">
                or email
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Display Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Ahmad"
                      className="w-full bg-[#f9f9f7] border border-[#e5e5e0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#f9f9f7] border border-[#e5e5e0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#f9f9f7] border border-[#e5e5e0] rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 focus:border-[#064e3b]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-[#064e3b] hover:bg-[#053e2f] text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {mode === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              </button>
            </form>

            {/* Toggle Mode Footer */}
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                  }}
                  className="font-bold text-[#064e3b] hover:underline"
                >
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
