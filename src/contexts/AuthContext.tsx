
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'pharmacist' | 'cashier';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  handleLogout: () => Promise<void>;
  isAuthorized: (allowedRoles: string[]) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;

    // Check current session first
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          await fetchUserProfile(session.user);
        } else if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (!mounted) return;

        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (authUser: any) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', authUser.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
      }
      
      const role = (profile?.role as UserRole) || 'cashier';
      
      setUser({
        id: authUser.id,
        name: profile?.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        role: role,
        avatarUrl: authUser.user_metadata?.avatar_url,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Set user with basic info even if profile fetch fails
      setUser({
        id: authUser.id,
        name: authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        role: 'cashier',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthorized = (allowedRoles: string[]) => {
    return user && allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, handleLogout, isAuthorized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
