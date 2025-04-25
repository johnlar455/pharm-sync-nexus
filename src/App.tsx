import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  Clipboard, 
  ShoppingCart, 
  Users, 
  BarChart, 
  FileText, 
  Settings, 
  Database, 
  Book 
} from 'lucide-react';

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MedicinesPage from "./pages/MedicinesPage";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";

const queryClient = new QueryClient();

// Update User type definition to use correct role types
type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'pharmacist' | 'cashier';
  avatarUrl?: string;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Get user profile data with proper type casting
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', session.user.id)
            .single();
          
          setUser({
            id: session.user.id,
            name: profile?.full_name || session.user.email?.split('@')[0] || '',
            email: session.user.email || '',
            role: (profile?.role as 'admin' | 'pharmacist' | 'cashier') || 'cashier',
            avatarUrl: session.user.user_metadata.avatar_url,
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            setUser({
              id: session.user.id,
              name: profile?.full_name || session.user.email?.split('@')[0] || '',
              email: session.user.email || '',
              role: (profile?.role as 'admin' | 'pharmacist' | 'cashier') || 'cashier',
              avatarUrl: session.user.user_metadata.avatar_url,
            });
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const isAuthorized = (allowedRoles: string[]) => {
    return user && allowedRoles.includes(user.role);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-pharmacy-200 border-t-pharmacy-600"></div>
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {user ? (
            <AppLayout user={user} onLogout={handleLogout}>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    isAuthorized(['admin', 'pharmacist']) ? (
                      <DashboardPage />
                    ) : (
                      <Navigate to="/sales" replace />
                    )
                  } 
                />
                <Route 
                  path="/medicines" 
                  element={
                    isAuthorized(['admin', 'pharmacist']) ? (
                      <MedicinesPage />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } 
                />
                <Route path="/inventory" element={
                  <PlaceholderPage 
                    title="Inventory" 
                    description="Manage your pharmacy inventory" 
                    icon={<Package size={24} />} 
                  />
                } />
                <Route path="/prescriptions" element={
                  <PlaceholderPage 
                    title="Prescriptions" 
                    description="Manage patient prescriptions" 
                    icon={<Clipboard size={24} />} 
                  />
                } />
                <Route path="/sales" element={
                  <PlaceholderPage 
                    title="Sales" 
                    description="Track and manage sales transactions" 
                    icon={<ShoppingCart size={24} />} 
                  />
                } />
                <Route path="/customers" element={
                  <PlaceholderPage 
                    title="Customers" 
                    description="Manage your customer database" 
                    icon={<Users size={24} />} 
                  />
                } />
                <Route path="/suppliers" element={
                  <PlaceholderPage 
                    title="Suppliers" 
                    description="Manage your supply chain" 
                    icon={<Database size={24} />} 
                  />
                } />
                <Route path="/reports" element={
                  <PlaceholderPage 
                    title="Reports" 
                    description="Generate and view business reports" 
                    icon={<BarChart size={24} />} 
                  />
                } />
                <Route path="/invoices" element={
                  <PlaceholderPage 
                    title="Invoices" 
                    description="Manage sales and purchase invoices" 
                    icon={<FileText size={24} />} 
                  />
                } />
                <Route path="/settings" element={
                  <PlaceholderPage 
                    title="Settings" 
                    description="Configure system settings" 
                    icon={<Settings size={24} />} 
                  />
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          ) : (
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
