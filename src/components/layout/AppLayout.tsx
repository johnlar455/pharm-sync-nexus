
import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

type AppLayoutProps = {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  onLogout: () => void;
};

export function AppLayout({ children, user, onLogout }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar className="flex-shrink-0" />
      
      <div className="flex-1">
        <Header user={user} onLogout={onLogout} />
        
        <main className="container mx-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
