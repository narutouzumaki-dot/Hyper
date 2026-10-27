import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseClient';
import { sounds } from '../services/soundEffects';
import { UserProfile } from '../types';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
  onOpenSettings: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onOpenSettings,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfigured = supabaseService.isConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isConfigured) {
      setErrorMsg('Supabase is not configured yet. Please open Settings > Supabase Cloud Sync to enter your project credentials.');
      sounds.playWarning();
      return;
    }

    if (!email.trim() || (!password.trim() && mode !== 'forgot')) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    sounds.playTransmit();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { user, error } = await supabaseService.signIn(email, password);
        if (error) {
          setErrorMsg(error);
          sounds.playWarning();
        } else if (user) {
          sounds.playNeuralChime();
          const profile: UserProfile = {
            id: user.id,
            email: user.email,
            displayName: user.user_metadata?.full_name || email.split('@')[0],
            isGuest: false,
          };
          onAuthSuccess(profile);
          onClose();
        }
      } else if (mode === 'signup') {
        const { user, error } = await supabaseService.signUp(email, password, displayName || email.split('@')[0]);
        if (error) {
          setErrorMsg(error);
          sounds.playWarning();
        } else {
          sounds.playNeuralChime();
          setSuccessMsg('Account registered! If email confirmation is enabled on your Supabase instance, please verify your email.');
          if (user) {
            const profile: UserProfile = {
              id: user.id,
              email: user.email,
              displayName: displayName || email.split('@')[0],
              isGuest: false,
            };
            onAuthSuccess(profile);
          }
        }
      } else if (mode === 'forgot') {
        const { success, error } = await supabaseService.resetPassword(email);
        if (error) {
          setErrorMsg(error);
          sounds.playWarning();
        } else if (success) {
          sounds.playNeuralChime();
          setSuccessMsg('Password reset instructions dispatched to your email.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication operation failed.');
      sounds.playWarning();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md lux-glass-card rounded-3xl border border-purple-500/30 overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.25)] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-purple-500/20 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-base text-white">
                {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono-code">
                Supabase Auth & Encrypted Storage
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supabase status banner */}
        {!isConfigured && (
          <div className="p-3 bg-purple-950/40 border-b border-purple-500/20 text-xs text-purple-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Connect Supabase to sync history across devices.</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="text-cyan-300 underline font-semibold shrink-0"
            >
              Config
            </button>
          </div>
        )}

        {/* Tabs for Sign In vs Sign Up */}
        <div className="flex border-b border-purple-500/20 bg-black/30 text-xs">
          <button
            onClick={() => {
              sounds.playClick();
              setMode('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 text-center font-semibold transition-all ${
              mode === 'signin'
                ? 'text-cyan-300 border-b-2 border-cyan-400 bg-purple-950/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setMode('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 text-center font-semibold transition-all ${
              mode === 'signup'
                ? 'text-cyan-300 border-b-2 border-cyan-400 bg-purple-950/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Display Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Major Kusanagi"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operative@luxion.ai"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-xs text-white outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label className="text-slate-300">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-cyan-400 hover:underline text-[11px]"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-cyan-300" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In to LUXION' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="text-xs text-slate-400 hover:text-cyan-300 transition-colors"
            >
              Continue in Guest Mode (Offline Storage)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
