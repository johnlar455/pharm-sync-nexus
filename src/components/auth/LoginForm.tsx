
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof formSchema>;

type LoginFormProps = {
  onLogin: (email: string, password: string) => void;
  isLoading?: boolean;
};

export function LoginForm({ onLogin, isLoading = false }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  
  // Demo accounts
  const demoAccounts = [
    { email: 'admin@pharmsync.com', password: 'admin123', role: 'Admin' },
    { email: 'pharmacist@pharmsync.com', password: 'pharm123', role: 'Pharmacist' },
    { email: 'cashier@pharmsync.com', password: 'cash123', role: 'Cashier' },
  ];
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    onLogin(data.email, data.password);
  };

  const handleDemoLogin = (account: { email: string; password: string; role: string }) => {
    form.setValue('email', account.email);
    form.setValue('password', account.password);
    
    // Toast notification
    toast({
      title: `${account.role} Demo Account`,
      description: 'Credentials filled. Click Login to continue.',
    });
  };

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pharmacy-100">
          <Package className="h-6 w-6 text-pharmacy-600" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">PharmSync</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-password"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="rounded border-gray-300"
            />
            <label htmlFor="show-password" className="text-sm text-gray-600">
              Show password
            </label>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Form>

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Demo Accounts
            </span>
          </div>
        </div>
        
        <div className="grid gap-2">
          {demoAccounts.map((account) => (
            <Button 
              key={account.email} 
              variant="outline" 
              type="button"
              onClick={() => handleDemoLogin(account)}
            >
              Login as {account.role}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
