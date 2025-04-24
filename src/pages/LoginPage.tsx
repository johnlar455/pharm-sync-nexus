
import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogin = (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulated login - in production, this would call Supabase auth
    setTimeout(() => {
      // Demo validation - simplistic approach for demo purposes
      const validCredentials = [
        { email: 'admin@pharmsync.com', password: 'admin123', role: 'admin' },
        { email: 'pharmacist@pharmsync.com', password: 'pharm123', role: 'pharmacist' },
        { email: 'cashier@pharmsync.com', password: 'cash123', role: 'cashier' },
      ];
      
      const user = validCredentials.find(
        (cred) => cred.email === email && cred.password === password
      );
      
      if (user) {
        // Store user info in sessionStorage (would be handled by Supabase in production)
        sessionStorage.setItem('user', JSON.stringify({
          id: crypto.randomUUID(),
          email: user.email,
          name: user.email.split('@')[0],
          role: user.role,
        }));
        
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${user.email.split('@')[0]}!`,
        });
        
        navigate('/');
      } else {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password. Please try again.',
          variant: 'destructive',
        });
      }
      
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
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
