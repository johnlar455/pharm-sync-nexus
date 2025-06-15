
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Users, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pharmacy-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-pharmacy-600 p-4 rounded-full">
              <Package className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            PharmSync
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Complete Pharmacy Management System for modern pharmacies. 
            Manage inventory, sales, prescriptions, and customers all in one place.
          </p>
          <div className="space-x-4">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-pharmacy-600 hover:bg-pharmacy-700 text-white px-8 py-4 text-lg"
            >
              Try Demo (No Login Required)
            </Button>
            <Button 
              onClick={handleLogin}
              size="lg"
              variant="outline"
              className="border-pharmacy-600 text-pharmacy-600 hover:bg-pharmacy-600 hover:text-white px-8 py-4 text-lg"
            >
              Login to Account
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <Package className="h-12 w-12 text-pharmacy-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Inventory Management</h3>
            <p className="text-gray-600">Track stock levels, expiry dates, and automate reordering</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <ShoppingCart className="h-12 w-12 text-pharmacy-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sales Management</h3>
            <p className="text-gray-600">Process sales, manage prescriptions, and track payments</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <Users className="h-12 w-12 text-pharmacy-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Customer Management</h3>
            <p className="text-gray-600">Maintain customer records and prescription history</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <BarChart3 className="h-12 w-12 text-pharmacy-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Reports & Analytics</h3>
            <p className="text-gray-600">Generate insights and track business performance</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-pharmacy-600 text-white p-12 rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Pharmacy?</h2>
          <p className="text-xl mb-8 opacity-90">
            Start exploring with our demo or create your account
          </p>
          <div className="space-x-4">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              variant="secondary"
              className="bg-white text-pharmacy-600 hover:bg-gray-100"
            >
              Explore Demo
            </Button>
            <Button 
              onClick={handleLogin}
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-pharmacy-600"
            >
              Sign Up / Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
