import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { sounds } from '../services/soundEffects';
import {
  FileSearch,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Table,
  Check,
  Copy,
  RotateCw,
  Sparkles,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface ParsedFileInfo {
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  textContent?: string;
  base64Data?: string;
  isImage: boolean;
  isJson: boolean;
  isCsv: boolean;
  meta: {
    lines?: number;
    rows?: number;
    cols?: number;
    jsonKeys?: string[];
  };
}

export const FileWorkspace: React.FC = () => {
  const [fileInfo, setFileInfo] = useState<ParsedFileInfo | null>(null);
  const [task, setTask] = useState<'summary' | 'insights' | 'bugs' | 'general'>('summary');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleProcessFile = (file: File) => {
    setErrorMsg(null);
    setAnalysisResult(null);

    // Max size check (15MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File exceeds the 15MB limit for inline analysis.');
      sounds.playWarning();
      return;
    }

    const isImg = file.type.startsWith('image/');
    const isJson = file.name.endsWith('.json') || file.type === 'application/json';
    const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv';
    const isPdf = file.name.endsWith('.pdf') || file.type === 'application/pdf';

    sounds.playClick();

    if (isImg) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setFileInfo({
          name: file.name,
          size: file.size,
          type: file.type,
          previewUrl: base64,
          base64Data: base64,
          isImage: true,
          isJson: false,
          isCsv: false,
          meta: {},
        });
      };
      reader.readAsDataURL(file);
    } else if (isPdf) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const cleanText = text.replace(/[\x00-\x08\x0E-\x1F]/g, ' ').slice(0, 50000);
        setFileInfo({
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
          textContent: cleanText,
          isImage: false,
          isJson: false,
          isCsv: false,
          meta: { lines: cleanText.split('\n').length },
        });
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        let meta: any = { lines: text.split('\n').length };

        if (isJson) {
          try {
            const parsed = JSON.parse(text);
            meta.jsonKeys = Object.keys(parsed).slice(0, 15);
          } catch {}
        } else if (isCsv) {
          const rows = text.trim().split('\n');
          const cols = rows[0]?.split(',').length || 0;
          meta.rows = rows.length;
          meta.cols = cols;
        }

        setFileInfo({
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          textContent: text,
          isImage: false,
          isJson,
          isCsv,
          meta,
        });
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRunAnalysis = async () => {
    if (!fileInfo || loading) return;

    sounds.playTransmit();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.analyzeFile({
        fileName: fileInfo.name,
        fileType: fileInfo.type,
        fileContent: fileInfo.textContent,
        base64Data: fileInfo.base64Data,
        task,
        prompt: customPrompt.trim() || undefined,
      });

      setAnalysisResult(res.analysis);
      sounds.playNeuralChime();
    } catch (err: any) {
      sounds.playWarning();
      setErrorMsg(err.message || 'Analysis failed. Please verify file format.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    sounds.playClick();
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Banner */}
      <div className="lux-glass-card rounded-2xl p-5 sm:p-6 border border-purple-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-cyan-400" />
            <h1 className="font-orbitron text-xl sm:text-2xl font-bold text-white tracking-wide">
              File Analysis Workspace
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Deep multimodal analysis for documents, PDFs, structured CSV & JSON datasets, code repositories, and visual assets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono-code text-slate-400">
          <span className="px-2 py-0.5 rounded bg-black/40 border border-purple-500/30 text-purple-300">
            PDF
          </span>
          <span className="px-2 py-0.5 rounded bg-black/40 border border-cyan-500/30 text-cyan-300">
            CSV / JSON
          </span>
          <span className="px-2 py-0.5 rounded bg-black/40 border border-fuchsia-500/30 text-fuchsia-300">
            TXT / MD
          </span>
          <span className="px-2 py-0.5 rounded bg-black/40 border border-emerald-500/30 text-emerald-300">
            CODE
          </span>
          <span className="px-2 py-0.5 rounded bg-black/40 border border-amber-500/30 text-amber-300">
            IMAGES
          </span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
        className="hidden"
        accept="text/*,application/json,application/pdf,image/*,.ts,.tsx,.js,.jsx,.py,.html,.css,.rs,.go,.md,.csv"
      />

      {!fileInfo ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_30px_rgba(6,182,212,0.3)]'
              : 'border-purple-500/30 hover:border-cyan-500/50 hover:bg-white/5 bg-black/30'
          }`}
        >
          <div className="max-w-md mx-auto flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/30 to-cyan-600/30 border border-purple-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-orbitron text-base font-bold text-white">
                Drop your file here, or browse
              </h3>
              <p className="text-xs text-slate-400">
                Supports PDF, CSV, JSON, Markdown, Source Code (.ts, .py, .go), and Images (PNG, JPG, WEBP).
              </p>
            </div>
            <span className="text-[11px] font-mono-code px-3 py-1 rounded-full bg-purple-950/60 text-cyan-300 border border-purple-500/40">
              Max file size: 15 MB
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="lux-glass-card rounded-2xl p-5 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/40 to-cyan-500/40 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                {fileInfo.isImage ? (
                  <ImageIcon className="w-6 h-6" />
                ) : fileInfo.isJson || fileInfo.isCsv ? (
                  <Table className="w-6 h-6" />
                ) : (
                  <FileText className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-white truncate max-w-sm">{fileInfo.name}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono-code pt-0.5">
                  <span>{formatFileSize(fileInfo.size)}</span>
                  <span>•</span>
                  <span>{fileInfo.type || 'Custom Format'}</span>
                  {fileInfo.meta.lines && (
                    <>
                      <span>•</span>
                      <span>{fileInfo.meta.lines} lines</span>
                    </>
                  )}
                  {fileInfo.meta.rows && (
                    <>
                      <span>•</span>
                      <span>{fileInfo.meta.rows} rows × {fileInfo.meta.cols} cols</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-slate-300 transition-all"
              >
                Change File
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setFileInfo(null);
                  setAnalysisResult(null);
                }}
                className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {fileInfo.previewUrl && (
            <div className="lux-glass rounded-xl p-4 border border-purple-500/20 flex justify-center bg-black/60">
              <img
                src={fileInfo.previewUrl}
                alt="File preview"
                className="max-h-64 rounded-lg object-contain shadow-md"
              />
            </div>
          )}

          <div className="lux-glass-card rounded-2xl p-5 border border-purple-500/20 space-y-4">
            <h4 className="font-orbitron text-xs font-bold text-slate-300 uppercase tracking-wider">
              Select Analysis Directive
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'summary', label: 'Executive Summary', icon: <FileText className="w-3.5 h-3.5" /> },
                { id: 'insights', label: 'Key Insights & Trends', icon: <Sparkles className="w-3.5 h-3.5" /> },
                { id: 'bugs', label: 'Security & Bug Audit', icon: <AlertCircle className="w-3.5 h-3.5" /> },
                { id: 'general', label: 'Custom Inquiry', icon: <FileSearch className="w-3.5 h-3.5" /> },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    sounds.playClick();
                    setTask(opt.id as any);
                  }}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                    task === opt.id
                      ? 'bg-gradient-to-r from-purple-600/80 to-cyan-600/80 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-black/30 border-purple-500/20 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis()}
                placeholder="Specific question about this file (e.g. Which column has missing values? Explain the main algorithm)..."
                className="flex-1 px-4 py-2 rounded-xl bg-black/60 border border-purple-500/20 text-xs sm:text-sm text-slate-200 outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleRunAnalysis}
                disabled={loading}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                  !loading
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-purple-950/40 text-slate-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Analyze File</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {analysisResult && (
            <div className="lux-glass-card rounded-2xl p-6 border border-cyan-500/30 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-orbitron text-base font-bold text-white">
                    LUXION Intelligence Report
                  </h3>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-black/40 border border-purple-500/20"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Report'}</span>
                </button>
              </div>

              <div className="whitespace-pre-wrap text-xs sm:text-sm text-slate-200 leading-relaxed font-sans select-text">
                {analysisResult}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
