import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Zap,
  Chrome
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  syncUserProfile,
  getEmailByUsername
} from './firebase';

interface AuthPageProps {
  onSuccess: () => void;
  onSwitch: () => void;
}

export const LoginPage = ({ onSuccess, onSwitch }: AuthPageProps) => {
  const [identifier, setIdentifier] = useState(''); // username or email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let email = identifier;
      // Check if it's a username (doesn't contain @)
      if (!identifier.includes('@')) {
        const foundEmail = await getEmailByUsername(identifier);
        if (!foundEmail) {
          throw new Error('Username not found.');
        }
        email = foundEmail;
      }

      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to login.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Google login failed.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-black rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800 transition-colors duration-300"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black dark:bg-white rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
            <Zap className="text-white dark:text-black w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight dark:text-white">Welcome Back</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Log in to access your summaries</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Username or Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600" />
              <input 
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent outline-none transition-all text-sm dark:text-white"
                placeholder="johndoe or john@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent outline-none transition-all text-sm dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Login <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
            <span className="bg-white dark:bg-black px-4 text-gray-400 dark:text-gray-500 transition-colors duration-300">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-100 dark:border-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all font-medium text-sm dark:text-white"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          Login with Google
        </button>

        <p className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <button onClick={onSwitch} className="text-black dark:text-white font-bold hover:underline">Sign up</button>
        </p>
      </motion.div>
    </div>
  );
};

export const SignUpPage = ({ onSuccess, onSwitch }: AuthPageProps) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Check if username is taken
      const existingEmail = await getEmailByUsername(username);
      if (existingEmail) {
        throw new Error('Username is already taken.');
      }

      // 2. Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Update profile with username
      await updateProfile(user, { displayName: username });

      // 4. Sync to Firestore
      await syncUserProfile(user, username);

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign up.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Google sign up failed.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-black rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800 transition-colors duration-300"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black dark:bg-white rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
            <Zap className="text-white dark:text-black w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight dark:text-white">Create Account</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Start summarizing the web today</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600" />
              <input 
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent outline-none transition-all text-sm dark:text-white"
                placeholder="johndoe"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent outline-none transition-all text-sm dark:text-white"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent outline-none transition-all text-sm dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign Up <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
            <span className="bg-white dark:bg-black px-4 text-gray-400 dark:text-gray-500 transition-colors duration-300">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleSignUp}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-100 dark:border-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all font-medium text-sm dark:text-white"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          Sign Up with Google
        </button>

        <p className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <button onClick={onSwitch} className="text-black dark:text-white font-bold hover:underline">Login</button>
        </p>
      </motion.div>
    </div>
  );
};
