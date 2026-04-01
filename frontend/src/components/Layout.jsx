import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ChatBot from './ChatBot';

export default function Layout({ children, title }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-6 bg-grid">
          {children}
        </main>
      </div>
      
      <ChatBot />
    </div>
  );
}
