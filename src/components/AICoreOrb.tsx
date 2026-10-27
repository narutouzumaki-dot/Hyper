import React from 'react';
import { AICoreStatus } from '../types';
import { Mic, Activity, AlertTriangle, WifiOff, Volume2 } from 'lucide-react';

interface AICoreOrbProps {
  status: AICoreStatus;
  size?: 'sm' | 'md' | 'lg';
  reducedMotion?: boolean;
  isListening?: boolean;
  onClick?: () => void;
  className?: string;
}

export const AICoreOrb: React.FC<AICoreOrbProps> = ({
  status,
  size = 'md',
  reducedMotion = false,
  isListening = false,
  onClick,
  className = '',
}) => {
  // Dimensions
  const dimensionClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32 md:w-40 md:h-40',
    lg: 'w-48 h-48 md:w-60 md:h-60',
  }[size];

  // Colors & Glow states
  const isProcessing = status === 'processing';
  const isSpeaking = status === 'speaking';
  const isError = status === 'error';
  const isOffline = status === 'offline';

  let glowColor = 'rgba(168, 85, 247, 0.45)'; // Electric purple
  let coreBg = 'radial-gradient(circle at 35% 35%, #00f0ff 0%, #a855f7 45%, #3b0764 80%, #050509 100%)';
  let ringColor1 = 'rgba(6, 182, 212, 0.7)'; // Neon Cyan
  let ringColor2 = 'rgba(168, 85, 247, 0.7)'; // Electric Purple

  if (isListening) {
    glowColor = 'rgba(6, 182, 212, 0.75)';
    coreBg = 'radial-gradient(circle at 40% 40%, #ffffff 0%, #22d3ee 40%, #0891b2 75%, #030712 100%)';
    ringColor1 = 'rgba(255, 255, 255, 0.8)';
    ringColor2 = 'rgba(6, 182, 212, 0.85)';
  } else if (isProcessing) {
    glowColor = 'rgba(217, 70, 239, 0.7)';
    coreBg = 'radial-gradient(circle at 50% 50%, #f472b6 0%, #a855f7 50%, #06b6d4 90%, #050509 100%)';
    ringColor1 = 'rgba(217, 70, 239, 0.85)';
    ringColor2 = 'rgba(6, 182, 212, 0.85)';
  } else if (isSpeaking) {
    glowColor = 'rgba(6, 182, 212, 0.85)';
    coreBg = 'radial-gradient(circle at 30% 30%, #67e8f9 0%, #9333ea 50%, #164e63 85%, #050509 100%)';
    ringColor1 = 'rgba(34, 211, 238, 0.9)';
    ringColor2 = 'rgba(192, 132, 252, 0.8)';
  } else if (isError || isOffline) {
    glowColor = 'rgba(239, 68, 68, 0.6)';
    coreBg = 'radial-gradient(circle at 40% 40%, #f87171 0%, #dc2626 50%, #450a0a 85%, #050509 100%)';
    ringColor1 = 'rgba(239, 68, 68, 0.7)';
    ringColor2 = 'rgba(245, 158, 11, 0.6)';
  }

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer select-none group transition-transform ${
        onClick ? 'hover:scale-105 active:scale-95' : ''
      } ${dimensionClasses} ${className}`}
      title={
        isListening
          ? 'LUXION Listening... Speak now'
          : isProcessing
          ? 'LUXION Processing...'
          : isSpeaking
          ? 'LUXION Speaking'
          : isOffline
          ? 'LUXION Offline'
          : 'LUXION AI Core — Click to talk'
      }
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Outer Atmospheric Aura Glow */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none ${
          reducedMotion ? '' : isProcessing ? 'animate-ping' : isSpeaking ? 'animate-pulse' : ''
        }`}
        style={{
          background: glowColor,
          filter: 'blur(36px)',
          opacity: isProcessing || isSpeaking || isListening ? 0.75 : 0.35,
          transform: 'scale(1.2)',
        }}
      />

      {/* Outer SVG Energy Ring 1 (Clockwise) */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none transition-transform duration-1000 ${
          reducedMotion
            ? ''
            : isProcessing
            ? 'animate-spin'
            : isSpeaking
            ? 'animate-pulse'
            : 'animate-spin'
        }`}
        style={{
          animationDuration: isProcessing ? '2.5s' : isSpeaking ? '1.5s' : '18s',
        }}
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={ringColor1}
          strokeWidth="1.2"
          strokeDasharray="8 6 2 4 12 8"
          strokeLinecap="round"
          opacity={isOffline ? 0.3 : 0.8}
        />
        <circle
          cx="50"
          cy="4"
          r="2.5"
          fill="#00f0ff"
          className={reducedMotion ? '' : 'animate-ping'}
        />
      </svg>

      {/* Middle SVG Energy Ring 2 (Counter-Clockwise) */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none transition-transform duration-1000 ${
          reducedMotion ? '' : 'animate-spin'
        }`}
        style={{
          animationDuration: isProcessing ? '4s' : '26s',
          animationDirection: 'reverse',
        }}
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={ringColor2}
          strokeWidth="1.4"
          strokeDasharray="14 10 4 12"
          strokeLinecap="round"
          opacity={isOffline ? 0.3 : 0.7}
        />
        <circle cx="90" cy="50" r="2" fill="#d946ef" />
      </svg>

      {/* Speaking Voice Soundwave Equalizer Rings */}
      {isSpeaking && !reducedMotion && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-full rounded-full border border-cyan-400/40 animate-ping" />
          <div
            className="w-3/4 h-3/4 rounded-full border border-purple-400/40 animate-ping"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      )}

      {/* Central Luminous Sphere Core */}
      <div
        className={`relative z-10 w-2/3 h-2/3 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 overflow-hidden border border-white/20 ${
          reducedMotion ? '' : 'animate-pulse-slow'
        }`}
        style={{
          background: coreBg,
          boxShadow: `0 0 35px 2px ${glowColor}, inset 0 0 15px rgba(255,255,255,0.4)`,
        }}
      >
        {/* Specular glass reflection */}
        <div className="absolute -top-3 -left-3 w-3/4 h-3/4 rounded-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none transform -rotate-45" />

        {/* Center Quantum Symbol or Icon */}
        <div className="relative z-20 text-white flex flex-col items-center justify-center">
          {isListening ? (
            <Mic className="w-6 h-6 md:w-8 md:h-8 text-cyan-200 animate-bounce" />
          ) : isProcessing ? (
            <Activity className="w-6 h-6 md:w-8 md:h-8 text-white animate-spin" />
          ) : isSpeaking ? (
            <Volume2 className="w-6 h-6 md:w-8 md:h-8 text-cyan-100 animate-pulse" />
          ) : isOffline ? (
            <WifiOff className="w-6 h-6 md:w-7 md:h-7 text-red-200" />
          ) : isError ? (
            <AlertTriangle className="w-6 h-6 md:w-7 md:h-7 text-amber-200" />
          ) : (
            <div className="relative flex items-center justify-center">
              {/* Futuristic LUXION Core Geometry */}
              <div className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-full shadow-[0_0_12px_#00f0ff]" />
              <div
                className={`absolute w-7 h-7 md:w-9 md:h-9 border border-cyan-300/60 rounded-full ${
                  reducedMotion ? '' : 'animate-spin'
                }`}
                style={{ animationDuration: '10s' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Micro Status Chip */}
      <div className="absolute -bottom-5 z-20 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-mono-code font-bold backdrop-blur-md bg-black/80 border border-purple-500/30 text-cyan-300 shadow-lg">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isListening
              ? 'bg-cyan-400 animate-ping'
              : isProcessing
              ? 'bg-fuchsia-400 animate-ping'
              : isSpeaking
              ? 'bg-cyan-400 animate-pulse'
              : isOffline
              ? 'bg-red-500'
              : 'bg-emerald-400'
          }`}
        />
        <span>
          {isListening
            ? 'LISTENING'
            : isProcessing
            ? 'SYNAPSE'
            : isSpeaking
            ? 'SPEAKING'
            : isOffline
            ? 'OFFLINE'
            : 'ONLINE'}
        </span>
      </div>
    </div>
  );
};
