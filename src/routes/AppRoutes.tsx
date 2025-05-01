
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Pages
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

  return user ? (
    <AppLayout user={user} onLogout={handleLogout}>
      <Routes>
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'pharmacist']} redirectTo="/sales">
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Medicines route */}
        <Route 
          path="/medicines" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'pharmacist']}>
              <MedicinesPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Inventory route */}
        <Route 
          path="/inventory" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'pharmacist']}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        
        {/* Prescriptions route */}
        <Route 
          path="/prescriptions" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'pharmacist']}>
              <PrescriptionsPage />
            </ProtectedRoute>
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
            <ProtectedRoute allowedRoles={['admin', 'pharmacist']}>
              <ReportsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Invoices route */}
        <Route path="/invoices" element={<InvoicesPage />} />
        
        {/* Settings route */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PlaceholderPage 
                title="Settings" 
                description="Configure system settings" 
                icon={<Settings size={24} />} 
              />
            </ProtectedRoute>
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
  );
};
