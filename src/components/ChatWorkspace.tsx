import React, { useState, useRef, useEffect } from 'react';
import { Conversation, ChatMessage, AICoreStatus, FileAttachment, AppSettings } from '../types';
import { AICoreOrb } from './AICoreOrb';
import {
  Send,
  Mic,
  MicOff,
  Paperclip,
  Square,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  FileText,
  Image as ImageIcon,
  X,
  Search,
  Bot,
  User as UserIcon,
  RotateCcw,
} from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { speech } from '../services/speech';

interface ChatWorkspaceProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onSendMessage: (text: string, attachments?: FileAttachment[]) => Promise<void>;
  onStopGeneration: () => void;
  aiCoreStatus: AICoreStatus;
  isGenerating: boolean;
  settings: AppSettings;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onSendMessage,
  onStopGeneration,
  aiCoreStatus,
  isGenerating,
  settings,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<FileAttachment[]>([]);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentConv =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConv?.messages, isGenerating]);

  // Handle Voice Input
  const handleToggleVoice = () => {
    sounds.playClick();
    if (isListening) {
      speech.stopListening();
      setIsListening(false);
      return;
    }

    const started = speech.startListening({
      onResult: (transcript, isFinal) => {
        setInputText((prev) => (isFinal ? (prev ? `${prev} ${transcript}` : transcript) : transcript));
      },
      onError: (err) => {
        sounds.playWarning();
        setIsListening(false);
        console.warn('Speech error:', err);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (started) {
      setIsListening(true);
    }
  };

  // Handle Speech Output for a message
  const handleSpeakMessage = (msgId: string, content: string) => {
    sounds.playClick();
    if (speakingMessageId === msgId) {
      speech.stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }

    setSpeakingMessageId(msgId);
    speech.speak(content, {
      voiceName: settings.selectedVoiceName,
      rate: settings.voiceRate,
      pitch: settings.voicePitch,
      volume: settings.voiceVolume,
      onEnd: () => setSpeakingMessageId(null),
      onError: () => setSpeakingMessageId(null),
    });
  };

  const handleSend = async () => {
    if ((!inputText.trim() && pendingAttachments.length === 0) || isGenerating) return;

    sounds.playTransmit();
    const text = inputText;
    const files = [...pendingAttachments];
    setInputText('');
    setPendingAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage(text, files);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string, id: string) => {
    sounds.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // File Upload Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    sounds.playClick();
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const isImg = file.type.startsWith('image/');

      if (isImg) {
        reader.onload = () => {
          const base64Data = reader.result as string;
          setPendingAttachments((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              name: file.name,
              size: file.size,
              type: file.type,
              base64Data,
              previewUrl: base64Data,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          const textContent = reader.result as string;
          setPendingAttachments((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              name: file.name,
              size: file.size,
              type: file.type || 'text/plain',
              textContent,
            },
          ]);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestedPrompts = [
    { label: 'Explain Quantum Superposition', prompt: 'Explain quantum superposition and quantum entanglement in intuitive steps with practical examples.' },
    { label: 'Debug React Re-renders', prompt: 'How do I profile and eliminate unnecessary re-renders in React 19 apps using modern hooks?' },
    { label: 'Design Microservice API', prompt: 'Outline a clean, resilient microservices architecture with event-driven message queuing.' },
    { label: 'Summarize 5 Study Methods', prompt: 'Break down the top 5 scientifically validated study techniques (Feynman technique, active recall, etc.).' },
  ];

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] overflow-hidden relative">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept="text/*,application/json,application/pdf,image/*,.ts,.tsx,.js,.jsx,.py,.html,.css,.rs,.go,.md,.csv"
      />

      {/* Sidebar: Conversation History */}
      <aside
        className={`fixed md:static inset-y-16 left-0 z-30 w-72 bg-[#080912]/95 md:bg-[#070810]/70 border-r border-purple-500/20 backdrop-blur-xl flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-cyan-300">
              Threads
            </span>
            <button
              onClick={() => {
                sounds.playClick();
                setSidebarOpen(false);
              }}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onNewConversation();
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/80 to-cyan-600/80 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-black/40 border border-purple-500/20 focus:border-cyan-400 text-slate-200 placeholder-slate-500 outline-none"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">No threads found</p>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === currentConv?.id;
              const isEditing = editingConvId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    if (!isEditing) {
                      sounds.playClick();
                      onSelectConversation(conv.id);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }
                  }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                    isSelected
                      ? 'bg-purple-900/30 border border-purple-500/40 text-cyan-200 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-cyan-400 shadow-[0_0_6px_#06b6d4]' : 'bg-slate-600'
                      }`}
                    />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        autoFocus
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => {
                          if (editingTitle.trim()) {
                            onRenameConversation(conv.id, editingTitle.trim());
                          }
                          setEditingConvId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingTitle.trim()) {
                              onRenameConversation(conv.id, editingTitle.trim());
                            }
                            setEditingConvId(null);
                          } else if (e.key === 'Escape') {
                            setEditingConvId(null);
                          }
                        }}
                        className="w-full bg-black/60 border border-cyan-400 px-1 py-0.5 rounded text-white text-xs outline-none"
                      />
                    ) : (
                      <span className="truncate font-medium">{conv.title}</span>
                    )}
                  </div>

                  {/* Actions on hover */}
                  {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingConvId(conv.id);
                          setEditingTitle(conv.title);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-300"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {conversations.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playWarning();
                            onDeleteConversation(conv.id);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-red-400"
                          title="Delete thread"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-purple-500/20 text-[10px] text-slate-500 flex justify-between items-center">
          <span>{conversations.length} Threads Stored</span>
          <span className="text-purple-400 font-mono-code">ENCRYPTED</span>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#05050a] relative cyber-grid">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Welcome Screen when conversation has only initial greeting or empty */}
          {(!currentConv?.messages || currentConv.messages.length === 0) && (
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center text-center py-10 space-y-6">
              <AICoreOrb
                status={aiCoreStatus}
                size="lg"
                reducedMotion={settings.reducedMotion}
                isListening={isListening}
                onClick={handleToggleVoice}
              />

              <div className="space-y-2">
                <h1 className="font-orbitron text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-400">
                  LUXION AI
                </h1>
                <p className="text-cyan-300 font-mono-code text-sm tracking-wide">
                  "LUXION online. How can I assist you today?"
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Beyond Intelligence. Beyond Limits. Ask complex questions, write & debug code, analyze files, or activate voice.
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-4">
                {suggestedPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sounds.playClick();
                      onSendMessage(item.prompt);
                    }}
                    className="p-3 text-left rounded-xl bg-purple-950/20 hover:bg-purple-900/30 border border-purple-500/20 hover:border-cyan-400/40 text-xs text-slate-300 transition-all group flex items-start gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="font-semibold text-white block group-hover:text-cyan-300 transition-colors">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{item.prompt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Conversation Messages */}
          {currentConv?.messages?.map((msg) => {
            const isUser = msg.role === 'user';
            const isSpeakingThis = speakingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-md ${
                    isUser
                      ? 'bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white'
                      : 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-4 text-sm max-w-[88%] sm:max-w-xl transition-all ${
                    isUser
                      ? 'bg-purple-950/50 border border-purple-500/30 text-slate-100 shadow-[0_4px_20px_rgba(168,85,247,0.1)]'
                      : 'lux-glass border border-cyan-500/20 text-slate-200 shadow-[0_4px_20px_rgba(6,182,212,0.08)]'
                  }`}
                >
                  {/* File Attachments inside message if any */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {msg.attachments.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/50 border border-purple-500/30 text-xs text-cyan-200"
                        >
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-purple-400" />
                          )}
                          <span className="truncate max-w-[150px]">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap leading-relaxed select-text font-sans break-words">
                    {msg.content}
                  </div>

                  {/* Footer & Controls */}
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono-code text-[10px]">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {!isUser && (
                      <div className="flex items-center gap-2">
                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Speak Button */}
                        <button
                          onClick={() => handleSpeakMessage(msg.id, msg.content)}
                          className={`p-1 rounded hover:bg-white/10 transition-colors ${
                            isSpeakingThis ? 'text-cyan-400 animate-pulse' : 'text-slate-400 hover:text-purple-300'
                          }`}
                          title={isSpeakingThis ? 'Stop speaking' : 'Read response aloud'}
                        >
                          {isSpeakingThis ? (
                            <VolumeX className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Synapse State */}
          {isGenerating && (
            <div className="flex items-center gap-3 mr-auto max-w-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="lux-glass px-4 py-3 rounded-2xl flex items-center gap-3 border border-purple-500/30">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-mono-code text-cyan-300">
                  Neural link synthesizing response...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Area */}
        <div className="p-3 sm:p-5 border-t border-purple-500/20 bg-[#070710]/90 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Attachment Chips */}
            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-1">
                {pendingAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/40 text-xs text-cyan-200"
                  >
                    {att.type.startsWith('image/') ? (
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span className="truncate max-w-[140px] font-mono-code">{att.name}</span>
                    <button
                      onClick={() =>
                        setPendingAttachments((prev) => prev.filter((f) => f.id !== att.id))
                      }
                      className="text-slate-400 hover:text-red-400 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Live voice indicator banner if listening */}
            {isListening && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/40 text-xs text-cyan-300 animate-pulse">
                <div className="flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Listening... Speak naturally to LUXION</span>
                </div>
                <button
                  onClick={handleToggleVoice}
                  className="text-xs underline text-slate-400 hover:text-white"
                >
                  Done
                </button>
              </div>
            )}

            {/* Textarea & Buttons Row */}
            <div className="relative flex items-end gap-2 rounded-2xl bg-black/60 border border-purple-500/30 focus-within:border-cyan-400/80 p-2 shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all">
              {/* Attach File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-colors"
                title="Attach file (PDF, TXT, JSON, Code, Images)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Voice Input Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-2.5 rounded-xl transition-all ${
                  isListening
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_#06b6d4] animate-pulse'
                    : 'text-slate-400 hover:text-purple-300 hover:bg-white/5'
                }`}
                title={isListening ? 'Stop listening' : 'Speak to LUXION'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask LUXION anything... (Shift+Enter for newline)"
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none resize-none py-2 px-1 max-h-44"
              />

              {/* Send or Stop Generation Button */}
              {isGenerating ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="p-2.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white shadow-lg transition-all"
                  title="Stop generation"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() && pendingAttachments.length === 0}
                  className={`p-2.5 rounded-xl transition-all ${
                    inputText.trim() || pendingAttachments.length > 0
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:opacity-90'
                      : 'text-slate-600 cursor-not-allowed'
                  }`}
                  title="Transmit message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Helper Subtext */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span className="font-mono-code text-[10px]">MODEL: gemini-3.8-flash</span>
              <span>Encrypted Neural Link • Press Enter to transmit</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
