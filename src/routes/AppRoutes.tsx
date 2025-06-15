
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

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

const GuestUser = {
  id: 'guest',
  name: 'Guest User',
  email: 'guest@example.com',
  role: 'cashier' as const
};

export const AppRoutes: React.FC = () => {
  const { user, handleLogout } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Dashboard and app routes - accessible with or without auth */}
      <Route path="/dashboard" element={
        <AppLayout 
          user={user || GuestUser} 
          onLogout={user ? handleLogout : () => {}}
        >
          <DashboardPage />
        </AppLayout>
      } />
      
      <Route path="/medicines" element={
        <AppLayout 
          user={user || GuestUser} 
          onLogout={user ? handleLogout : () => {}}
        >
          <MedicinesPage />
        </AppLayout>
      } />
      
      <Route path="/inventory" element={
        <AppLayout 
          user={user || GuestUser} 
          onLogout={user ? handleLogout : () => {}}
        >
          <InventoryPage />
        </AppLayout>
      } />
      
      <Route path="/prescriptions" element={
        <AppLayout 
          user={user || GuestUser} 
          onLogout={user ? handleLogout : () => {}}
        >
          <PrescriptionsPage />
        </AppLayout>
      } />
      
      <Route path="/sales" element={
        <AppLayout 
          user={user || GuestUser} 
          onLogout={user ? handleLogout : () => {}}
        >
          <SalesPage />
        </AppLayout>
      } />
      
      <Route path="/customers" element={
        <AppLayout 
          user={user || GuestUser} 
          onLogout={user ? handleLogout : () => {}}
        >
          <CustomersPage />
        </AppLayout>
      } />
      
      <Route path="/suppliers" element={
        <AppLayout 
          user={user || GuestUser} 
          onLogout={user ? handleLogout : () => {}}
        >
          <SuppliersPage />
        </AppLayout>
      } />
      
      <Route path="/reports" element={
        <AppLayout 
          user={user || GuestUser} 
          onLogout={user ? handleLogout : () => {}}
        >
          <ReportsPage />
        </AppLayout>
      } />
      
      <Route path="/invoices" element={
        <AppLayout 
          user={user || GuestUser} 
          onLogout={user ? handleLogout : () => {}}
        >
          <InvoicesPage />
        </AppLayout>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
