import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/models';
import type { User } from '@supabase/supabase-js';
import { DealService } from '@/services/dealService';
import { queryClient } from '@/context/QueryProvider';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (!error && data) {
        setProfile(data as Profile);
      } else if (error) {
         console.error('Error fetching profile:', error.message, error.details, error.hint, error.code);
         if (error.code === '406' || (error as any).status === 406) {
           console.warn('HINT: Check if the "profiles" table exists and RLS allows select.');
         }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    const redirectTo = window.location.origin + import.meta.env.BASE_URL;
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      }
    });
  };

  const logout = async () => {
    // Clear session-level caches so a subsequent login starts fresh
    DealService.clearCache();
    queryClient.clear();
    return supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

