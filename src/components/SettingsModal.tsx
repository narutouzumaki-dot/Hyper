import React, { useState, useEffect } from 'react';
import { AppSettings, UserProfile, Conversation } from '../types';
import { speech } from '../services/speech';
import { sounds } from '../services/soundEffects';
import { supabaseService } from '../services/supabaseClient';
import {
  X,
  Settings,
  Volume2,
  Database,
  Cloud,
  User,
  Shield,
  Download,
  Trash2,
  Check,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  user: UserProfile | null;
  onSignOut: () => void;
  conversations: Conversation[];
  onClearHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  user,
  onSignOut,
  conversations,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'cloud' | 'worker' | 'account' | 'privacy' | 'guide'>('voice');
  const [voices, setVoices] = useState<{ name: string; lang: string }[]>([]);
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });
  const [workerTestStatus, setWorkerTestStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });

  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName || 'LUXION Operative');
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(settings.supabaseUrl || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(settings.supabaseAnonKey || '');
  const [workerUrlInput, setWorkerUrlInput] = useState(settings.customBackendUrl || '');

  useEffect(() => {
    if (speech.isSynthesisSupported()) {
      const v = speech.getAvailableVoices();
      setVoices(v);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          setVoices(speech.getAvailableVoices());
        };
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleTestVoice = () => {
    sounds.playClick();
    speech.speak('LUXION online. Audio synthesizer configured and operational.', {
      voiceName: settings.selectedVoiceName,
      rate: settings.voiceRate,
      pitch: settings.voicePitch,
      volume: settings.voiceVolume,
    });
  };

  const handleTestSupabase = async () => {
    sounds.playClick();
    setSupabaseTestStatus({ status: 'testing', message: 'Pinging Supabase Auth & Cloud Database...' });
    supabaseService.init(supabaseUrlInput, supabaseKeyInput);
    const result = await supabaseService.testConnection();
    if (result.success) {
      sounds.playNeuralChime();
      setSupabaseTestStatus({ status: 'success', message: result.message });
      onUpdateSettings({ supabaseUrl: supabaseUrlInput, supabaseAnonKey: supabaseKeyInput });
    } else {
      sounds.playWarning();
      setSupabaseTestStatus({ status: 'error', message: result.message });
    }
  };

  const handleTestWorker = async () => {
    sounds.playClick();
    setWorkerTestStatus({ status: 'testing', message: 'Testing Cloudflare Worker endpoint...' });
    try {
      const url = workerUrlInput.trim().replace(/\/+$/, '');
      const res = await fetch(`${url}/health`);
      if (res.ok) {
        const data = await res.json();
        sounds.playNeuralChime();
        setWorkerTestStatus({ status: 'success', message: `Connected! Service: ${data.service || 'LUXION Worker'}` });
        onUpdateSettings({ customBackendUrl: workerUrlInput });
      } else {
        throw new Error(`Worker responded with status ${res.status}`);
      }
    } catch (e: any) {
      sounds.playWarning();
      setWorkerTestStatus({ status: 'error', message: e.message || 'Could not connect to Cloudflare Worker' });
    }
  };

  const handleExportJSON = () => {
    sounds.playClick();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `luxion-conversations-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportMarkdown = () => {
    sounds.playClick();
    let md = `# LUXION AI — Conversation History\nExported: ${new Date().toLocaleString()}\n\n`;
    conversations.forEach((c) => {
      md += `## ${c.title}\n*Created: ${new Date(c.createdAt).toLocaleString()}*\n\n`;
      c.messages.forEach((m) => {
        md += `### ${m.role === 'user' ? 'User' : 'LUXION'}\n${m.content}\n\n`;
      });
      md += `---\n\n`;
    });

    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `luxion-history-${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl lux-glass-card rounded-3xl border border-purple-500/30 overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-500/20 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-base sm:text-lg text-white">
                LUXION Core Settings
              </h2>
              <p className="text-[11px] text-slate-400 font-mono-code">
                System Configurations & Cloud Synchronization
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Tabs Sidebar + Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Tabs Navigation */}
          <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-purple-500/20 p-2 sm:p-3 space-y-1 bg-black/20 flex md:flex-col overflow-x-auto">
            {[
              { id: 'voice', label: 'Voice & Audio', icon: <Volume2 className="w-4 h-4" /> },
              { id: 'cloud', label: 'Supabase Cloud Sync', icon: <Database className="w-4 h-4" /> },
              { id: 'worker', label: 'Cloudflare Worker', icon: <Cloud className="w-4 h-4" /> },
              { id: 'account', label: 'Account & Identity', icon: <User className="w-4 h-4" /> },
              { id: 'privacy', label: 'Data & Privacy', icon: <Shield className="w-4 h-4" /> },
              { id: 'guide', label: 'Deployment Guide', icon: <BookOpen className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600/80 to-cyan-600/80 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs sm:text-sm">
            {/* 1. Voice & Audio Settings */}
            {activeTab === 'voice' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="font-orbitron text-sm font-bold text-cyan-300">
                    Voice Synthesis & Recognition
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure Web Speech API text-to-speech voice, speaking speed, pitch, and automated replies.
                  </p>
                </div>

                {/* Auto Speak Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
                  <div>
                    <span className="font-semibold text-white block">Auto-Read AI Responses</span>
                    <span className="text-[11px] text-slate-400">
                      LUXION automatically speaks every response aloud.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSpeak}
                    onChange={(e) => {
                      sounds.playClick();
                      onUpdateSettings({ autoSpeak: e.target.checked });
                    }}
                    className="w-5 h-5 accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Voice Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Spoken Voice Voice Model</label>
                  <select
                    value={settings.selectedVoiceName}
                    onChange={(e) => {
                      sounds.playClick();
                      onUpdateSettings({ selectedVoiceName: e.target.value });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-xs text-slate-200 outline-none focus:border-cyan-400"
                  >
                    <option value="">Browser Default Persona</option>
                    {voices.map((v, idx) => (
                      <option key={`${v.name}-${v.lang}-${idx}`} value={v.name} className="bg-[#0b0c16]">
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sliders: Rate, Pitch, Volume */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Rate</span>
                      <span className="font-mono-code text-cyan-300">{settings.voiceRate.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={settings.voiceRate}
                      onChange={(e) => onUpdateSettings({ voiceRate: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Pitch</span>
                      <span className="font-mono-code text-purple-300">{settings.voicePitch.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={settings.voicePitch}
                      onChange={(e) => onUpdateSettings({ voicePitch: parseFloat(e.target.value) })}
                      className="w-full accent-purple-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Volume</span>
                      <span className="font-mono-code text-cyan-300">
                        {Math.round(settings.voiceVolume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.voiceVolume}
                      onChange={(e) => onUpdateSettings({ voiceVolume: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                {/* Test Voice Button */}
                <div className="pt-2">
                  <button
                    onClick={handleTestVoice}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/40 border border-purple-500/40 text-xs font-semibold text-cyan-200 transition-all"
                  >
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>Test Voice Synthesis</span>
                  </button>
                </div>

                {/* Interface Sound Effects */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
                  <div>
                    <span className="font-semibold text-white block">Futuristic Audio Cues</span>
                    <span className="text-[11px] text-slate-400">
                      Synthesized Web Audio clicks, transmits, and neural chimes.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEffects}
                    onChange={(e) => {
                      onUpdateSettings({ soundEffects: e.target.checked });
                      sounds.setEnabled(e.target.checked);
                    }}
                    className="w-5 h-5 accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Reduced Motion Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
                  <div>
                    <span className="font-semibold text-white block">Reduced Motion Mode</span>
                    <span className="text-[11px] text-slate-400">
                      Disables spinning energy rings on the central AI Core orb.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={(e) => {
                      sounds.playClick();
                      onUpdateSettings({ reducedMotion: e.target.checked });
                    }}
                    className="w-5 h-5 accent-purple-400 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 2. Supabase Cloud Sync */}
            {activeTab === 'cloud' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-orbitron text-sm font-bold text-cyan-300">
                    Supabase PostgreSQL & Auth Sync
                  </h3>
                  <p className="text-xs text-slate-400">
                    Connect your Supabase project to synchronize conversation history across your Android phones, tablets, and laptops.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono-code text-slate-300">SUPABASE_PROJECT_URL</label>
                    <input
                      type="text"
                      value={supabaseUrlInput}
                      onChange={(e) => setSupabaseUrlInput(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-xs font-mono-code text-cyan-200 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono-code text-slate-300">SUPABASE_ANON_KEY (Public Key)</label>
                    <input
                      type="password"
                      value={supabaseKeyInput}
                      onChange={(e) => setSupabaseKeyInput(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-xs font-mono-code text-cyan-200 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleTestSupabase}
                      disabled={supabaseTestStatus.status === 'testing' || !supabaseUrlInput || !supabaseKeyInput}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold text-xs shadow-md disabled:opacity-50"
                    >
                      {supabaseTestStatus.status === 'testing' ? (
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Database className="w-3.5 h-3.5" />
                      )}
                      <span>Test & Save Connection</span>
                    </button>
                    {supabaseService.isConfigured() && (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          supabaseService.disconnect();
                          setSupabaseUrlInput('');
                          setSupabaseKeyInput('');
                          onUpdateSettings({ supabaseUrl: '', supabaseAnonKey: '' });
                          setSupabaseTestStatus({ status: 'idle', message: 'Disconnected.' });
                        }}
                        className="px-3 py-2 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>

                  {supabaseTestStatus.message && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                        supabaseTestStatus.status === 'success'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : supabaseTestStatus.status === 'error'
                          ? 'bg-red-950/40 border-red-500/40 text-red-300'
                          : 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                      }`}
                    >
                      {supabaseTestStatus.status === 'success' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                      <span>{supabaseTestStatus.message}</span>
                    </div>
                  )}

                  <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20 text-xs text-slate-400 space-y-1">
                    <span className="font-semibold text-white block">Database Schema:</span>
                    <p>
                      The database schema and Row Level Security (RLS) rules are provided in{' '}
                      <code className="text-cyan-300 font-mono-code">/database/schema.sql</code>. Paste them in the Supabase SQL Editor.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Cloudflare Worker */}
            {activeTab === 'worker' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-orbitron text-sm font-bold text-cyan-300">
                    Cloudflare Worker Proxy
                  </h3>
                  <p className="text-xs text-slate-400">
                    LUXION architecture supports proxying AI requests via Cloudflare Workers:
                    <br />
                    <span className="font-mono-code text-[11px] text-purple-300">
                      Frontend → Cloudflare Worker → Gemini API → Frontend
                    </span>
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono-code text-slate-300">
                      CUSTOM_WORKER_URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={workerUrlInput}
                      onChange={(e) => setWorkerUrlInput(e.target.value)}
                      placeholder="https://luxion-ai-worker.myname.workers.dev (leave blank for local server)"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-xs font-mono-code text-cyan-200 outline-none focus:border-cyan-400"
                    />
                    <p className="text-[10px] text-slate-500">
                      If left empty, LUXION uses the embedded fullstack server proxy (<code className="text-cyan-400">/api/chat</code>).
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleTestWorker}
                      disabled={!workerUrlInput.trim() || workerTestStatus.status === 'testing'}
                      className="px-4 py-2 rounded-xl bg-purple-900/50 hover:bg-purple-800/50 border border-purple-500/40 text-xs font-semibold text-white transition-all disabled:opacity-50"
                    >
                      {workerTestStatus.status === 'testing' ? 'Pinging Worker...' : 'Ping Worker'}
                    </button>
                    {workerUrlInput && (
                      <button
                        onClick={() => {
                          setWorkerUrlInput('');
                          onUpdateSettings({ customBackendUrl: '' });
                          setWorkerTestStatus({ status: 'idle', message: 'Reset to default server proxy.' });
                        }}
                        className="px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-slate-400"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>

                  {workerTestStatus.message && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                        workerTestStatus.status === 'success'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : workerTestStatus.status === 'error'
                          ? 'bg-red-950/40 border-red-500/40 text-red-300'
                          : 'bg-purple-950/40 text-purple-300'
                      }`}
                    >
                      <span>{workerTestStatus.message}</span>
                    </div>
                  )}

                  <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20 text-xs text-slate-400 space-y-1">
                    <span className="font-semibold text-white block">Worker Script Included:</span>
                    <p>
                      The complete Cloudflare Worker code is in{' '}
                      <code className="text-cyan-300 font-mono-code">/worker/worker.js</code> with configuration in{' '}
                      <code className="text-cyan-300 font-mono-code">/worker/wrangler.toml</code>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Account & Identity */}
            {activeTab === 'account' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-orbitron text-sm font-bold text-cyan-300">
                    User Identity & Profile
                  </h3>
                  <p className="text-xs text-slate-400">
                    Manage your display name and active authentication session.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold text-base">
                      {displayNameInput.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-white block">{user?.displayName || 'Guest User'}</span>
                      <span className="text-xs text-slate-400 font-mono-code">
                        {user?.email || 'Local Storage Mode'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs text-slate-300 font-medium">Display Name</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-black/60 border border-purple-500/30 text-xs text-white outline-none focus:border-cyan-400"
                      />
                      <button
                        onClick={() => {
                          sounds.playClick();
                          // Save display name locally
                          localStorage.setItem('luxion_display_name', displayNameInput);
                          alert('Display name updated.');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  {user && !user.isGuest && (
                    <div className="pt-3 border-t border-white/5">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onSignOut();
                        }}
                        className="px-4 py-2 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-200 text-xs font-semibold"
                      >
                        Sign Out of Supabase
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. Data & Privacy */}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-orbitron text-sm font-bold text-cyan-300">
                    Data Control & Privacy
                  </h3>
                  <p className="text-xs text-slate-400">
                    Export your conversation archives or delete local threads.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleExportJSON}
                    className="p-3.5 rounded-xl bg-black/40 hover:bg-white/5 border border-purple-500/20 text-left space-y-1 transition-all"
                  >
                    <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                      <Download className="w-4 h-4" />
                      <span>Export as JSON</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Download complete conversation database with timestamps and attachments.
                    </p>
                  </button>

                  <button
                    onClick={handleExportMarkdown}
                    className="p-3.5 rounded-xl bg-black/40 hover:bg-white/5 border border-purple-500/20 text-left space-y-1 transition-all"
                  >
                    <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
                      <Download className="w-4 h-4" />
                      <span>Export as Markdown</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Readable document format ideal for Obsidian, Notion, or personal archives.
                    </p>
                  </button>
                </div>

                {/* Clear Data */}
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
                  <span className="font-semibold text-red-300 block">Clear Local Threads</span>
                  <p className="text-xs text-slate-400">
                    Permanently wipe all locally cached conversations from browser storage.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete all stored conversation history?')) {
                        sounds.playWarning();
                        onClearHistory();
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            )}

            {/* 6. Deployment Guide */}
            {activeTab === 'guide' && (
              <div className="space-y-4 text-xs text-slate-300">
                <div className="space-y-1">
                  <h3 className="font-orbitron text-sm font-bold text-cyan-300">
                    Full Deployment Blueprint
                  </h3>
                  <p className="text-xs text-slate-400">
                    Beginner-friendly steps to deploy LUXION AI to GitHub Pages, Cloudflare Workers, and Supabase.
                  </p>
                </div>

                <div className="space-y-3 font-sans">
                  <div className="p-3 rounded-xl bg-black/40 border border-purple-500/20 space-y-1">
                    <span className="font-bold text-white font-mono-code text-xs">1. Cloudflare Workers Backend:</span>
                    <p className="text-[11px] text-slate-400">
                      Run <code className="text-cyan-300">cd worker && npm install -g wrangler && wrangler deploy</code>. Set your secret with <code className="text-cyan-300">wrangler secret put GEMINI_API_KEY</code>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-purple-500/20 space-y-1">
                    <span className="font-bold text-white font-mono-code text-xs">2. Supabase PostgreSQL & Auth:</span>
                    <p className="text-[11px] text-slate-400">
                      Create a free Supabase project, navigate to SQL Editor, and paste the contents of <code className="text-cyan-300">/database/schema.sql</code>. Copy your Project URL & Anon Key into LUXION Settings.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-purple-500/20 space-y-1">
                    <span className="font-bold text-white font-mono-code text-xs">3. GitHub Pages Static Frontend:</span>
                    <p className="text-[11px] text-slate-400">
                      Run <code className="text-cyan-300">npm run build</code> and push the <code className="text-cyan-300">dist/</code> folder or use GitHub Actions with static Pages deployment.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
