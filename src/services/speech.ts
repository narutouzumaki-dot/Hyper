/**
 * Speech Recognition and Text-To-Speech Manager for LUXION AI
 * Uses browser Web Speech API with fallback checks and permission management.
 */

export interface SpeechVoiceOption {
  name: string;
  lang: string;
  default: boolean;
  voiceURI?: string;
}

class SpeechManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any = null;
  private isListening: boolean = false;
  private onSpeakingChangeCallbacks: ((speaking: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
      }
    }
  }

  public isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public isSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getAvailableVoices(): SpeechVoiceOption[] {
    if (!this.synth) return [];
    const voices = this.synth.getVoices();
    const seen = new Set<string>();
    const result: SpeechVoiceOption[] = [];
    for (const v of voices) {
      const key = `${v.name}::${v.lang}::${v.voiceURI}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          name: v.name,
          lang: v.lang,
          default: v.default,
          voiceURI: v.voiceURI,
        });
      }
    }
    return result;
  }

  public onSpeakingChange(cb: (speaking: boolean) => void) {
    this.onSpeakingChangeCallbacks.push(cb);
    return () => {
      this.onSpeakingChangeCallbacks = this.onSpeakingChangeCallbacks.filter((c) => c !== cb);
    };
  }

  private notifySpeaking(speaking: boolean) {
    this.onSpeakingChangeCallbacks.forEach((cb) => cb(speaking));
  }

  /**
   * Speak text aloud using SpeechSynthesis
   */
  public speak(
    text: string,
    options: {
      voiceName?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ) {
    if (!this.synth) {
      options.onError?.(new Error('Speech synthesis is not supported in this browser.'));
      return;
    }

    // Cancel any active speech
    this.stopSpeaking();

    // Clean markdown before speaking
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted for speech.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[#*_~>\[\]\(\)\{\}\-+=|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;

      if (options.voiceName) {
        const voices = this.synth.getVoices();
        const selected = voices.find((v) => v.name === options.voiceName);
        if (selected) utterance.voice = selected;
      }

      utterance.onstart = () => {
        this.notifySpeaking(true);
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        this.notifySpeaking(false);
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        this.notifySpeaking(false);
        options.onError?.(e);
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } catch (err) {
      this.notifySpeaking(false);
      options.onError?.(err);
    }
  }

  public stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
      this.notifySpeaking(false);
    }
  }

  /**
   * Listen to user speech via microphone
   */
  public startListening(callbacks: {
    onResult: (transcript: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
  }): boolean {
    if (!this.isRecognitionSupported()) {
      callbacks.onError?.('Speech recognition is not supported in your browser.');
      return false;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          callbacks.onResult(finalTranscript, true);
        } else if (interimTranscript) {
          callbacks.onResult(interimTranscript, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        let msg = 'Speech recognition error';
        if (event.error === 'not-allowed') {
          msg = 'Microphone permission denied. Please allow microphone access.';
        } else if (event.error === 'no-speech') {
          msg = 'No speech detected. Please try speaking again.';
        } else if (event.error === 'network') {
          msg = 'Speech recognition network error.';
        }
        callbacks.onError?.(msg);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        callbacks.onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListening = false;
      callbacks.onError?.(err.message || 'Failed to start microphone recognition.');
      return false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speech = new SpeechManager();
