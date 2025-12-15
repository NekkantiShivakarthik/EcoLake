import { supabase } from '@/lib/supabase';
import { User } from '@/types/database';
import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, role?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from our users table
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data as User;
  };

  // Create user profile if doesn't exist
  const createUserProfile = async (userId: string, email: string, name: string, role: string = 'reporter') => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          name,
          role,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        } as any)
        .select()
        .single();

      if (error) {
        // Check if error is due to existing profile
        if (error.code === '23505') {
          console.log('User profile already exists');
          return await fetchUserProfile(userId);
        }
        console.error('Error creating user profile:', error);
        return null;
      }
      return data as User;
    } catch (err) {
      console.error('Exception creating user profile:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        console.log('Session retrieved:', session ? 'User logged in' : 'No session found');

        if (mounted) {
          setSession(session);
          if (session?.user) {
            console.log('Fetching user profile for:', session.user.email);
            const profile = await fetchUserProfile(session.user.id);
            setUser(profile);
            console.log('User profile loaded:', profile?.name);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (mounted) {
        setSession(session);
        
        if (session?.user) {
          let profile = await fetchUserProfile(session.user.id);
          
          // If profile doesn't exist and user just signed up, create it
          if (!profile && event === 'SIGNED_IN') {
            const metadata = session.user.user_metadata;
            profile = await createUserProfile(
              session.user.id,
              session.user.email || '',
              metadata?.name || session.user.email?.split('@')[0] || 'User',
              metadata?.role || 'reporter'
            );
          }
          
          setUser(profile);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, name: string, role: string = 'reporter') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    // Profile will be created automatically by database trigger
    // The trigger handles profile creation with proper permissions
    
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id);
      setUser(profile);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
