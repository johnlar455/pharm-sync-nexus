
import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
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

// User type definition
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is logged in from sessionStorage
    // In a real app, this would use Supabase auth.user
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);
  
  const handleLogout = () => {
    // Clear user from storage and state
    sessionStorage.removeItem('user');
    setUser(null);
  };
  
  if (isLoading) {
    return <div>Loading...</div>;
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
                <Route path="/" element={<DashboardPage />} />
                <Route path="/medicines" element={<MedicinesPage />} />
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
