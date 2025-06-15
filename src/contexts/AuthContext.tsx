
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define valid role types
export type UserRole = 'admin' | 'pharmacist' | 'cashier';

// Update User type definition to use correct role types
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
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (session?.user) {
          // Defer profile fetching to avoid potential deadlocks
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, role')
                .eq('id', session.user.id)
                .single();
              
              const role = profile?.role as UserRole || 'cashier';
              
              setUser({
                id: session.user.id,
                name: profile?.full_name || session.user.email?.split('@')[0] || '',
                email: session.user.email || '',
                role: role,
                avatarUrl: session.user.user_metadata.avatar_url,
              });
            } catch (error) {
              console.error('Error fetching profile:', error);
              // Set user with basic info even if profile fetch fails
              setUser({
                id: session.user.id,
                name: session.user.email?.split('@')[0] || '',
                email: session.user.email || '',
                role: 'cashier',
              });
            }
          }, 0);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Use the same deferred approach for initial session
        setTimeout(async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, role')
              .eq('id', session.user.id)
              .single();
            
            const role = profile?.role as UserRole || 'cashier';
            
            setUser({
              id: session.user.id,
              name: profile?.full_name || session.user.email?.split('@')[0] || '',
              email: session.user.email || '',
              role: role,
              avatarUrl: session.user.user_metadata.avatar_url,
            });
          } catch (error) {
            console.error('Error fetching profile:', error);
            setUser({
              id: session.user.id,
              name: session.user.email?.split('@')[0] || '',
              email: session.user.email || '',
              role: 'cashier',
            });
          }
          setIsLoading(false);
        }, 0);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
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
