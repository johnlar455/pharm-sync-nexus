
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import MedicinesPage from '@/pages/MedicinesPage';
import InventoryPage from '@/pages/InventoryPage';
import PrescriptionsPage from '@/pages/PrescriptionsPage';
import SalesPage from '@/pages/SalesPage';
import CustomersPage from '@/pages/CustomersPage';
import SuppliersPage from '@/pages/SuppliersPage';
import ReportsPage from '@/pages/ReportsPage';
import InvoicesPage from '@/pages/InvoicesPage';
import NotFound from '@/pages/NotFound';
import PlaceholderPage from '@/pages/PlaceholderPage';
import { Settings } from 'lucide-react';

export const AppRoutes: React.FC = () => {
  const { user, handleLogout } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes with layout */}
      <Route path="/dashboard" element={
        user ? (
          <AppLayout user={user} onLogout={handleLogout}>
            <DashboardPage />
          </AppLayout>
        ) : (
          <AppLayout 
            user={{ name: 'Guest', email: 'guest@example.com', role: 'cashier' }} 
            onLogout={() => {}}
          >
            <DashboardPage />
          </AppLayout>
        )
      } />
      
      <Route path="/medicines" element={
        <AppLayout 
          user={user || { name: 'Guest', email: 'guest@example.com', role: 'cashier' }} 
          onLogout={user ? handleLogout : () => {}}
        >
          <MedicinesPage />
        </AppLayout>
      } />
      
      <Route path="/inventory" element={
        <AppLayout 
          user={user || { name: 'Guest', email: 'guest@example.com', role: 'cashier' }} 
          onLogout={user ? handleLogout : () => {}}
        >
          <InventoryPage />
        </AppLayout>
      } />
      
      <Route path="/prescriptions" element={
        <AppLayout 
          user={user || { name: 'Guest', email: 'guest@example.com', role: 'cashier' }} 
          onLogout={user ? handleLogout : () => {}}
        >
          <PrescriptionsPage />
        </AppLayout>
      } />
      
      <Route path="/sales" element={
        <AppLayout 
          user={user || { name: 'Guest', email: 'guest@example.com', role: 'cashier' }} 
          onLogout={user ? handleLogout : () => {}}
        >
          <SalesPage />
        </AppLayout>
      } />
      
      <Route path="/customers" element={
        <AppLayout 
          user={user || { name: 'Guest', email: 'guest@example.com', role: 'cashier' }} 
          onLogout={user ? handleLogout : () => {}}
        >
          <CustomersPage />
        </AppLayout>
      } />
      
      <Route path="/suppliers" element={
        <AppLayout 
          user={user || { name: 'Guest', email: 'guest@example.com', role: 'cashier' }} 
          onLogout={user ? handleLogout : () => {}}
        >
          <SuppliersPage />
        </AppLayout>
      } />
      
      <Route path="/reports" element={
        <AppLayout 
          user={user || { name: 'Guest', email: 'guest@example.com', role: 'cashier' }} 
          onLogout={user ? handleLogout : () => {}}
        >
          <ReportsPage />
        </AppLayout>
      } />
      
      <Route path="/invoices" element={
        <AppLayout 
          user={user || { name: 'Guest', email: 'guest@example.com', role: 'cashier' }} 
          onLogout={user ? handleLogout : () => {}}
        >
          <InvoicesPage />
        </AppLayout>
      } />
      
      <Route path="/settings" element={
        user ? (
          <AppLayout user={user} onLogout={handleLogout}>
            <ProtectedRoute allowedRoles={['admin']}>
              <PlaceholderPage 
                title="Settings" 
                description="Configure system settings" 
                icon={<Settings size={24} />} 
              />
            </ProtectedRoute>
          </AppLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
