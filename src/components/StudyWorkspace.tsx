import React, { useState } from 'react';
import { StudyModule } from '../types';
import { api } from '../services/api';
import { sounds } from '../services/soundEffects';
import { speech } from '../services/speech';
import {
  GraduationCap,
  BookOpen,
  HelpCircle,
  Layers,
  ChevronRight,
  ChevronLeft,
  RotateCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Send,
  MessageSquare,
  Volume2,
} from 'lucide-react';

export const StudyWorkspace: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [subject, setSubject] = useState('Computer Science');
  const [loading, setLoading] = useState(false);
  const [studyModule, setStudyModule] = useState<StudyModule | null>(null);
  const [activeTab, setActiveTab] = useState<'explanation' | 'steps' | 'flashcards' | 'quiz'>('explanation');

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<number[]>([]);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: number }>({});
  const [showExplanation, setShowExplanation] = useState<{ [qId: number]: boolean }>({});

  // Follow-up conversation
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [followUpAnswers, setFollowUpAnswers] = useState<{ query: string; answer: string }[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const subjects = [
    'Computer Science',
    'Artificial Intelligence',
    'Mathematics',
    'Physics',
    'Biology & Medicine',
    'Philosophy & Ethics',
    'Finance & Economics',
  ];

  const quickTopics = [
    'Backpropagation in Neural Networks',
    'Quantum Key Distribution (QKD)',
    'Event-Driven Microservices',
    'Epigenetics and Gene Regulation',
    'Zero-Knowledge Proofs (ZK-SNARKs)',
  ];

  const handleGenerate = async (targetTopic?: string) => {
    const finalTopic = targetTopic || topic;
    if (!finalTopic.trim() || loading) return;

    sounds.playTransmit();
    setLoading(true);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setMasteredCards([]);
    setSelectedAnswers({});
    setShowExplanation({});
    setFollowUpAnswers([]);

    try {
      const data = await api.generateStudyModule({
        topic: finalTopic,
        difficulty,
        subject,
      });
      setStudyModule(data);
      sounds.playNeuralChime();
    } catch (err: any) {
      sounds.playWarning();
      alert(`Study Module Generation: ${err.message || 'Error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFlipCard = () => {
    sounds.playCardFlip();
    setIsFlipped(!isFlipped);
  };

  const handleCardMastery = (index: number) => {
    sounds.playClick();
    if (!masteredCards.includes(index)) {
      setMasteredCards((prev) => [...prev, index]);
    } else {
      setMasteredCards((prev) => prev.filter((i) => i !== index));
    }
  };

  const handleSelectQuizAnswer = (qId: number, optionIdx: number) => {
    sounds.playClick();
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
    setShowExplanation((prev) => ({ ...prev, [qId]: true }));
  };

  const handleFollowUp = async () => {
    if (!followUpQuery.trim() || followUpLoading || !studyModule) return;
    sounds.playTransmit();
    const q = followUpQuery;
    setFollowUpQuery('');
    setFollowUpLoading(true);

    try {
      const prompt = `Context: The student is studying "${studyModule.topic}" (${difficulty} level).
Student's follow-up question: "${q}"
Please give a clear, encouraging, step-by-step tutoring explanation tailored to their difficulty level.`;

      const res = await api.sendChat([{ role: 'user', content: prompt }]);
      setFollowUpAnswers((prev) => [...prev, { query: q, answer: res.content }]);
      sounds.playNeuralChime();
    } catch (err: any) {
      sounds.playWarning();
      alert(`Tutor error: ${err.message}`);
    } finally {
      setFollowUpLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="lux-glass-card rounded-2xl p-5 sm:p-6 border border-purple-500/25 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/10 via-purple-500/10 to-transparent pointer-events-none rounded-full blur-2xl" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-cyan-400" />
              <h1 className="font-orbitron text-xl sm:text-2xl font-bold text-white tracking-wide">
                LUXION Study Mode
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Adaptive AI tutoring with step-by-step breakdowns, interactive flashcards, and practice evaluations.
            </p>
          </div>

          {/* Difficulty selector pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/50 border border-purple-500/30">
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  sounds.playClick();
                  setDifficulty(lvl);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  difficulty === lvl
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Input Bar */}
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-black/60 border border-purple-500/30 text-xs text-slate-200 outline-none focus:border-cyan-400"
            >
              {subjects.map((s) => (
                <option key={s} value={s} className="bg-[#0b0c16]">
                  {s}
                </option>
              ))}
            </select>

            <div className="sm:col-span-2 flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="Enter any topic to learn (e.g. Distributed Consensus Algorithms)..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-purple-500/30 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={loading || !topic.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shrink-0 ${
                  topic.trim() && !loading
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:opacity-95'
                    : 'bg-purple-950/40 text-slate-500 border border-purple-500/20 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Generate Module</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick topic pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500 font-mono-code mr-1">Trending:</span>
            {quickTopics.map((qt) => (
              <button
                key={qt}
                onClick={() => {
                  setTopic(qt);
                  handleGenerate(qt);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-purple-950/30 border border-purple-500/20 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/30 transition-all"
              >
                {qt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Module Content */}
      {studyModule && (
        <div className="space-y-6">
          {/* Module Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-purple-500/20 pb-3">
            {[
              { id: 'explanation', label: 'Concept & Breakdown', icon: <BookOpen className="w-4 h-4" /> },
              { id: 'steps', label: 'Step-by-Step Teaching', icon: <Layers className="w-4 h-4" /> },
              {
                id: 'flashcards',
                label: `Flashcards (${studyModule.flashcards?.length || 0})`,
                icon: <RotateCw className="w-4 h-4" />,
              },
              {
                id: 'quiz',
                label: `Practice Quiz (${studyModule.practiceQuiz?.length || 0})`,
                icon: <HelpCircle className="w-4 h-4" />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600/90 to-cyan-600/90 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-purple-500/10'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: Explanation & Concepts */}
          {activeTab === 'explanation' && (
            <div className="space-y-6">
              <div className="lux-glass-card rounded-2xl p-6 border border-purple-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-orbitron text-lg font-bold text-cyan-300">
                    Comprehensive Explanation
                  </h2>
                  <button
                    onClick={() => speech.speak(studyModule.explanation)}
                    className="p-1.5 rounded-lg bg-black/40 text-slate-400 hover:text-cyan-300 transition-colors"
                    title="Read explanation aloud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {studyModule.explanation}
                </p>

                {/* Revision Summary Box */}
                {studyModule.summary && (
                  <div className="mt-4 p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
                    <span className="text-xs font-mono-code font-bold text-cyan-300 uppercase">
                      Executive Revision Summary
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{studyModule.summary}</p>
                  </div>
                )}
              </div>

              {/* Key Concepts Grid */}
              {studyModule.keyConcepts?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-orbitron text-sm font-bold text-slate-300 tracking-wider">
                    Core Pillars & Concepts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {studyModule.keyConcepts.map((c, i) => (
                      <div
                        key={i}
                        className="lux-glass rounded-xl p-4 border border-purple-500/20 hover:border-cyan-400/40 transition-all space-y-1"
                      >
                        <span className="font-orbitron text-xs font-bold text-purple-300">
                          {c.name}
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Step-by-Step */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <h2 className="font-orbitron text-base font-bold text-cyan-300">
                Step-by-Step Procedural Breakdown
              </h2>
              <div className="space-y-3">
                {studyModule.stepByStep?.map((step, idx) => (
                  <div
                    key={idx}
                    className="lux-glass rounded-xl p-4 sm:p-5 border border-purple-500/20 flex gap-4 items-start"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 text-white font-mono-code font-bold text-sm flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                      {step.stepNumber || idx + 1}
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="font-semibold text-sm text-slate-100">{step.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Flashcards */}
          {activeTab === 'flashcards' && studyModule.flashcards?.length > 0 && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Card {currentCardIndex + 1} of {studyModule.flashcards.length}
                </span>
                <span className="text-emerald-400 font-mono-code">
                  Mastered: {masteredCards.length}/{studyModule.flashcards.length}
                </span>
              </div>

              {/* Flashcard Component */}
              <div
                onClick={handleFlipCard}
                className="w-full h-64 sm:h-72 rounded-2xl lux-glass-card border border-purple-500/40 p-6 flex flex-col justify-between cursor-pointer select-none relative shadow-[0_0_25px_rgba(168,85,247,0.2)] hover:border-cyan-400/50 transition-all transform active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded bg-purple-900/40 text-cyan-300 border border-purple-500/30">
                    {studyModule.flashcards[currentCardIndex].category || 'Concept'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <RotateCw className="w-3 h-3 text-cyan-400" /> Click to flip
                  </span>
                </div>

                <div className="my-auto text-center px-4">
                  {isFlipped ? (
                    <div className="space-y-2 animate-fadeIn">
                      <span className="text-[10px] uppercase font-mono-code text-cyan-400 tracking-wider">
                        ANSWER / DEFINITION
                      </span>
                      <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
                        {studyModule.flashcards[currentCardIndex].back}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-mono-code text-purple-400 tracking-wider">
                        PROMPT / QUESTION
                      </span>
                      <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                        {studyModule.flashcards[currentCardIndex].front}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardMastery(currentCardIndex);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                      masteredCards.includes(currentCardIndex)
                        ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {masteredCards.includes(currentCardIndex) ? '✓ Mastered' : 'Mark as Mastered'}
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono-code">SPACE / CLICK</span>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) =>
                      prev > 0 ? prev - 1 : studyModule.flashcards.length - 1
                    );
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) =>
                      prev < studyModule.flashcards.length - 1 ? prev + 1 : 0
                    );
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Practice Quiz */}
          {activeTab === 'quiz' && studyModule.practiceQuiz?.length > 0 && (
            <div className="space-y-6">
              <h2 className="font-orbitron text-base font-bold text-cyan-300">
                Interactive Knowledge Evaluation
              </h2>

              <div className="space-y-5">
                {studyModule.practiceQuiz.map((q, idx) => {
                  const selected = selectedAnswers[q.id];
                  const hasAnswered = selected !== undefined;
                  const isCorrect = selected === q.correctIndex;

                  return (
                    <div
                      key={q.id || idx}
                      className="lux-glass-card rounded-2xl p-5 sm:p-6 border border-purple-500/20 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-semibold text-sm sm:text-base text-white">
                          <span className="text-cyan-400 font-mono-code mr-2">Q{idx + 1}.</span>
                          {q.question}
                        </h4>
                        {hasAnswered && (
                          <div className="shrink-0">
                            {isCorrect ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-500/30">
                                <XCircle className="w-3.5 h-3.5" /> Incorrect
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options?.map((opt, optIdx) => {
                          let optClasses = 'bg-black/40 border-purple-500/20 text-slate-300 hover:bg-white/5';
                          if (hasAnswered) {
                            if (optIdx === q.correctIndex) {
                              optClasses = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                            } else if (selected === optIdx) {
                              optClasses = 'bg-red-950/60 border-red-500 text-red-200';
                            } else {
                              optClasses = 'bg-black/20 border-slate-800 text-slate-500';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={hasAnswered}
                              onClick={() => handleSelectQuizAnswer(q.id, optIdx)}
                              className={`p-3 rounded-xl border text-xs sm:text-sm text-left transition-all ${optClasses}`}
                            >
                              <span className="font-mono-code text-[11px] text-purple-400 mr-2">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      {hasAnswered && showExplanation[q.id] && (
                        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-slate-300 space-y-1">
                          <span className="font-mono-code font-bold text-cyan-300">Rationale:</span>
                          <p>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Follow-up Q&A Tutor Section */}
          <div className="pt-6 border-t border-purple-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <h3 className="font-orbitron text-sm font-bold text-white">
                Follow-Up Tutor Inquiries
              </h3>
            </div>

            {/* Answered followups */}
            {followUpAnswers.map((item, i) => (
              <div key={i} className="lux-glass rounded-xl p-4 border border-purple-500/20 space-y-2">
                <p className="text-xs font-semibold text-cyan-300">Q: {item.query}</p>
                <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                type="text"
                value={followUpQuery}
                onChange={(e) => setFollowUpQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()}
                placeholder="Ask LUXION a specific question about this topic..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-purple-500/30 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleFollowUp}
                disabled={!followUpQuery.trim() || followUpLoading}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  followUpQuery.trim() && !followUpLoading
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-purple-950/40 text-slate-500 border border-purple-500/20 cursor-not-allowed'
                }`}
              >
                {followUpLoading ? <RotateCw className="w-4 h-4 animate-spin text-cyan-300" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Ask Tutor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
