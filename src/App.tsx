
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
import InventoryPage from "./pages/InventoryPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import SalesPage from "./pages/SalesPage";
import CustomersPage from "./pages/CustomersPage";
import SuppliersPage from "./pages/SuppliersPage";
import ReportsPage from "./pages/ReportsPage";
import InvoicesPage from "./pages/InvoicesPage";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";

const queryClient = new QueryClient();

// Define valid role types
type UserRole = 'admin' | 'pharmacist' | 'cashier';

// Update User type definition to use correct role types
type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
          
          // Ensure the role is properly typed as UserRole
          const role = profile?.role as UserRole || 'cashier';
          
          setUser({
            id: session.user.id,
            name: profile?.full_name || session.user.email?.split('@')[0] || '',
            email: session.user.email || '',
            role: role,
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
            // Ensure the role is properly typed as UserRole
            const role = profile?.role as UserRole || 'cashier';
            
            setUser({
              id: session.user.id,
              name: profile?.full_name || session.user.email?.split('@')[0] || '',
              email: session.user.email || '',
              role: role,
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
                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* Dashboard route */}
                <Route 
                  path="/dashboard" 
                  element={
                    isAuthorized(['admin', 'pharmacist']) ? (
                      <DashboardPage />
                    ) : (
                      <Navigate to="/sales" replace />
                    )
                  } 
                />
                
                {/* Medicines route */}
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
                
                {/* Inventory route */}
                <Route 
                  path="/inventory" 
                  element={
                    isAuthorized(['admin', 'pharmacist']) ? (
                      <InventoryPage />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                
                {/* Prescriptions route */}
                <Route 
                  path="/prescriptions" 
                  element={
                    isAuthorized(['admin', 'pharmacist']) ? (
                      <PrescriptionsPage />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                
                {/* Sales route */}
                <Route path="/sales" element={<SalesPage />} />
                
                {/* Customers route */}
                <Route path="/customers" element={<CustomersPage />} />
                
                {/* Suppliers route */}
                <Route path="/suppliers" element={<SuppliersPage />} />
                
                {/* Reports route */}
                <Route 
                  path="/reports" 
                  element={
                    isAuthorized(['admin', 'pharmacist']) ? (
                      <ReportsPage />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } 
                />
                
                {/* Invoices route */}
                <Route path="/invoices" element={<InvoicesPage />} />
                
                {/* Settings route */}
                <Route 
                  path="/settings" 
                  element={
                    isAuthorized(['admin']) ? (
                      <PlaceholderPage 
                        title="Settings" 
                        description="Configure system settings" 
                        icon={<Settings size={24} />} 
                      />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                
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
