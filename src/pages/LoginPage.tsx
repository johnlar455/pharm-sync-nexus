
import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
        
        // Navigate immediately without waiting for profile
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-br from-pharmacy-50 to-white">
      <div className="w-full max-w-md space-y-8">
        <LoginForm onLogin={handleLogin} isLoading={isLoading} />
        
        <div className="text-center text-sm text-gray-500">
          <p>PharmSync Pharmacy Management System</p>
          <p>v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
