import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content Area with proper margin compensation for fixed sidebar */}
      <div className="md:ml-64">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Main Content */}
        <main className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[calc(100vh-8rem)]">
              <div className="p-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;