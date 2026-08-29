import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Database, 
  BrainCircuit, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  FileText,
  Mail,
  KeyRound,
  User,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { 
  signInWithGoogle, 
  signInWithApple, 
  signInWithEmail, 
  signUpWithEmail 
} from '../lib/firebase';

interface LandingPageProps {
  onSignInSuccess: () => void;
  onError: (msg: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignInSuccess, onError }) => {
  const [authMethod, setAuthMethod] = useState<'google' | 'apple' | 'email-signin' | 'email-signup'>('google');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Email/Password form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setAuthError(null);
      setIsLoading(true);
      setAuthMethod('google');
      const user = await signInWithGoogle();
      if (user) {
        onSignInSuccess();
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      
      if (err.code === 'auth/popup-blocked') {
        onError('Pop-up was blocked by your browser. Please allow pop-ups for this site or open in a new window to sign in.');
        return;
      }

      console.warn('Google Sign-in notification:', err?.message || err);
      setAuthError(err?.message || 'Google authentication failed. Please try again.');
      onError(err?.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setAuthError(null);
      setIsLoading(true);
      setAuthMethod('apple');
      const user = await signInWithApple();
      if (user) {
        onSignInSuccess();
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }

      if (err.code === 'auth/operation-not-allowed') {
        const msg = 'Apple Sign-In is not yet enabled in Firebase Authentication. You can enable Apple in the Firebase Console under Authentication > Sign-in method, or sign in using Google or Email.';
        setAuthError(msg);
        onError(msg);
        return;
      }

      console.warn('Apple Sign-in notification:', err?.message || err);
      setAuthError(err?.message || 'Apple Sign-In failed.');
      onError(err?.message || 'Apple Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email.trim() || !email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsLoading(true);
      if (activeTab === 'signin') {
        setAuthMethod('email-signin');
        const user = await signInWithEmail(email, password);
        if (user) onSignInSuccess();
      } else {
        setAuthMethod('email-signup');
        const user = await signUpWithEmail(email, password, displayName);
        if (user) onSignInSuccess();
      }
    } catch (err: any) {
      console.warn('Email auth notification:', err?.message || err);
      setAuthError(err?.message || 'Authentication failed. Please check your credentials.');
      onError(err?.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#202928] flex flex-col justify-between selection:bg-[#E8DCC4] selection:text-[#1A2826]">
      {/* Header Bar */}
      <header className="border-b border-[#EAE4DC] bg-[#FAF7F2]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2D4A43] to-[#40695E] flex items-center justify-center text-[#FDFBF7] shadow-xs border border-[#2D4A43]/20">
              <Sparkles className="w-5 h-5 text-[#E6C994]" />
            </div>
            <div>
              <span className="text-2xl font-serif font-bold tracking-tight text-[#1C2927]">ReflectAI</span>
              <span className="hidden sm:inline-block ml-2.5 text-[11px] font-sans font-semibold px-2.5 py-0.5 rounded-full bg-[#EAE2D5] text-[#4A3B32] border border-[#DCD3C4]">
                Gemini 3.6 Flash
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="header-google-sign-in-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#202E2B] text-[#FAF7F2] hover:bg-[#2C3E3A] transition-all shadow-xs disabled:opacity-50 border border-[#202E2B]"
            >
              {isLoading && authMethod === 'google' ? (
                <span className="flex items-center space-x-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero & Auth Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EAE3D2] border border-[#D9CEBA] text-[#423326] text-xs font-semibold mb-6 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-[#8C5E3C]" />
          <span>Multi-Provider Authentication &amp; User-Isolated Cloud Firestore</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-[#182624] max-w-3xl leading-[1.15]">
          Your Private Multi-Turn <span className="italic font-normal text-[#9C4124]">Reflection Journal</span> Powered by Gemini
        </h1>

        <p className="mt-4 text-base sm:text-lg font-sans text-[#525B58] max-w-2xl leading-relaxed">
          Write freely, process complex decisions, untangle blind spots, and converse with Gemini. Every reflection is securely stored in your personal, isolated Firestore document store.
        </p>

        {/* Auth Interface Card */}
        <div className="mt-10 w-full max-w-md bg-[#FFFFFF] border border-[#E8E2D8] rounded-2xl shadow-md p-6 sm:p-8 text-left transition-all">
          <div className="mb-6">
            <h2 className="text-xl font-serif font-bold text-[#182624]">Welcome to ReflectAI</h2>
            <p className="text-xs font-sans text-[#737C78] mt-1">Sign in or create an account to start your cognitive journal.</p>
          </div>

          {/* Social Provider Buttons */}
          <div className="space-y-3">
            {/* Google Sign-In */}
            <button
              id="auth-google-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 text-sm font-semibold rounded-xl bg-[#FFFFFF] hover:bg-[#F9F7F4] text-[#2C241E] border border-[#DCD3C4] shadow-2xs transition-all flex items-center justify-center space-x-3 disabled:opacity-50 cursor-pointer"
            >
              {isLoading && authMethod === 'google' ? (
                <span className="w-4 h-4 border-2 border-[#2D4A43]/30 border-t-[#2D4A43] rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Apple Sign-In */}
            <button
              id="auth-apple-btn"
              type="button"
              onClick={handleAppleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 text-sm font-semibold rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-[#FFFFFF] shadow-2xs transition-all flex items-center justify-center space-x-3 disabled:opacity-50 cursor-pointer"
            >
              {isLoading && authMethod === 'apple' ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.79-11.89-14.24-5.35-8.21-9.69-17.6-13.02-28.17-3.33-10.57-5-20.67-5-30.3 0-12.87 3.33-23.75 10-32.64 6.67-8.89 15.11-13.39 25.32-13.5 4.58 0 9.77 1.25 15.58 3.75 5.81 2.5 9.77 3.79 11.88 3.86 1.76 0 5.86-1.37 12.31-4.11 6.45-2.73 12.18-3.92 17.19-3.57 13.06.84 23.36 5.62 30.91 14.34-11.45 6.94-17.07 16.5-16.86 28.69.21 9.47 3.84 17.38 10.9 23.73 7.06 6.35 15.34 9.94 24.84 10.77-2.34 7.22-5.35 14.54-9.03 21.96zM119.22 31.84c0-7.07 2.58-13.68 7.74-19.83 5.16-6.15 11.53-9.98 19.12-11.5-.1 1.09-.26 2.06-.47 2.91-.74 3.7-2.31 7.28-4.7 10.75-2.39 3.47-5.38 6.31-8.98 8.52-3.6 2.21-7.24 3.59-10.92 4.14-.32-1.63-.79-3.29-1.79-4.99z" />
                  </svg>
                  <span>Continue with Apple</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EAE4DC]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#FFFFFF] px-3 text-[#A69D92] font-semibold tracking-wider">or with email</span>
            </div>
          </div>

          {/* Tabs for Sign In vs Sign Up */}
          <div className="flex border-b border-[#EAE4DC] mb-5">
            <button
              id="tab-signin-btn"
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setAuthError(null);
              }}
              className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
                activeTab === 'signin'
                  ? 'border-[#2D4A43] text-[#2D4A43]'
                  : 'border-transparent text-[#8C7E72] hover:text-[#4A3B32]'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-signup-btn"
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setAuthError(null);
              }}
              className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
                activeTab === 'signup'
                  ? 'border-[#2D4A43] text-[#2D4A43]'
                  : 'border-transparent text-[#8C7E72] hover:text-[#4A3B32]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message Box */}
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-[#FDF2F0] border border-[#F5D5D0] text-[#9C4124] text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{authError}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {activeTab === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">Your Name (Optional)</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#A69D92] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-name-input"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#DCD3C4] rounded-xl focus:border-[#2D4A43] focus:bg-[#FFFFFF] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A69D92] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#DCD3C4] rounded-xl focus:border-[#2D4A43] focus:bg-[#FFFFFF] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A3B32] mb-1.5">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#A69D92] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={activeTab === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#DCD3C4] rounded-xl focus:border-[#2D4A43] focus:bg-[#FFFFFF] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A69D92] hover:text-[#4A3B32] focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 text-sm font-bold rounded-xl bg-[#2D4A43] hover:bg-[#233A34] text-[#FAF7F2] shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50 border border-[#233A34] cursor-pointer"
            >
              {isLoading && (authMethod === 'email-signin' || authMethod === 'email-signup') ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{activeTab === 'signin' ? 'Sign In with Email' : 'Create ReflectAI Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D8] shadow-xs flex flex-col justify-between hover:border-[#D5C9B8] transition-colors">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#F0EBE1] text-[#3D5A4C] flex items-center justify-center mb-4 border border-[#E4DCD0]">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#182624] mb-2">Gemini 3.6 Flash Engine</h3>
              <p className="text-sm font-sans text-[#5A6360] leading-relaxed">
                Multi-turn conversation with dynamic modes: Socratic mirror, creative brainstorming, executive synthesis, and 10/10/10 decision matrix simulations.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#F0EBE1] flex items-center text-xs font-semibold text-[#2D4A43]">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-[#3D5A4C]" /> High-availability model ladder
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D8] shadow-xs flex flex-col justify-between hover:border-[#D5C9B8] transition-colors">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#F3ECE6] text-[#8C5E3C] flex items-center justify-center mb-4 border border-[#E5D8CD]">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#182624] mb-2">Strict User Data Isolation</h3>
              <p className="text-sm font-sans text-[#5A6360] leading-relaxed">
                All reflections, voice streams, and decision plans are written directly to your dedicated Firestore subcollection (<code className="text-xs bg-[#F0EBE1] px-1.5 py-0.5 rounded text-[#362C26] border border-[#E0D7CB]">/users/{'{userId}'}/interactions</code>).
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#F0EBE1] flex items-center text-xs font-semibold text-[#8C5E3C]">
              <Lock className="w-4 h-4 mr-1.5" /> Owner-bound security rules
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D8] shadow-xs flex flex-col justify-between hover:border-[#D5C9B8] transition-colors">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#EBECE7] text-[#4A5D54] flex items-center justify-center mb-4 border border-[#DCE0DA]">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#182624] mb-2">Cognitive Radar &amp; History</h3>
              <p className="text-sm font-sans text-[#5A6360] leading-relaxed">
                Analyze recurring mental habits and growth trajectories across journal entries, seal future-self time capsules, and search your entire reflection archive.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-[#F0EBE1] flex items-center text-xs font-semibold text-[#3D5A4C]">
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Permanent cloud synchronization
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EAE4DC] bg-[#FAF7F2] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#737C78] gap-4">
          <div className="flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-[#8C5E3C]" />
            <span>Secure Authentication via Firebase Auth (Google, Apple, &amp; Email).</span>
          </div>
          <div className="font-serif">ReflectAI &bull; Cloud Run &bull; Firestore &bull; Gemini API</div>
        </div>
      </footer>
    </div>
  );
};

