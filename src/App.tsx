/**
 * LUXION AI — Ultimate AI Assistant
 * Tagline: Beyond Intelligence. Beyond Limits.
 * Premium futuristic dark interface in Deep Black, Electric Purple, and Neon Cyan.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  WorkspaceType,
  Conversation,
  ChatMessage,
  UserProfile,
  AppSettings,
  AICoreStatus,
  FileAttachment,
} from './types';
import { Header } from './components/Header';
import { ChatWorkspace } from './components/ChatWorkspace';
import { StudyWorkspace } from './components/StudyWorkspace';
import { CodingWorkspace } from './components/CodingWorkspace';
import { FileWorkspace } from './components/FileWorkspace';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { api } from './services/api';
import { speech } from './services/speech';
import { sounds } from './services/soundEffects';
import { supabaseService } from './services/supabaseClient';

const INITIAL_CONVERSATION_ID = 'thread-primary';

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: INITIAL_CONVERSATION_ID,
    title: 'Quantum Synapse Alpha',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg-greeting',
        role: 'model',
        content:
          'LUXION online. How can I assist you today?\n\nI am your personal AI assistant—ready to help you program, analyze documents and visual data, research complex subjects in Study Mode, or answer any question with precision.',
        timestamp: new Date().toISOString(),
      },
    ],
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  autoSpeak: false,
  voiceRate: 1.0,
  voicePitch: 1.0,
  voiceVolume: 1.0,
  selectedVoiceName: '',
  soundEffects: true,
  reducedMotion: false,
  customBackendUrl: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
};

export default function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType>('chat');
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('luxion_conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CONVERSATIONS;
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    return conversations[0]?.id || INITIAL_CONVERSATION_ID;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('luxion_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedName = localStorage.getItem('luxion_display_name') || 'LUXION Operative';
    return {
      id: 'local-guest',
      displayName: savedName,
      isGuest: true,
    };
  });

  const [aiCoreStatus, setAiCoreStatus] = useState<AICoreStatus>('idle');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeAbortControllerRef = useRef<AbortController | null>(null);

  // Sync settings to localStorage and services
  useEffect(() => {
    localStorage.setItem('luxion_settings', JSON.stringify(settings));
    sounds.setEnabled(settings.soundEffects);
    api.setCustomBaseUrl(settings.customBackendUrl);
  }, [settings]);

  // Sync conversations to localStorage and Supabase (if connected)
  useEffect(() => {
    localStorage.setItem('luxion_conversations', JSON.stringify(conversations));
    // If Supabase is connected and user is not a guest, sync current conversation
    if (supabaseService.isConfigured() && user && !user.isGuest) {
      const current = conversations.find((c) => c.id === activeConversationId);
      if (current) {
        supabaseService.saveConversation(current).catch(() => {});
      }
    }
  }, [conversations, activeConversationId, user]);

  // Check health on mount and every 30s
  useEffect(() => {
    const checkServer = async () => {
      const health = await api.checkHealth();
      setIsBackendOnline(health.status === 'online');
      if (health.status !== 'online') {
        setAiCoreStatus('offline');
      } else if (aiCoreStatus === 'offline') {
        setAiCoreStatus('idle');
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, [aiCoreStatus]);

  // Listen for speech synthesis events to toggle speaking state on AI Core Orb
  useEffect(() => {
    const unsubscribe = speech.onSpeakingChange((speaking) => {
      if (speaking) {
        setAiCoreStatus('speaking');
      } else if (aiCoreStatus === 'speaking') {
        setAiCoreStatus('idle');
      }
    });
    return unsubscribe;
  }, [aiCoreStatus]);

  // Initialize Supabase user if already logged in
  useEffect(() => {
    supabaseService.getCurrentUser().then((profile) => {
      if (profile) {
        setUser(profile);
        // Load cloud conversations
        supabaseService.loadConversations().then((cloudConvs) => {
          if (cloudConvs && cloudConvs.length > 0) {
            setConversations(cloudConvs);
            setActiveConversationId(cloudConvs[0].id);
          }
        });
      }
    });
  }, []);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleNewConversation = () => {
    sounds.playClick();
    const newId = `thread-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Neural Thread',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'model',
          content: 'LUXION online. How can I assist you today?',
          timestamp: new Date().toISOString(),
        },
      ],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    sounds.playClick();
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c))
    );
  };

  const handleDeleteConversation = (id: string) => {
    sounds.playWarning();
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        return INITIAL_CONVERSATIONS;
      }
      return remaining;
    });
    if (activeConversationId === id) {
      const next = conversations.find((c) => c.id !== id);
      setActiveConversationId(next ? next.id : INITIAL_CONVERSATION_ID);
    }
    if (supabaseService.isConfigured() && user && !user.isGuest) {
      supabaseService.deleteConversation(id).catch(() => {});
    }
  };

  const handleSendMessage = async (text: string, attachments?: FileAttachment[]) => {
    if (isGenerating) return;

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    if (!currentConv) return;

    // Create user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      attachments,
    };

    // Update conversation title automatically on first custom user message
    let updatedTitle = currentConv.title;
    if (currentConv.messages.length <= 1 && text.trim()) {
      updatedTitle = text.slice(0, 32).trim() + (text.length > 32 ? '...' : '');
    }

    const updatedMessages = [...currentConv.messages, userMsg];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              title: updatedTitle,
              updatedAt: new Date().toISOString(),
              messages: updatedMessages,
            }
          : c
      )
    );

    setIsGenerating(true);
    setAiCoreStatus('processing');

    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    try {
      // Build context for model
      const modelMessages = updatedMessages.map((m) => {
        let content = m.content;
        if (m.attachments && m.attachments.length > 0) {
          const filesSummary = m.attachments
            .map((f) => `[Attached: ${f.name} (${f.type})]`)
            .join(' ');
          content = `${filesSummary}\n${content}`;
        }
        return {
          role: m.role,
          content,
        };
      });

      const response = await api.sendChat(modelMessages, {
        signal: controller.signal,
      });

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'model',
        content: response.content,
        timestamp: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                updatedAt: new Date().toISOString(),
                messages: [...c.messages, aiMsg],
              }
            : c
        )
      );

      sounds.playNeuralChime();
      setAiCoreStatus('idle');

      // If auto-speak enabled, synthesize response aloud
      if (settings.autoSpeak) {
        speech.speak(response.content, {
          voiceName: settings.selectedVoiceName,
          rate: settings.voiceRate,
          pitch: settings.voicePitch,
          volume: settings.voiceVolume,
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        sounds.playWarning();
        setAiCoreStatus('idle');
        return;
      }

      console.error('[LUXION Chat Synthesis Error]', err);
      sounds.playWarning();
      setAiCoreStatus('error');

      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'model',
        content: `⚠️ LUXION Neural Core Alert:\n${
          err.message || 'Unable to establish link with AI core. Please check your network and configuration.'
        }`,
        timestamp: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, messages: [...c.messages, errorMsg] }
            : c
        )
      );

      setTimeout(() => setAiCoreStatus('idle'), 4000);
    } finally {
      setIsGenerating(false);
      activeAbortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (activeAbortControllerRef.current) {
      sounds.playClick();
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
      setIsGenerating(false);
      setAiCoreStatus('idle');
    }
  };

  const handleSignOut = async () => {
    await supabaseService.signOut();
    setUser({
      id: 'local-guest',
      displayName: 'LUXION Operative',
      isGuest: true,
    });
    sounds.playClick();
  };

  const handleClearHistory = () => {
    localStorage.removeItem('luxion_conversations');
    setConversations(INITIAL_CONVERSATIONS);
    setActiveConversationId(INITIAL_CONVERSATION_ID);
    sounds.playNeuralChime();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050509] text-slate-100 font-sans selection:bg-purple-600/30 selection:text-cyan-200">
      {/* Futuristic Background Gradients & Micro Star Particles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-fuchsia-600/8 rounded-full blur-[120px]" />
      </div>

      {/* Main Navigation Header */}
      <Header
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
        isBackendOnline={isBackendOnline}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        soundEnabled={settings.soundEffects}
        onToggleSound={() => handleUpdateSettings({ soundEffects: !settings.soundEffects })}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Workspace Routing */}
      <div className="flex-1 flex flex-col z-10 relative">
        {activeWorkspace === 'chat' && (
          <ChatWorkspace
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
            onNewConversation={handleNewConversation}
            onRenameConversation={handleRenameConversation}
            onDeleteConversation={handleDeleteConversation}
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            aiCoreStatus={aiCoreStatus}
            isGenerating={isGenerating}
            settings={settings}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        )}

        {activeWorkspace === 'study' && <StudyWorkspace />}

        {activeWorkspace === 'coding' && <CodingWorkspace />}

        {activeWorkspace === 'files' && <FileWorkspace />}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        user={user}
        onSignOut={handleSignOut}
        conversations={conversations}
        onClearHistory={handleClearHistory}
      />

      {/* Supabase Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={(profile) => {
          setUser(profile);
          setAuthOpen(false);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    </div>
  );
}
