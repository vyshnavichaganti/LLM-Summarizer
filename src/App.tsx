/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Search, 
  FileText, 
  Link as LinkIcon, 
  Layers, 
  Download, 
  Upload, 
  Chrome, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  Globe,
  ExternalLink,
  ChevronRight,
  FileUp,
  Code,
  Terminal,
  Copy,
  Check,
  Volume2,
  Square,
  User,
  LogOut,
  Settings,
  History,
  LayoutDashboard,
  Camera,
  Upload as UploadIcon,
  Trash2,
  Edit3,
  X,
  RefreshCw,
  Save,
  Menu,
  Bell,
  Shield,
  Palette,
  Key,
  CreditCard,
  Lock,
  Globe as GlobeIcon,
  CheckSquare,
  Square as SquareIcon,
  Share2,
  Share,
  Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import Markdown from 'react-markdown';
import { Toaster, toast } from 'sonner';
import { summarizeUrl, summarizeDocument, summarizeText, generateCodeFromContent, translateText, translateSummaryResult, generateSpeech, SummaryResult, GeneratedCode } from './services/geminiService';
import { cn } from './lib/utils';
import { Languages } from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  syncUserProfile, 
  FirebaseUser, 
  saveSummary, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  db, 
  updateProfile, 
  updateUserProfile,
  getUserProfile,
  deleteSummary,
  deleteMultipleSummaries,
  getSummaryByShareId,
  toggleSummaryPublicStatus
} from './firebase';
import { LoginPage, SignUpPage } from './AuthPages';

// --- Components ---

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  isDeleting 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string,
  isDeleting: boolean
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-zinc-800"
          >
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              {message}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 px-6 py-4 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 px-6 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const SharedSummaryPage = ({ summary, onBack }: { summary: any, onBack: () => void }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors group"
        >
          <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-widest text-xs">Back to App</span>
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-[48px] p-8 md:p-12 shadow-2xl border border-gray-100 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Shared Summary
                </div>
                <div className="text-gray-400 dark:text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                  {summary.type}
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter dark:text-white leading-none">
                {summary.title}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500 mb-6 flex items-center gap-2">
                  <div className="w-8 h-[1px] bg-gray-200 dark:bg-zinc-800" />
                  Executive Summary
                </h2>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <Markdown>{summary.summary}</Markdown>
                </div>
              </section>

              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500 mb-8 flex items-center gap-2">
                  <div className="w-8 h-[1px] bg-gray-200 dark:bg-zinc-800" />
                  Key Insights
                </h2>
                <div className="grid gap-4">
                  {summary.keySections.map((section, idx) => (
                    <div key={idx} className="p-6 bg-gray-50 dark:bg-zinc-800/50 rounded-3xl border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 transition-all">
                      <h3 className="font-bold text-lg mb-2 dark:text-white">{section.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{section.content}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-12">
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500 mb-6 flex items-center gap-2">
                  <div className="w-8 h-[1px] bg-gray-200 dark:bg-zinc-800" />
                  Topics
                </h2>
                <div className="flex flex-wrap gap-2">
                  {summary.mainTopics.map((topic, idx) => (
                    <span key={idx} className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm font-bold dark:text-white shadow-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </section>

              {summary.links && summary.links.length > 0 && (
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500 mb-6 flex items-center gap-2">
                    <div className="w-8 h-[1px] bg-gray-200 dark:bg-zinc-800" />
                    Resources
                  </h2>
                  <div className="space-y-3">
                    {summary.links.map((link, idx) => (
                      <a 
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl group hover:bg-white dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-gray-200 dark:hover:border-zinc-700"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">{link.category}</span>
                          <span className="font-bold text-sm dark:text-white truncate max-w-[180px]">{link.title}</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-400 dark:text-zinc-600 text-sm font-medium mb-4">
            Generated with AI Summary App
          </p>
          <button 
            onClick={onBack}
            className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:scale-105 transition-all shadow-xl"
          >
            Create Your Own Summary
          </button>
        </div>
      </div>
    </div>
  );
};

const CodeBlock = ({ code, language, label }: { code: string, language: string, label?: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden bg-gray-900 border border-gray-800 my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{label || language}</span>
        </div>
        <button 
          onClick={copyToClipboard}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const Header = ({ user, onLogin, onSignUp, onLogout, onViewProfile, onHistory, onNavigate }: { user: FirebaseUser | null, onLogin: () => void, onSignUp: () => void, onLogout: () => void, onViewProfile: () => void, onHistory: () => void, onNavigate: (sectionId: string) => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleMobileNavigate = (sectionId: string) => {
    onNavigate(sectionId);
    setIsMenuOpen(false);
  };

  const handleMobileHistory = () => {
    onHistory();
    setIsMenuOpen(false);
  };

  const handleMobileProfile = () => {
    onViewProfile();
    setIsMenuOpen(false);
  };

  return (
    <header className="border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
            <Zap className="text-white dark:text-black w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight dark:text-white">OmniSummarize <span className="text-gray-400 dark:text-gray-500 font-medium">AI</span></span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
          <button onClick={() => onNavigate('analyzer')} className="hover:text-black dark:hover:text-white transition-colors">Analyzer</button>
          {user && (
            <>
              <button onClick={onHistory} className="hover:text-black dark:hover:text-white transition-colors">History</button>
              <button onClick={onViewProfile} className="hover:text-black dark:hover:text-white transition-colors">Dashboard</button>
            </>
          )}
          <button onClick={() => onNavigate('extension')} className="hover:text-black dark:hover:text-white transition-colors">Extension</button>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {!user ? (
              <>
                <button 
                  onClick={onLogin}
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  Login
                </button>
                <button 
                  onClick={onSignUp}
                  className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
                >
                  Get Started
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={onViewProfile}
                  className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </button>
                <button 
                  onClick={onLogout}
                  className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={toggleMenu}
            className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <button 
                onClick={() => handleMobileNavigate('analyzer')}
                className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white font-bold"
              >
                <Zap className="w-5 h-5" /> Analyzer
              </button>
              
              {user ? (
                <>
                  <button 
                    onClick={handleMobileHistory}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl hover:bg-gray-50 text-gray-600 font-bold transition-all"
                  >
                    <History className="w-5 h-5" /> History
                  </button>
                  <button 
                    onClick={handleMobileProfile}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl hover:bg-gray-50 text-gray-600 font-bold transition-all"
                  >
                    <LayoutDashboard className="w-5 h-5" /> Dashboard
                  </button>
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.displayName || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <button 
                        onClick={onLogout}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={onLogin}
                    className="px-4 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold text-center"
                  >
                    Login
                  </button>
                  <button 
                    onClick={onSignUp}
                    className="px-4 py-3 rounded-2xl bg-black text-white font-bold text-center"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const Hero = ({ onGetStarted, user }: { onGetStarted: () => void, user: FirebaseUser | null }) => (
  <section className="py-20 px-4 text-center max-w-4xl mx-auto">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-900 text-xs font-semibold text-gray-600 dark:text-gray-400 mb-6 transition-colors">
        <Chrome className="w-3 h-3" /> Browser Extension & Web Portal
      </span>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 leading-[1.1] transition-colors">
        Intelligent Summaries for the <span className="text-gray-400 dark:text-gray-500">Modern Web.</span>
      </h1>
      <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto transition-colors">
        Analyze entire web pages, PDFs, and research papers with a single click. Extract key insights and categorize links instantly.
      </p>
      {!user && (
        <button 
          onClick={onGetStarted}
          className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all flex items-center gap-2 mx-auto"
        >
          Get Started for Free <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </motion.div>
  </section>
);

const CameraCapture = ({ onCapture, onClose }: { onCapture: (image: string) => void, onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Could not access camera. Please check permissions.");
        console.error(err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        onCapture(imageData);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl max-w-md w-full transition-colors"
      >
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-xl font-bold dark:text-white">Capture Photo</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative aspect-video bg-black">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-white text-center p-8">
              <p>{error}</p>
            </div>
          ) : (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="p-6 flex justify-center gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleCapture}
            disabled={!!error}
            className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Camera className="w-4 h-4" /> Capture
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ProfileDashboard = ({ user, onNavigate, onSettings }: { user: FirebaseUser, onNavigate: (view: any) => void, onSettings: () => void }) => {
  const [stats, setStats] = useState({ total: 0, timeSaved: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.displayName || '');
  const [editPhoto, setEditPhoto] = useState(user.photoURL || '');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(user.displayName || '');
    setEditPhoto(user.photoURL || '');
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Update Firebase Auth
      await updateProfile(user, {
        displayName: editName,
        photoURL: editPhoto
      });

      // Update Firestore
      await updateUserProfile(user.uid, {
        displayName: editName,
        photoURL: editPhoto
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setEditPhoto('');
  };

  useEffect(() => {
    const q = query(
      collection(db, 'summaries'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentActivity(activities);
      setStats({
        total: snapshot.size, // This is just for the limit, better to have a separate count or use a different approach for total
        timeSaved: (snapshot.size * 15 / 60).toFixed(1) as any // Mock calculation: 15 mins saved per summary
      });
    });

    return () => unsubscribe();
  }, [user.uid]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {isCapturing && (
        <CameraCapture 
          onCapture={(img) => setEditPhoto(img)} 
          onClose={() => setIsCapturing(false)} 
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800 text-center transition-colors">
            <div className="relative group w-24 h-24 mx-auto mb-4">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-50 dark:border-zinc-800">
                {(isEditing ? editPhoto : user.photoURL) ? (
                  <img src={isEditing ? editPhoto : user.photoURL!} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <User className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                  <button 
                    onClick={() => setIsCapturing(true)}
                    className="p-1.5 bg-white dark:bg-zinc-800 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all"
                    title="Take Photo"
                  >
                    <Camera className="w-3.5 h-3.5 text-black dark:text-white" />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 bg-white dark:bg-zinc-800 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all"
                    title="Upload Photo"
                  >
                    <UploadIcon className="w-3.5 h-3.5 text-black dark:text-white" />
                  </button>
                  {editPhoto && (
                    <button 
                      onClick={handleRemovePhoto}
                      className="p-1.5 bg-white dark:bg-zinc-800 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  )}
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>

            {isEditing ? (
              <div className="space-y-3 mb-6">
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl text-center font-bold focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
                  placeholder="Your Name"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 font-bold text-xs hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-all flex items-center justify-center gap-1"
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold dark:text-white">{user.displayName || 'User'}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{user.email}</p>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 font-bold text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
                >
                  <Edit3 className="w-3 h-3" /> Edit Profile
                </button>
              </>
            )}

            <div className="space-y-2">
              <button 
                onClick={() => onNavigate('profile')}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800 text-black dark:text-white font-medium text-sm transition-all"
              >
                <LayoutDashboard className="w-4 h-4" /> Overview
              </button>
              <button 
                onClick={() => onNavigate('history')}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white font-medium text-sm transition-all"
              >
                <History className="w-4 h-4" /> History
              </button>
              <button 
                onClick={onSettings}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white font-medium text-sm transition-all"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Welcome back, {user.displayName?.split(' ')[0] || 'User'}!</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Recent Summaries</p>
                <p className="text-3xl font-bold dark:text-white">{recentActivity.length}</p>
              </div>
              <div className="p-6 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Est. Time Saved</p>
                <p className="text-3xl font-bold dark:text-white">{stats.timeSaved}h</p>
              </div>
              <div className="p-6 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Credits Left</p>
                <p className="text-3xl font-bold dark:text-white">Unlimited</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold dark:text-white">Recent Activity</h3>
              <button 
                onClick={() => onNavigate('history')}
                className="text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentActivity.length > 0 ? recentActivity.map((item, i) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-gray-100 dark:hover:border-zinc-800 group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-zinc-700 transition-all">
                      {item.type === 'URL' ? <Globe className="w-5 h-5 text-gray-400 dark:text-gray-500" /> : item.type === 'File' ? <FileUp className="w-5 h-5 text-gray-400 dark:text-gray-500" /> : <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm dark:text-white">{item.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all">
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  </button>
                </div>
              )) : (
                <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No recent activity found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface NotificationSettings {
  emailSummaries: boolean;
  activityAlerts: boolean;
  weeklyDigest: boolean;
  newFeatures: boolean;
}

interface PrivacySettings {
  publicProfile: boolean;
  dataSharing: boolean;
  searchIndexing: boolean;
}

const SettingsPage = ({ 
  user, 
  onBack, 
  theme, 
  setTheme, 
  language, 
  setLanguage,
  notificationSettings,
  setNotificationSettings,
  privacySettings,
  setPrivacySettings
}: { 
  user: FirebaseUser, 
  onBack: () => void, 
  theme: 'light' | 'dark' | 'system', 
  setTheme: (t: 'light' | 'dark' | 'system') => void,
  language: string,
  setLanguage: (l: string) => void,
  notificationSettings: NotificationSettings,
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>,
  privacySettings: PrivacySettings,
  setPrivacySettings: React.Dispatch<React.SetStateAction<PrivacySettings>>
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);

  const handleToggleNotification = async (key: string) => {
    const newSettings = {
      ...notificationSettings,
      [key as keyof NotificationSettings]: !notificationSettings[key as keyof NotificationSettings]
    };
    setNotificationSettings(newSettings);
    try {
      await updateUserProfile(user.uid, { notifications: newSettings });
      toast.success('Notification preference updated');
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Failed to update notification preference');
      // Revert on failure
      setNotificationSettings(notificationSettings);
    }
  };

  const handleTogglePrivacy = async (key: string) => {
    const newSettings = {
      ...privacySettings,
      [key as keyof PrivacySettings]: !privacySettings[key as keyof PrivacySettings]
    };
    setPrivacySettings(newSettings);
    try {
      await updateUserProfile(user.uid, { privacy: newSettings });
      toast.success('Privacy setting updated');
    } catch (error) {
      console.error('Error updating privacy:', error);
      toast.error('Failed to update privacy setting');
      // Revert on failure
      setPrivacySettings(privacySettings);
    }
  };

  const handleTestNotification = async () => {
    setTestingNotification(true);
    
    try {
      if (notificationSettings.emailSummaries) {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            subject: "Test Notification - OmniSummarize AI",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
                <div style="background: #000; color: #fff; padding: 24px; border-radius: 16px 16px 0 0;">
                  <h1 style="margin: 0; font-size: 24px;">OmniSummarize AI</h1>
                  <p style="margin: 8px 0 0; opacity: 0.7;">Test Notification</p>
                </div>
                <div style="padding: 32px; border: 1px solid #eee; border-top: none; border-radius: 0 0 16px 16px;">
                  <h2 style="margin: 0 0 16px; font-size: 20px;">Your Notification System is Working!</h2>
                  <p style="line-height: 1.6; color: #444;">
                    This is a test email to confirm that your summary notifications are correctly configured and being delivered to <strong>${user.email}</strong>.
                  </p>
                  <p style="line-height: 1.6; color: #444;">
                    From now on, every time you generate a summary, a copy will be sent directly to your inbox.
                  </p>
                  <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
                    <p>© 2026 OmniSummarize AI. All rights reserved.</p>
                  </div>
                </div>
              </div>
            `
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send test email");
        }

        toast.success("Test email sent!", {
          description: `A sample summary has been sent to ${user.email}.`,
        });
      } else {
        toast.info("Email notifications are disabled.", {
          description: "Enable 'Email Summaries' to receive test emails.",
        });
      }
      
      if (notificationSettings.activityAlerts) {
        toast.info("Activity Alert: Test notification successful.", {
          description: "Your activity alerts are working correctly.",
        });
      }
    } catch (err: any) {
      console.error("Test notification failed:", err);
      let errorMessage = "There was an issue delivering the test email.";
      
      if (err.message.includes("RESEND_API_KEY")) {
        errorMessage = "The email service is not configured. Please contact the administrator.";
      } else if (err.message.includes("unverified")) {
        errorMessage = "Email delivery failed because the sender domain is not verified in Resend.";
      } else if (err.message.includes("limit")) {
        errorMessage = "Email delivery failed: Daily sending limit reached.";
      }

      toast.error("Test notification failed", {
        description: errorMessage,
      });
    } finally {
      setTestingNotification(false);
    }
  };

  const languages = [
    { name: 'English (US)', value: 'English' },
    { name: 'Spanish', value: 'Spanish' },
    { name: 'French', value: 'French' },
    { name: 'German', value: 'German' },
    { name: 'Japanese', value: 'Japanese' },
    { name: 'Chinese', value: 'Chinese' },
    { name: 'Hindi', value: 'Hindi' },
    { name: 'Arabic', value: 'Arabic' },
    { name: 'Portuguese', value: 'Portuguese' },
    { name: 'Russian', value: 'Russian' }
  ];

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile(user, { displayName });
      await updateUserProfile(user.uid, { displayName });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language', icon: GlobeIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API Management', icon: Key },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'account', label: 'Account', icon: Lock },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-gray-400 rounded-2xl hover:bg-gray-200 dark:hover:bg-zinc-800 transition-all"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight dark:text-white">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your account and app preferences.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/10" 
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-[32px] border border-gray-100 dark:border-zinc-800 p-8 shadow-sm"
          >
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Profile Preferences</h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-6 p-6 bg-gray-50 dark:bg-zinc-800/50 rounded-3xl">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-zinc-800 shadow-sm">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-lg dark:text-white">{user.displayName || 'User'}</p>
                        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Display Name</label>
                        <input 
                          type="text" 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full px-6 py-4 bg-gray-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-medium dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                        <input 
                          type="email" 
                          defaultValue={user.email || ''}
                          disabled
                          className="w-full px-6 py-4 bg-gray-100 dark:bg-zinc-800/50 border-none rounded-2xl text-gray-400 dark:text-gray-500 font-medium cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-zinc-800 flex justify-end items-center gap-4">
                  {saveSuccess && (
                    <motion.p 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-green-500 font-bold text-sm"
                    >
                      Profile updated successfully!
                    </motion.p>
                  )}
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving || displayName === user.displayName}
                    className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Theme Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['light', 'dark', 'system'] as const).map((t) => (
                      <button 
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          "p-6 rounded-3xl border-2 transition-all text-center group",
                          theme === t 
                            ? "border-black dark:border-white bg-gray-50 dark:bg-zinc-800" 
                            : "border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700"
                        )}
                      >
                        <div className={cn(
                          "w-full aspect-video rounded-xl mb-4 transition-transform group-hover:scale-[1.02]",
                          t === 'light' ? "bg-white border border-gray-100" : t === 'dark' ? "bg-gray-900" : "bg-gradient-to-br from-white to-gray-900 border border-gray-100 dark:border-zinc-700"
                        )} />
                        <span className="font-bold capitalize dark:text-white">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Language Selection</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Choose your preferred language for summaries and analysis. This will be applied to all future generations by default.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {languages.map((lang) => (
                      <button 
                        key={lang.value}
                        onClick={() => setLanguage(lang.value)}
                        className={cn(
                          "flex items-center justify-between p-6 rounded-3xl border-2 transition-all",
                          language === lang.value 
                            ? "border-black dark:border-white bg-gray-50 dark:bg-zinc-800" 
                            : "border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 dark:text-gray-400"
                        )}
                      >
                        <span className="font-bold">{lang.name}</span>
                        {language === lang.value && <CheckCircle2 className="w-5 h-5 dark:text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold dark:text-white">Notification Controls</h3>
                    <button 
                      onClick={handleTestNotification}
                      disabled={testingNotification}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {testingNotification ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                      Send Test Notification
                    </button>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Manage how you receive updates and activity alerts.</p>
                  <div className="space-y-4">
                    {[
                      { id: 'emailSummaries', title: 'Email Summaries', desc: 'Receive a copy of every generated summary via email.' },
                      { id: 'activityAlerts', title: 'Activity Alerts', desc: 'Get notified about account logins and security changes.' },
                      { id: 'weeklyDigest', title: 'Weekly Digest', desc: 'A weekly roundup of your summarization activity.' },
                      { id: 'newFeatures', title: 'New Features', desc: 'Be the first to know about new tools and updates.' },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-zinc-800 rounded-3xl transition-colors">
                        <div>
                          <p className="font-bold dark:text-white">{item.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                        </div>
                        <button 
                          onClick={() => handleToggleNotification(item.id)}
                          className={cn(
                            "w-12 h-6 rounded-full relative transition-all duration-300",
                            notificationSettings[item.id as keyof NotificationSettings] ? "bg-black dark:bg-white" : "bg-gray-200 dark:bg-zinc-700"
                          )}
                        >
                          <motion.div 
                            animate={{ x: notificationSettings[item.id as keyof NotificationSettings] ? 24 : 4 }}
                            className={cn(
                              "absolute top-1 w-4 h-4 rounded-full transition-colors",
                              notificationSettings[item.id as keyof NotificationSettings] ? "bg-white dark:bg-black" : "bg-white dark:bg-zinc-500"
                            )}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-bold text-blue-900 dark:text-blue-100">Last Weekly Digest</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          {notificationSettings.weeklyDigest 
                            ? "Your last digest was sent on Monday, March 23rd." 
                            : "Weekly digests are currently disabled."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-4 dark:text-white">API Management</h3>
                  <div className="p-6 bg-gray-50 dark:bg-zinc-800 rounded-3xl space-y-4 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold dark:text-white">Personal API Key</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">sk_test_••••••••••••••••••••</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-all dark:text-gray-400"><Copy className="w-4 h-4" /></button>
                        <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-all text-red-500"><RefreshCw className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                      <p className="text-xs text-gray-400 dark:text-gray-500">Use this key to integrate OmniSummarize with your own applications and workflows.</p>
                    </div>
                  </div>
                  <button className="mt-6 w-full py-4 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl text-gray-400 dark:text-gray-500 font-bold hover:border-gray-300 dark:hover:border-zinc-700 hover:text-gray-500 dark:hover:text-gray-400 transition-all">
                    + Generate New API Key
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Privacy Settings</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Control your data visibility and how it's used across the platform.</p>
                  <div className="space-y-4">
                    {[
                      { id: 'publicProfile', title: 'Public Profile', desc: 'Allow others to see your public profile and shared summaries.' },
                      { id: 'dataSharing', title: 'Data Sharing', desc: 'Share anonymous usage data to help improve our AI models.' },
                      { id: 'searchIndexing', title: 'Search Engine Indexing', desc: 'Allow search engines to index your public summaries.' },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-zinc-800 rounded-3xl transition-colors">
                        <div>
                          <p className="font-bold dark:text-white">{item.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                        </div>
                        <button 
                          onClick={() => handleTogglePrivacy(item.id)}
                          className={cn(
                            "w-12 h-6 rounded-full relative transition-all duration-300",
                            privacySettings[item.id as keyof PrivacySettings] ? "bg-black dark:bg-white" : "bg-gray-200 dark:bg-zinc-700"
                          )}
                        >
                          <motion.div 
                            animate={{ x: privacySettings[item.id as keyof PrivacySettings] ? 24 : 4 }}
                            className={cn(
                              "absolute top-1 w-4 h-4 rounded-full transition-colors",
                              privacySettings[item.id as keyof PrivacySettings] ? "bg-white dark:bg-black" : "bg-white dark:bg-zinc-500"
                            )}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Account Management</h3>
                  <div className="space-y-4">
                    <button className="w-full flex items-center justify-between p-6 bg-gray-50 dark:bg-zinc-800 rounded-3xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all">
                      <div className="text-left">
                        <p className="font-bold dark:text-white">Change Password</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Update your account password regularly.</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </button>
                    <button className="w-full flex items-center justify-between p-6 bg-gray-50 dark:bg-zinc-800 rounded-3xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all">
                      <div className="text-left">
                        <p className="font-bold dark:text-white">Two-Factor Authentication</p>
                        <p className="text-sm text-red-500">Not enabled</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </button>
                    <div className="pt-8 mt-8 border-t border-gray-100 dark:border-zinc-800">
                      <button className="w-full p-6 border-2 border-red-100 dark:border-red-900/30 text-red-500 rounded-3xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2">
                        <Trash2 className="w-5 h-5" /> Delete Account
                      </button>
                      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">This action is permanent and cannot be undone. All your data will be deleted.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const HistoryPage = ({ user, onNavigate, onSelectSummary, onTogglePublic }: { 
  user: FirebaseUser, 
  onNavigate: (view: any) => void, 
  onSelectSummary: (summary: any) => void,
  onTogglePublic: (id: string, isPublic: boolean) => void
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, type: 'single' | 'multiple', id?: string }>({
    isOpen: false,
    type: 'single'
  });

  useEffect(() => {
    const q = query(
      collection(db, 'summaries'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleToggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === history.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(history.map(item => item.id));
    }
  };

  const handleDeleteIndividual = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, type: 'single', id });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setDeleteModal({ isOpen: true, type: 'multiple' });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModal.type === 'single' && deleteModal.id) {
        await deleteSummary(deleteModal.id);
        toast.success('Summary deleted successfully');
        setSelectedIds(prev => prev.filter(i => i !== deleteModal.id));
      } else if (deleteModal.type === 'multiple') {
        await deleteMultipleSummaries(selectedIds);
        toast.success(`${selectedIds.length} summaries deleted successfully`);
        setSelectedIds([]);
      }
      setDeleteModal({ isOpen: false, type: 'single' });
    } catch (error) {
      console.error('Error deleting summary:', error);
      toast.error('Failed to delete summary');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title={deleteModal.type === 'single' ? "Delete Summary" : "Delete Multiple Summaries"}
        message={deleteModal.type === 'single' 
          ? "Are you sure you want to delete this summary? This action cannot be undone." 
          : `Are you sure you want to delete ${selectedIds.length} selected summaries? This action cannot be undone.`
        }
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Summarization History</h1>
          <p className="text-gray-500 dark:text-gray-400">Access all your past analyses and summaries.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
          >
            <Zap className="w-4 h-4" /> New Analysis
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden transition-colors">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 dark:text-gray-600" />
            <p className="text-gray-400 dark:text-gray-500 font-medium">Loading history...</p>
          </div>
        ) : history.length > 0 ? (
          <div>
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-zinc-800/30 border-b border-gray-50 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors"
                >
                  {selectedIds.length === history.length ? <CheckSquare className="w-4 h-4" /> : <SquareIcon className="w-4 h-4" />}
                  {selectedIds.length === history.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                  {history.length} {history.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-zinc-800">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "p-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer group relative",
                    selectedIds.includes(item.id) && "bg-gray-50/80 dark:bg-zinc-800/80"
                  )}
                  onClick={() => onSelectSummary(item)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <button 
                        onClick={(e) => handleToggleSelect(e, item.id)}
                        className="mt-3 shrink-0 transition-colors"
                      >
                        {selectedIds.includes(item.id) ? (
                          <CheckSquare className="w-5 h-5 text-black dark:text-white" />
                        ) : (
                          <SquareIcon className="w-5 h-5 text-gray-200 dark:text-zinc-800 group-hover:text-gray-300 dark:group-hover:text-zinc-700" />
                        )}
                      </button>
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-zinc-700 transition-all shrink-0">
                        {item.type === 'URL' ? <Globe className="w-6 h-6 text-gray-400 dark:text-gray-500" /> : item.type === 'File' ? <FileUp className="w-6 h-6 text-gray-400 dark:text-gray-500" /> : <FileText className="w-6 h-6 text-gray-400 dark:text-gray-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            item.type === 'URL' ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : item.type === 'File' ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" : "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                          )}>
                            {item.type}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'Just now'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors truncate">{item.title}</h3>
                        {item.url && (
                          <p className="text-sm text-gray-400 dark:text-gray-500 truncate max-w-md mt-1">{item.url}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Topics</p>
                        <div className="flex gap-1 justify-end">
                          {item.mainTopics?.slice(0, 2).map((topic: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-[10px] font-medium text-gray-600 dark:text-gray-400">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePublic(item.id, !item.isPublic);
                          }}
                          className={cn(
                            "p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100",
                            item.isPublic 
                              ? "text-green-500 bg-green-50 dark:bg-green-900/20" 
                              : "text-gray-300 dark:text-zinc-700 hover:text-black dark:hover:text-white"
                          )}
                          title={item.isPublic ? "Make Private" : "Make Public"}
                        >
                          {item.isPublic ? <Share2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        </button>
                        {item.isPublic && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const shareUrl = `${window.location.origin}${window.location.pathname}?share=${item.shareId}`;
                              navigator.clipboard.writeText(shareUrl);
                              toast.success("Share link copied!");
                            }}
                            className="p-2 text-gray-300 dark:text-zinc-700 hover:text-black dark:hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            title="Copy Share Link"
                          >
                            <Link2 className="w-5 h-5" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => handleDeleteIndividual(e, item.id)}
                          disabled={isDeleting}
                          className="p-2 text-gray-300 dark:text-zinc-700 hover:text-red-500 dark:hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete entry"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <History className="w-10 h-10 text-gray-200 dark:text-gray-700" />
            </div>
            <h3 className="text-xl font-bold mb-2 dark:text-white">No history yet</h3>
            <p className="text-gray-400 dark:text-gray-500 max-w-xs mx-auto mb-8">Start by analyzing a URL, document, or raw text to see your history here.</p>
            <button 
              onClick={() => onNavigate('home')}
              className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
            >
              Start Analyzing
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all",
      active 
        ? "bg-black dark:bg-white text-white dark:text-black shadow-lg" 
        : "bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800"
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

export default function App() {
  const [view, setView] = useState<'home' | 'profile' | 'login' | 'signup' | 'history' | 'settings' | 'shared'>('home');
  const [sharedSummary, setSharedSummary] = useState<any | null>(null);
  const [loadingShared, setLoadingShared] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as any) || 'system';
  });

  const [language, setLanguage] = useState<string>(() => {
    const saved = localStorage.getItem('language');
    return saved || 'English';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  const [mode, setMode] = useState<'url' | 'file' | 'text'>('url');
  const [url, setUrl] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('url') || '';
  });
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'code'>('overview');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [translatedSummary, setTranslatedSummary] = useState<SummaryResult | null>(null);
  const [translating, setTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailSummaries: true,
    activityAlerts: true,
    weeklyDigest: false,
    newFeatures: true,
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    publicProfile: true,
    dataSharing: true,
    searchIndexing: true,
  });

  const displayResult = translatedSummary || result;

  const handleLoadSharedSummary = async (shareId: string) => {
    setLoadingShared(true);
    try {
      const summary = await getSummaryByShareId(shareId);
      if (summary) {
        setSharedSummary(summary);
        setView('shared');
      } else {
        toast.error("Summary not found or is private");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load shared summary");
    } finally {
      setLoadingShared(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId) {
      handleLoadSharedSummary(shareId);
    }
  }, []);

  const handleTogglePublic = async (summaryId: string, isPublic: boolean) => {
    try {
      await toggleSummaryPublicStatus(summaryId, isPublic);
      toast.success(isPublic ? "Summary is now public" : "Summary is now private");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update sharing status");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        syncUserProfile(currentUser);
        const profile = await getUserProfile(currentUser.uid);
        if (profile?.notifications) {
          setNotificationSettings(profile.notifications);
          
          // Activity alert for login
          if (profile.notifications.activityAlerts) {
            toast.info("Security Alert", {
              description: `New login detected from ${navigator.userAgent.split(')')[0]})`,
            });
          }
          
          // Show new feature notification if enabled
          if (profile.notifications.newFeatures) {
            setTimeout(() => {
              toast.info("New Feature Available!", {
                description: "You can now translate summaries into 10+ languages in the Settings page.",
                action: {
                  label: "Try it out",
                  onClick: () => setView('settings')
                }
              });
            }, 2000);
          }
        }
        if (profile?.privacy) {
          setPrivacySettings(profile.privacy);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const sendSummaryEmail = async (result: SummaryResult) => {
    if (!notificationSettings.emailSummaries || !user?.email) return;
    
    if (notificationSettings.activityAlerts) {
      toast.info("Activity recorded", {
        description: `Summary for "${result.title}" has been saved to your history.`,
      });
    }

    try {
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: #000; color: #fff; padding: 24px; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">OmniSummarize AI</h1>
            <p style="margin: 8px 0 0; opacity: 0.7;">Your Generated Report</p>
          </div>
          <div style="padding: 32px; border: 1px solid #eee; border-top: none; border-radius: 0 0 16px 16px;">
            <h2 style="margin: 0 0 16px; font-size: 20px;">${result.title}</h2>
            <div style="line-height: 1.6; color: #444;">
              ${result.summary.split('\n').map(p => `<p>${p}</p>`).join('')}
            </div>
            
            <h3 style="margin: 24px 0 12px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em; color: #888;">Key Sections</h3>
            <div style="space-y: 16px;">
              ${result.keySections.map(s => `
                <div style="margin-bottom: 16px;">
                  <h4 style="margin: 0 0 4px; font-size: 14px; font-weight: bold;">${s.title}</h4>
                  <p style="margin: 0; font-size: 14px; color: #666;">${s.content}</p>
                </div>
              `).join('')}
            </div>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
              <p>© 2026 OmniSummarize AI. All rights reserved.</p>
              <p>You received this because you enabled "Email Summaries" in your settings.</p>
            </div>
          </div>
        </div>
      `;

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: `Summary: ${result.title}`,
          html: emailHtml
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email");
      }
      
      toast.success(`A copy of the summary has been sent to ${user.email}`, {
        description: "Check your inbox for the full report.",
        duration: 5000,
      });
    } catch (err: any) {
      console.error("Email delivery failed:", err);
      let errorMessage = "There was an issue delivering your summary email.";
      
      if (err.message.includes("RESEND_API_KEY")) {
        errorMessage = "The email service is not configured. Please contact the administrator.";
      } else if (err.message.includes("unverified")) {
        errorMessage = "Email delivery failed because the sender domain is not verified in Resend.";
      } else if (err.message.includes("limit")) {
        errorMessage = "Email delivery failed: Daily sending limit reached.";
      }

      toast.error("Email delivery failed", {
        description: errorMessage,
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('home');
    } catch (err: any) {
      setError(err.message || "Failed to logout.");
    }
  };

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'settings') {
      setView('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (sectionId === 'home') {
      setView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (view !== 'home') {
      setView('home');
      // Wait for the home view to render before scrolling
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleAuthSuccess = () => {
    setView('profile');
  };

  React.useEffect(() => {
    if (url && mode === 'url') {
      handleUrlSubmit(new Event('submit') as any);
    }
  }, []);

  // Handle Search Indexing Meta Tag
  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]') || document.createElement('meta');
    if (!meta.parentElement) {
      (meta as HTMLMetaElement).name = "robots";
      document.head.appendChild(meta);
    }
    (meta as HTMLMetaElement).content = privacySettings.searchIndexing ? "index, follow" : "noindex, nofollow";
  }, [privacySettings.searchIndexing]);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setGeneratedCode(null);
    setTranslatedSummary(null);
    setTargetLang(null);
    stopAudio();
    setActiveTab('overview');
    
    try {
      const data = await summarizeUrl(url, language, privacySettings.dataSharing);
      setResult(data);
      if (user) {
        await saveSummary(user.uid, data, 'URL', url);
        sendSummaryEmail(data);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setGeneratedCode(null);
    setTranslatedSummary(null);
    setTargetLang(null);
    stopAudio();
    setActiveTab('overview');
    
    try {
      const data = await summarizeText(rawText, language, privacySettings.dataSharing);
      setResult(data);
      if (user) {
        await saveSummary(user.uid, data, 'Text', rawText.substring(0, 100) + '...');
        sendSummaryEmail(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze text. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!result) return;
    setGeneratingCode(true);
    try {
      const content = JSON.stringify({
        summary: result.summary,
        sections: result.keySections,
        topics: result.mainTopics
      });
      const data = await generateCodeFromContent(content, language);
      setGeneratedCode(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate code implementations.");
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleTranslate = async (lang: string) => {
    if (!result) return;
    setTranslating(true);
    setTargetLang(lang);
    try {
      const translated = await translateSummaryResult(result, lang);
      setTranslatedSummary(translated);
    } catch (err: any) {
      setError(err.message || "Translation failed.");
    } finally {
      setTranslating(false);
    }
  };

  const stopAudio = () => {
    if (audio) {
      audio.pause();
      setAudio(null);
    }
    setSpeaking(false);
  };

  const handleListen = async () => {
    if (!displayResult) return;
    if (speaking) {
      stopAudio();
      return;
    }

    setSpeaking(true);
    try {
      const textToRead = `
        Summary: ${displayResult.summary}. 
        Key Sections: ${displayResult.keySections.map(s => `${s.title}: ${s.content}`).join('. ')}. 
        Main Topics: ${displayResult.mainTopics.join(', ')}.
      `;
      
      const base64Audio = await generateSpeech(textToRead);
      
      // Create a blob from base64
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // Gemini TTS returns raw PCM 24kHz. We need to wrap it in a WAV header for HTML5 Audio.
      const wavHeader = createWavHeader(byteArray.length, 24000);
      const wavBlob = new Blob([wavHeader, byteArray], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(wavBlob);
      
      const newAudio = new Audio(audioUrl);
      newAudio.onended = () => {
        setSpeaking(false);
        setAudio(null);
      };
      setAudio(newAudio);
      newAudio.play();
    } catch (err: any) {
      setError(err.message || "Failed to generate speech.");
      setSpeaking(false);
    }
  };

  // Helper to create a simple WAV header for 16-bit Mono PCM
  const createWavHeader = (dataLength: number, sampleRate: number) => {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    // RIFF identifier
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataLength, true); // file length
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // fmt subchunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // subchunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate (sampleRate * numChannels * bitsPerSample/8)
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    
    // data subchunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataLength, true);
    
    return header;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setGeneratedCode(null);
    setTranslatedSummary(null);
    setTargetLang(null);
    stopAudio();
    setActiveTab('overview');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const data = await summarizeDocument(base64, file.type, language, privacySettings.dataSharing);
        setResult(data);
        if (user) {
          await saveSummary(user.uid, data, 'File', file.name);
          sendSummaryEmail(data);
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "Failed to process document.");
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-zinc-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
      <Toaster position="top-right" richColors />
      <Header 
        user={user} 
        onLogin={() => setView('login')} 
        onSignUp={() => setView('signup')}
        onLogout={handleLogout} 
        onViewProfile={() => setView('profile')} 
        onHistory={() => setView('history')}
        onNavigate={handleNavigate}
      />
      
      <main>
        {view === 'shared' && sharedSummary ? (
          <SharedSummaryPage 
            summary={sharedSummary} 
            onBack={() => {
              setSharedSummary(null);
              setView('home');
              window.history.replaceState({}, '', window.location.pathname);
            }} 
          />
        ) : view === 'profile' && user ? (
          <ProfileDashboard 
            user={user} 
            onNavigate={setView} 
            onSettings={() => setView('settings')}
          />
        ) : view === 'settings' && user ? (
          <SettingsPage 
            user={user} 
            onBack={() => setView('profile')} 
            theme={theme}
            setTheme={setTheme}
            language={language}
            setLanguage={setLanguage}
            notificationSettings={notificationSettings}
            setNotificationSettings={setNotificationSettings}
            privacySettings={privacySettings}
            setPrivacySettings={setPrivacySettings}
          />
        ) : view === 'history' && user ? (
          <HistoryPage 
            user={user} 
            onNavigate={setView} 
            onTogglePublic={handleTogglePublic}
            onSelectSummary={(s) => {
              setResult(s);
              setView('home');
              setTimeout(() => {
                const element = document.getElementById('analyzer');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }} 
          />
        ) : view === 'login' ? (
          <LoginPage onSuccess={handleAuthSuccess} onSwitch={() => setView('signup')} />
        ) : view === 'signup' ? (
          <SignUpPage onSuccess={handleAuthSuccess} onSwitch={() => setView('login')} />
        ) : (
          <>
            <Hero onGetStarted={() => setView('signup')} user={user} />

            <section id="analyzer" className="max-w-5xl mx-auto px-4 pb-24">
          <div className="flex justify-center flex-wrap gap-4 mb-12">
            <TabButton 
              active={mode === 'url'} 
              onClick={() => { setMode('url'); setResult(null); setError(null); }} 
              icon={Globe} 
              label="Analyze URL" 
            />
            <TabButton 
              active={mode === 'file'} 
              onClick={() => { setMode('file'); setResult(null); setError(null); }} 
              icon={FileUp} 
              label="Upload Document" 
            />
            <TabButton 
              active={mode === 'text'} 
              onClick={() => { setMode('text'); setResult(null); setError(null); }} 
              icon={FileText} 
              label="Raw Text" 
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors">
            {mode === 'url' ? (
              <form onSubmit={handleUrlSubmit} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    type="url"
                    placeholder="Paste a web page URL (e.g., https://example.com/article)"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none dark:text-white"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                  {loading ? "Analyzing..." : "Analyze Now"}
                </button>
              </form>
            ) : mode === 'text' ? (
              <form onSubmit={handleTextSubmit} className="space-y-4">
                <textarea
                  placeholder="Paste your raw text here for analysis and summarization..."
                  className="w-full p-6 bg-gray-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none min-h-[200px] resize-none dark:text-white"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !rawText.trim()}
                    className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    {loading ? "Analyzing Text..." : "Analyze Text"}
                  </button>
                </div>
              </form>
            ) : (
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all",
                  isDragActive 
                    ? "border-black dark:border-white bg-gray-50 dark:bg-zinc-800" 
                    : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <Upload className="text-gray-400 dark:text-gray-500 w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold dark:text-white">Drop your PDF or document here</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Supports PDF, TXT, and DOCX up to 10MB</p>
                  </div>
                  {loading && (
                    <div className="flex items-center gap-2 text-black dark:text-white font-medium mt-4">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing document...
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12"
              >
                {/* Results Header / Tabs */}
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-zinc-800 pb-4 transition-colors">
                  <div className="flex gap-8">
                    <button 
                      onClick={() => setActiveTab('overview')}
                      className={cn(
                        "text-sm font-bold tracking-tight transition-all relative pb-4",
                        activeTab === 'overview' ? "text-black dark:text-white" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                      )}
                    >
                      Overview
                      {activeTab === 'overview' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />}
                    </button>
                    {result.hasProgrammingContent && (
                      <button 
                        onClick={() => setActiveTab('code')}
                        className={cn(
                          "text-sm font-bold tracking-tight transition-all relative pb-4 flex items-center gap-2",
                          activeTab === 'code' ? "text-black dark:text-white" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                        )}
                      >
                        <Code className="w-4 h-4" />
                        Code Analysis
                        {activeTab === 'code' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />}
                      </button>
                    )}
                  </div>
                  {activeTab === 'code' && !generatedCode && (
                    <button
                      onClick={handleGenerateCode}
                      disabled={generatingCode}
                      className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                      {generatingCode ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                      Generate Implementations
                    </button>
                  )}
                </div>

                {activeTab === 'overview' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-2xl font-bold flex items-center gap-2 dark:text-white">
                            <FileText className="w-6 h-6 text-gray-400 dark:text-gray-500" /> Executive Summary
                          </h2>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={handleListen}
                              disabled={translating}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                speaking 
                                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30" 
                                  : "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700"
                              )}
                            >
                              {speaking ? <Square className="w-3 h-3 fill-current" /> : <Volume2 className="w-3 h-3" />}
                              {speaking ? "Stop Listening" : "Listen to Report"}
                            </button>
                            <button
                              onClick={() => {
                                if (displayResult?.shareId) {
                                  const shareUrl = `${window.location.origin}${window.location.pathname}?share=${displayResult.shareId}`;
                                  navigator.clipboard.writeText(shareUrl);
                                  toast.success("Share link copied to clipboard!");
                                }
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all"
                            >
                              <Share2 className="w-3 h-3" />
                              Share
                            </button>
                            <div className="h-6 w-px bg-gray-100 dark:bg-zinc-800" />
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                <Languages className="w-3 h-3" /> Translate:
                              </span>
                              <div className="flex gap-1">
                                {['Hindi', 'Telugu', 'Spanish', 'French'].map((lang) => (
                                  <button
                                    key={lang}
                                    onClick={() => handleTranslate(lang)}
                                    disabled={translating}
                                    className={cn(
                                      "px-3 py-1 rounded-lg text-[10px] font-bold transition-all border",
                                      targetLang === lang 
                                        ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white" 
                                        : "bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500"
                                    )}
                                  >
                                    {lang}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="prose prose-gray dark:prose-invert max-w-none">
                          {translating ? (
                            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 py-4 italic">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Translating full report to {targetLang}...
                            </div>
                          ) : (
                            <>
                              {translatedSummary && (
                                <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700">
                                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                    <Languages className="w-3 h-3" /> Showing {targetLang} Translation
                                  </p>
                                  <button 
                                    onClick={() => { setTranslatedSummary(null); setTargetLang(null); }}
                                    className="text-[10px] font-bold text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors underline underline-offset-4"
                                  >
                                    Show Original (English)
                                  </button>
                                </div>
                              )}
                              <Markdown>{displayResult?.summary || ''}</Markdown>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                          <Layers className="w-6 h-6 text-gray-400 dark:text-gray-500" /> Key Sections
                        </h2>
                        <div className="space-y-6">
                          {displayResult?.keySections.map((section, idx) => (
                            <div key={idx} className="group">
                              <h3 className="text-lg font-bold mb-2 dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">{section.title}</h3>
                              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{section.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                          <LinkIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" /> Categorized Links
                        </h2>
                        <div className="space-y-4">
                          {displayResult?.links.map((link, idx) => (
                            <a 
                              key={idx} 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all group"
                            >
                              <div className="flex items-start justify-between mb-1">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">{link.category}</span>
                                <ExternalLink className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white transition-colors" />
                              </div>
                              <p className="text-sm font-semibold truncate dark:text-white">{link.title || link.url}</p>
                            </a>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                          <Zap className="w-5 h-5 text-gray-400 dark:text-gray-500" /> Main Topics
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {displayResult?.mainTopics.map((topic, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Extracted Code Snippets */}
                    {displayResult?.extractedCodeSnippets && displayResult.extractedCodeSnippets.length > 0 && (
                      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                          <Terminal className="w-6 h-6 text-gray-400 dark:text-gray-500" /> Extracted Snippets
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {displayResult.extractedCodeSnippets.map((snippet, idx) => (
                            <div key={idx}>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{snippet.description}</p>
                              <CodeBlock code={snippet.code} language={snippet.language} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Generated Implementations */}
                    {generatedCode && (
                      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                          <Zap className="w-6 h-6 text-gray-400 dark:text-gray-500" /> Generated Implementations
                        </h2>
                        <div className="space-y-12">
                          {generatedCode.sections.map((section, idx) => (
                            <div key={idx}>
                              <h3 className="text-xl font-bold mb-2 dark:text-white">{section.title}</h3>
                              <p className="text-gray-600 dark:text-gray-400 mb-4">{section.explanation}</p>
                              <CodeBlock code={section.code} language={section.language} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!generatedCode && !generatingCode && displayResult?.extractedCodeSnippets.length === 0 && (
                      <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                        <Code className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500">No code snippets found in the source.</p>
                        <button 
                          onClick={handleGenerateCode}
                          className="mt-6 text-black font-bold text-sm hover:underline"
                        >
                          Generate new implementations instead?
                        </button>
                      </div>
                    )}

                    {generatingCode && (
                      <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                        <Loader2 className="w-12 h-12 text-gray-200 mx-auto mb-4 animate-spin" />
                        <p className="text-gray-500">Generating section-wise implementations...</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Extension Section */}
        <section id="extension" className="bg-black text-white py-24">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                The Extension: <br />
                <span className="text-gray-500">Summary in a Click.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-10">
                Our browser extension lives in your toolbar. One click analyzes the current page, extracts the core message, and organizes all resources without you ever leaving the tab.
              </p>
              <div className="space-y-6">
                {[
                  "Intelligent page content extraction",
                  "Categorized hyperlink identification",
                  "Key section highlighting",
                  "One-click PDF export of summaries"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Quick Access Bookmarklet</p>
                <p className="text-sm text-gray-400 mb-4">Drag this button to your bookmarks bar to analyze any page instantly.</p>
                <a 
                  href={`javascript:(function(){window.open('${window.location.origin}/?url='+encodeURIComponent(window.location.href),'_blank')})()`}
                  className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all cursor-move"
                  onClick={(e) => e.preventDefault()}
                >
                  Summarize with Omni
                </a>
              </div>
              <button className="mt-12 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition-all flex items-center gap-2">
                Install Extension <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-black rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="p-8 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Extension Preview
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="h-4 w-3/4 bg-white/10 rounded-full" />
                    <div className="h-4 w-1/2 bg-white/10 rounded-full" />
                    <div className="h-32 w-full bg-white/5 rounded-2xl" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-20 bg-white/5 rounded-2xl" />
                      <div className="h-20 bg-white/5 rounded-2xl" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 bg-white text-black p-6 rounded-2xl shadow-2xl border border-gray-100 max-w-[200px]">
                <p className="text-xs font-bold uppercase tracking-tighter text-gray-400 mb-2">Real-time Analysis</p>
                <p className="text-sm font-semibold leading-tight">"This article discusses the impact of AI on productivity..."</p>
              </div>
            </div>
          </div>
        </section>
          </>
        )}
      </main>

      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
              <Zap className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-lg">OmniSummarize</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 OmniSummarize AI. Powered by Gemini 3.</p>
          <div className="flex gap-6 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-black">Privacy</a>
            <a href="#" className="hover:text-black">Terms</a>
            <a href="#" className="hover:text-black">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
