
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Clipboard, 
  ShoppingCart, 
  Users, 
  BarChart, 
  FileText, 
  Settings, 
  Menu, 
  X, 
  Database, 
  Book
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarItemProps = {
  to: string;
  icon: React.ElementType;
  label: string;
  currentPath: string;
};

const SidebarItem = ({ to, icon: Icon, label, currentPath }: SidebarItemProps) => {
  const isActive = currentPath === to;
  
  return (
    <Link 
      to={to} 
      className={cn(
        "sidebar-item hover:bg-pharmacy-100 hover:text-pharmacy-600 dark:hover:bg-pharmacy-700/20 dark:hover:text-pharmacy-300",
        isActive && "active"
      )}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
};

type SidebarProps = {
  className?: string;
};

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-200 dark:bg-gray-900 lg:static lg:translate-x-0",
          collapsed ? "-translate-x-full" : "translate-x-0",
          className
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-pharmacy-600 dark:text-pharmacy-400">
            <Package size={24} />
            <span>PharmSync</span>
          </Link>
          <button 
            onClick={toggleSidebar}
            className="rounded-full p-2 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>
        
        <nav className="space-y-6 p-4">
          <div className="space-y-1">
            <SidebarItem to="/dashboard" icon={Home} label="Dashboard" currentPath={location.pathname} />
            <SidebarItem to="/medicines" icon={Book} label="Medicines" currentPath={location.pathname} />
            <SidebarItem to="/inventory" icon={Package} label="Inventory" currentPath={location.pathname} />
            <SidebarItem to="/prescriptions" icon={Clipboard} label="Prescriptions" currentPath={location.pathname} />
            <SidebarItem to="/sales" icon={ShoppingCart} label="Sales" currentPath={location.pathname} />
          </div>
          
          <div>
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Management</h3>
            <div className="space-y-1">
              <SidebarItem to="/customers" icon={Users} label="Customers" currentPath={location.pathname} />
              <SidebarItem to="/suppliers" icon={Database} label="Suppliers" currentPath={location.pathname} />
              <SidebarItem to="/reports" icon={BarChart} label="Reports" currentPath={location.pathname} />
              <SidebarItem to="/invoices" icon={FileText} label="Invoices" currentPath={location.pathname} />
            </div>
          </div>
        </nav>
      </div>
      
      {/* Toggle button */}
      <button 
        onClick={toggleSidebar}
        className="fixed bottom-4 left-4 z-40 rounded-full bg-pharmacy-500 p-3 text-white shadow-lg lg:hidden"
      >
        <Menu size={18} />
      </button>
    </>
  );
}
