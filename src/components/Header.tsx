import React from 'react';
import { WorkspaceType, UserProfile } from '../types';
import {
  MessageSquare,
  GraduationCap,
  Code2,
  FileSearch,
  Settings,
  User,
  Volume2,
  VolumeX,
  Menu,
  X,
  Cpu,
} from 'lucide-react';
import { sounds } from '../services/soundEffects';

interface HeaderProps {
  activeWorkspace: WorkspaceType;
  setActiveWorkspace: (w: WorkspaceType) => void;
  isBackendOnline: boolean;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeWorkspace,
  setActiveWorkspace,
  isBackendOnline,
  user,
  onOpenAuth,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const navItems: { id: WorkspaceType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'chat', label: 'Neural Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'study', label: 'Study Mode', icon: <GraduationCap className="w-4 h-4" />, badge: 'AI Tutor' },
    { id: 'coding', label: 'Coding Lab', icon: <Code2 className="w-4 h-4" />, badge: 'IDE' },
    { id: 'files', label: 'File Analysis', icon: <FileSearch className="w-4 h-4" /> },
  ];

  const handleNavClick = (id: WorkspaceType) => {
    sounds.playCardFlip();
    setActiveWorkspace(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-500/20 bg-[#07070d]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Tagline */}
        <div
          onClick={() => handleNavClick('chat')}
          className="flex items-center gap-3 cursor-pointer group"
          role="button"
          tabIndex={0}
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-purple-600 to-fuchsia-600 p-[1.5px] shadow-[0_0_15px_rgba(168,85,247,0.4)] group-hover:shadow-[0_0_22px_rgba(6,182,212,0.6)] transition-all">
            <div className="w-full h-full bg-[#090a14] rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-300 group-hover:rotate-45 transition-transform duration-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-orbitron font-extrabold text-lg sm:text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                LUXION
              </span>
              <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded border border-cyan-500/40 text-cyan-300 bg-cyan-950/40">
                AI v2.4
              </span>
            </div>
            <p className="hidden sm:block text-[10px] tracking-widest text-slate-400 uppercase font-rajdhani font-semibold">
              Beyond Intelligence. Beyond Limits.
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-purple-950/20 border border-purple-500/20">
          {navItems.map((item) => {
            const isActive = activeWorkspace === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/90 to-cyan-600/90 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono-code ${
                      isActive ? 'bg-black/30 text-cyan-200' : 'bg-purple-900/40 text-purple-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status & Controls */}
        <div className="flex items-center gap-2">
          {/* Backend Health Dot */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-code border border-slate-800 bg-slate-900/60"
            title={isBackendOnline ? 'LUXION Core: Connected' : 'LUXION Core: Reconnecting'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendOnline ? 'bg-cyan-400 animate-pulse shadow-[0_0_6px_#06b6d4]' : 'bg-red-500'
              }`}
            />
            <span className="hidden lg:inline text-slate-300">
              {isBackendOnline ? 'CORE ONLINE' : 'DISCONNECTED'}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              onToggleSound();
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 border border-transparent hover:border-cyan-500/20 transition-all"
            title={soundEnabled ? 'Mute Interface Audio' : 'Unmute Interface Audio'}
            aria-label="Sound Toggle"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* User Account / Profile button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAuth();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-500/25 bg-purple-950/20 hover:bg-purple-900/30 text-slate-200 text-xs transition-all"
            title={user && !user.isGuest ? `Signed in as ${user.displayName}` : 'Guest Mode — Sign In to Sync'}
          >
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline max-w-[90px] truncate font-medium">
              {user ? user.displayName : 'Guest'}
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenSettings();
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-white/5 border border-purple-500/20 hover:border-purple-400/40 transition-all"
            title="System Settings & Cloud Sync"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-white/5 border border-purple-500/20"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-purple-500/20 bg-[#07070f] px-4 py-3 space-y-2">
          {navItems.map((item) => {
            const isActive = activeWorkspace === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-700/80 to-cyan-700/80 text-white font-medium'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono-code bg-black/40 text-cyan-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-purple-900/30 flex items-center justify-between text-xs text-slate-400">
            <span>Status: {isBackendOnline ? 'Online (Gemini 3.8 Flash)' : 'Offline'}</span>
            <span className="font-orbitron text-purple-400 text-[10px]">LUXION AI</span>
          </div>
        </div>
      )}
    </header>
  );
};
