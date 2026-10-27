export type AICoreStatus = 'idle' | 'processing' | 'speaking' | 'error' | 'offline';

export type WorkspaceType = 'chat' | 'study' | 'coding' | 'files' | 'settings';

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  base64Data?: string;
  textContent?: string;
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
  attachments?: FileAttachment[];
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  isPinned?: boolean;
}

export interface UserProfile {
  id: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  isGuest: boolean;
}

export interface StudyConcept {
  name: string;
  description: string;
}

export interface StudyStep {
  stepNumber: number;
  title: string;
  detail: string;
}

export interface Flashcard {
  front: string;
  back: string;
  category: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudyModule {
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  subject: string;
  explanation: string;
  keyConcepts: StudyConcept[];
  stepByStep: StudyStep[];
  flashcards: Flashcard[];
  practiceQuiz: QuizQuestion[];
  summary: string;
}

export interface AppSettings {
  autoSpeak: boolean;
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
  selectedVoiceName: string;
  soundEffects: boolean;
  reducedMotion: boolean;
  customBackendUrl: string; // e.g. Cloudflare Worker URL
  supabaseUrl: string;
  supabaseAnonKey: string;
}
