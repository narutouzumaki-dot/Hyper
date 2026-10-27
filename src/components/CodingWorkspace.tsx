import React, { useState } from 'react';
import { api } from '../services/api';
import { sounds } from '../services/soundEffects';
import {
  Code2,
  Bug,
  Zap,
  Play,
  Copy,
  Check,
  RotateCw,
  Sparkles,
  FileCode,
  Terminal,
  ShieldAlert,
} from 'lucide-react';

export const CodingWorkspace: React.FC = () => {
  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState(`// Welcome to LUXION Coding Lab
// Paste your code or select a template to inspect, debug, or optimize

async function fetchUserProfile(userId: string) {
  let cache: any = {};
  if (cache[userId]) {
    return cache[userId];
  }
  // Potential issue: cache is local and cleared every call
  const response = await fetch('/api/users/' + userId);
  const data = await response.json();
  cache[userId] = data;
  return data;
}`);
  const [action, setAction] = useState<'explain' | 'debug' | 'improve' | 'test'>('debug');
  const [userQuery, setUserQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const languages = [
    { id: 'typescript', label: 'TypeScript' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    { id: 'rust', label: 'Rust' },
    { id: 'go', label: 'Go' },
    { id: 'cpp', label: 'C++' },
    { id: 'sql', label: 'SQL' },
    { id: 'html', label: 'HTML / CSS' },
  ];

  const templates = [
    {
      title: 'Memory Leak / Cache Flaw (TS)',
      lang: 'typescript',
      code: `// Flawed cache & unhandled rejection
let activeRequests = new Map();

export async function loadUserData(userId: string) {
  if (activeRequests.has(userId)) {
    return activeRequests.get(userId);
  }
  const promise = fetch(\`/api/user/\${userId}\`).then(res => res.json());
  activeRequests.set(userId, promise);
  // Missing cleanup on failure!
  return promise;
}`,
    },
    {
      title: 'Fibonacci Recursion O(2^n) (Python)',
      lang: 'python',
      code: `# Suboptimal recursive Fibonacci
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Needs memoization or iterative approach`,
    },
    {
      title: 'SQL Injection Vulnerability (SQL)',
      lang: 'sql',
      code: `-- Vulnerable query pattern
SELECT * FROM users 
WHERE username = '' + userInput + '' 
AND password = '' + passwordHash + '';`,
    },
  ];

  const handleAnalyze = async (overrideAction?: 'explain' | 'debug' | 'improve' | 'test') => {
    if (!code.trim() || loading) return;

    const targetAction = overrideAction || action;
    sounds.playTransmit();
    setLoading(true);

    try {
      const res = await api.analyzeCode({
        code,
        language,
        action: targetAction,
        userQuestion: userQuery.trim() || undefined,
      });
      setResult(res.result);
      sounds.playNeuralChime();
    } catch (err: any) {
      sounds.playWarning();
      alert(`Coding Lab Analysis Error: ${err.message || 'Analysis failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    sounds.playClick();
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
      {/* Top Banner */}
      <div className="lux-glass-card rounded-2xl p-4 sm:p-5 border border-purple-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <h1 className="font-orbitron text-lg sm:text-xl font-bold text-white tracking-wide">
              LUXION Coding Lab
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Intelligent programming assistant: architectural explanations, deep debugging, automated refactoring, and test synthesis.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-black/60 border border-purple-500/30 text-xs text-cyan-300 font-mono-code outline-none focus:border-cyan-400"
          >
            {languages.map((l) => (
              <option key={l.id} value={l.id} className="bg-[#0b0c16]">
                {l.label}
              </option>
            ))}
          </select>

          {/* Action pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/50 border border-purple-500/30">
            {[
              { id: 'debug', label: 'Debug & Fix', icon: <Bug className="w-3.5 h-3.5" /> },
              { id: 'explain', label: 'Explain', icon: <Sparkles className="w-3.5 h-3.5" /> },
              { id: 'improve', label: 'Optimize', icon: <Zap className="w-3.5 h-3.5" /> },
              { id: 'test', label: 'Unit Tests', icon: <Play className="w-3.5 h-3.5" /> },
            ].map((act) => (
              <button
                key={act.id}
                onClick={() => {
                  sounds.playClick();
                  setAction(act.id as any);
                  handleAnalyze(act.id as any);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  action === act.id
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {act.icon}
                <span className="hidden sm:inline">{act.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Snippet Template Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] text-slate-500 font-mono-code">Load Template:</span>
        {templates.map((tpl, i) => (
          <button
            key={i}
            onClick={() => {
              sounds.playClick();
              setCode(tpl.code);
              setLanguage(tpl.lang);
            }}
            className="px-2.5 py-1 rounded-lg bg-purple-950/20 border border-purple-500/20 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/30 transition-all text-[11px]"
          >
            {tpl.title}
          </button>
        ))}
      </div>

      {/* Main Dual-Panel Editor + Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[580px]">
        {/* LEFT PANEL: Code Editor */}
        <div className="lux-glass-card rounded-2xl border border-purple-500/25 flex flex-col overflow-hidden shadow-2xl">
          {/* Editor Header */}
          <div className="px-4 py-2.5 border-b border-purple-500/20 bg-black/40 flex items-center justify-between text-xs text-slate-400 font-mono-code">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-purple-400" />
              <span>SOURCE_INPUT.{language}</span>
              <span className="text-[10px] text-slate-500">({lineCount} lines)</span>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                setCode('');
              }}
              className="hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Editor Body with Line Numbers */}
          <div className="flex-1 flex overflow-hidden bg-[#070710]/90">
            {/* Line numbers gutter */}
            <div className="w-10 sm:w-12 py-3 bg-black/40 select-none text-right pr-2 text-xs font-mono-code text-slate-600 border-r border-white/5 space-y-0.5 overflow-hidden">
              {Array.from({ length: Math.max(lineCount, 15) }).map((_, i) => (
                <div key={i} className="leading-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Input Area */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste or write your code here..."
              spellCheck={false}
              className="flex-1 p-3 bg-transparent text-xs sm:text-sm font-mono-code text-cyan-100 placeholder-slate-600 outline-none resize-none leading-6 overflow-y-auto selection:bg-purple-600/30"
            />
          </div>

          {/* User Inquiry Sub-bar */}
          <div className="p-3 border-t border-purple-500/20 bg-black/40 flex gap-2">
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Custom prompt (e.g. Optimize for low memory, convert to Rust)..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-purple-500/20 text-xs text-slate-200 outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => handleAnalyze()}
              disabled={loading || !code.trim()}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                code.trim() && !loading
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-purple-950/40 text-slate-600 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-300" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              )}
              <span>Run {action.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Neural Diagnosis & Code Suggestions */}
        <div className="lux-glass-card rounded-2xl border border-purple-500/25 flex flex-col overflow-hidden shadow-2xl">
          {/* Output Header */}
          <div className="px-4 py-2.5 border-b border-purple-500/20 bg-black/40 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="font-mono-code text-cyan-300">LUXION NEURAL DIAGNOSIS</span>
            </div>
            {result && (
              <button
                onClick={handleCopyResult}
                className="flex items-center gap-1 hover:text-white transition-colors"
                title="Copy analysis"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {/* Output Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans space-y-3 bg-[#05060d]/80">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3 text-center">
                <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-cyan-400 animate-spin" />
                <span className="text-xs font-mono-code text-cyan-300">
                  Executing AST parsing & neural verification...
                </span>
              </div>
            ) : result ? (
              <div className="whitespace-pre-wrap select-text">{result}</div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-2 text-center text-slate-500">
                <Code2 className="w-10 h-10 text-slate-700" />
                <p className="text-xs">
                  Press <span className="text-cyan-400 font-mono-code">Run {action.toUpperCase()}</span> to trigger deep algorithmic audit.
                </p>
              </div>
            )}
          </div>

          {/* Execution Environment Disclaimer Badge */}
          <div className="p-2.5 border-t border-purple-500/20 bg-black/60 flex items-center gap-2 text-[10px] text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              Analysis simulated via LUXION AI. Untrusted code is never directly executed on the host runtime.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
