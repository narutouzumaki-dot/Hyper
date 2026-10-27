import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Conversation, UserProfile } from '../types';

class SupabaseService {
  private client: SupabaseClient | null = null;
  private currentUrl: string = '';
  private currentKey: string = '';

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage() {
    if (typeof window === 'undefined') return;
    const url = localStorage.getItem('luxion_supabase_url') || '';
    const key = localStorage.getItem('luxion_supabase_key') || '';
    if (url && key) {
      this.init(url, key);
    }
  }

  public init(url: string, anonKey: string): boolean {
    if (!url || !anonKey) {
      this.client = null;
      this.currentUrl = '';
      this.currentKey = '';
      return false;
    }
    try {
      this.client = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      this.currentUrl = url;
      this.currentKey = anonKey;
      localStorage.setItem('luxion_supabase_url', url);
      localStorage.setItem('luxion_supabase_key', anonKey);
      return true;
    } catch (e) {
      console.error('[Supabase Init Error]', e);
      this.client = null;
      return false;
    }
  }

  public disconnect() {
    this.client = null;
    this.currentUrl = '';
    this.currentKey = '';
    localStorage.removeItem('luxion_supabase_url');
    localStorage.removeItem('luxion_supabase_key');
  }

  public isConfigured(): boolean {
    return !!this.client;
  }

  public getCredentials(): { url: string; key: string } {
    return { url: this.currentUrl, key: this.currentKey };
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      return { success: false, message: 'Supabase URL or Anon Key is missing.' };
    }
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Successfully connected to Supabase Auth & Cloud Database.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network connection to Supabase failed.' };
    }
  }

  public async signUp(email: string, password: string, displayName: string): Promise<{ user: User | null; error: string | null }> {
    if (!this.client) {
      return { user: null, error: 'Supabase is not configured. Please add your credentials in Settings.' };
    }
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
          },
        },
      });
      if (error) return { user: null, error: error.message };
      return { user: data.user, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Sign up failed.' };
    }
  }

  public async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    if (!this.client) {
      return { user: null, error: 'Supabase is not configured. Please add your credentials in Settings.' };
    }
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { user: null, error: error.message };
      return { user: data.user, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Sign in failed.' };
    }
  }

  public async signOut(): Promise<{ error: string | null }> {
    if (!this.client) return { error: null };
    try {
      const { error } = await this.client.auth.signOut();
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  public async resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
    if (!this.client) {
      return { success: false, error: 'Supabase is not configured.' };
    }
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async getCurrentUser(): Promise<UserProfile | null> {
    if (!this.client) return null;
    try {
      const { data } = await this.client.auth.getUser();
      if (!data.user) return null;
      return {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'LUXION Operative',
        avatarUrl: data.user.user_metadata?.avatar_url,
        isGuest: false,
      };
    } catch {
      return null;
    }
  }

  // Cloud Database Sync: Conversations
  public async loadConversations(): Promise<Conversation[] | null> {
    if (!this.client) return null;
    try {
      const { data: { user } } = await this.client.auth.getUser();
      if (!user) return null;

      const { data: convs, error } = await this.client
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error || !convs) return null;

      const result: Conversation[] = [];
      for (const c of convs) {
        const { data: msgs } = await this.client
          .from('messages')
          .select('*')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: true });

        result.push({
          id: c.id,
          title: c.title,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          messages: (msgs || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.created_at,
          })),
        });
      }
      return result;
    } catch (e) {
      console.warn('[Supabase loadConversations fallback]', e);
      return null;
    }
  }

  public async saveConversation(conv: Conversation): Promise<boolean> {
    if (!this.client) return false;
    try {
      const { data: { user } } = await this.client.auth.getUser();
      if (!user) return false;

      // Upsert conversation
      const { error: convErr } = await this.client
        .from('conversations')
        .upsert({
          id: conv.id,
          user_id: user.id,
          title: conv.title,
          updated_at: new Date().toISOString(),
        });

      if (convErr) {
        console.warn('[Supabase saveConversation error]', convErr);
        return false;
      }

      // Upsert latest messages if any
      if (conv.messages.length > 0) {
        const msgsToUpsert = conv.messages.map((m) => ({
          id: m.id,
          conversation_id: conv.id,
          user_id: user.id,
          role: m.role,
          content: m.content,
          created_at: m.timestamp || new Date().toISOString(),
        }));
        await this.client.from('messages').upsert(msgsToUpsert);
      }
      return true;
    } catch (e) {
      console.warn('[Supabase saveConversation failure]', e);
      return false;
    }
  }

  public async deleteConversation(convId: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const { error } = await this.client
        .from('conversations')
        .delete()
        .eq('id', convId);
      return !error;
    } catch {
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();
